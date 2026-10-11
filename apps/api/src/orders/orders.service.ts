import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MIDTRANS_SNAP } from '../payments/midtrans.provider';
import { createHash } from 'crypto';

type SnapClient = {
  createTransaction: (payload: unknown) => Promise<{
    token: string;
    redirect_url: string;
  }>;
  transaction: {
    status: (orderId: string) => Promise<Record<string, string>>;
  };
};

const orderInclude = {
  address: true,
  payment: true,
  subOrders: {
    include: {
      store: { select: { id: true, name: true } },
      items: true,
    },
  },
} as const;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(MIDTRANS_SNAP) private readonly snap: SnapClient,
  ) {}

  async checkout(userId: string, addressId: string) {
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });
    if (!address || address.userId !== userId) {
      throw new NotFoundException('Alamat tidak ditemukan');
    }

    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Keranjang kosong');
    }

    // cek stok semua item dulu sebelum membuat apa pun
    for (const item of cart.items) {
      if (!item.product.isActive || item.quantity > item.product.stock) {
        throw new BadRequestException(
          `Stok "${item.product.name}" tidak mencukupi`,
        );
      }
    }

    // kelompokkan item per toko
    const byStore = new Map<string, typeof cart.items>();
    for (const item of cart.items) {
      const list = byStore.get(item.product.storeId) ?? [];
      list.push(item);
      byStore.set(item.product.storeId, list);
    }

    const totalAmount = cart.items.reduce(
      (sum, i) => sum + i.quantity * i.product.price,
      0,
    );
    const orderCode = this.generateOrderCode();

    // transaksi: buat order, sub-order, order item, kurangi stok, kosongkan keranjang
    const order = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          code: orderCode,
          buyerId: userId,
          addressId,
          totalAmount,
        },
      });

      for (const [storeId, items] of byStore) {
        const subtotal = items.reduce(
          (sum, i) => sum + i.quantity * i.product.price,
          0,
        );
        const subOrder = await tx.subOrder.create({
          data: { orderId: order.id, storeId, subtotal },
        });

        for (const item of items) {
          await tx.orderItem.create({
            data: {
              subOrderId: subOrder.id,
              productId: item.productId,
              productName: item.product.name,
              price: item.product.price,
              quantity: item.quantity,
            },
          });
          const res = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (res.count === 0) {
            throw new BadRequestException(
              `Stok "${item.product.name}" tidak mencukupi`,
            );
          }
        }
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return order;
    });

    const buyer = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    let snapResponse: Awaited<ReturnType<SnapClient['createTransaction']>>;
    try {
      snapResponse = await this.snap.createTransaction({
        transaction_details: {
        order_id: orderCode,
        gross_amount: totalAmount,
      },
      customer_details: {
        first_name: buyer.name,
        email: buyer.email,
        phone: address.phone,
      },
      callbacks: {
        finish: `${this.config.get('WEB_URL') ?? 'http://localhost:5173'}/pesanan/${order.id}`,
      },
      });
    } catch {
      await this.cancelAndRestock(order.id);
      throw new BadGatewayException(
        'Gagal membuat transaksi pembayaran, coba lagi',
      );
    }
      
    await this.prisma.payment.create({
      data: {
        orderId: order.id,
        gatewayOrderId: orderCode,
        amount: totalAmount,
      },
    });

    return {
      orderId: order.id,
      orderCode,
      snapToken: snapResponse.token,
      redirectUrl: snapResponse.redirect_url,
    };
  }

  async findMine(userId: string) {
    return this.prisma.order.findMany({
      where: { buyerId: userId },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    let order = await this.prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });
    if (!order || order.buyerId !== userId) {
      throw new NotFoundException('Pesanan tidak ditemukan');
    }

    // cadangan kalau webhook belum masuk: tanya langsung status ke Midtrans
    if (order.payment?.status === 'PENDING') {
      try {
        const status = await this.snap.transaction.status(order.code);
        await this.handlePaymentNotification(status as never);
        order = await this.prisma.order.findUniqueOrThrow({
          where: { id },
          include: orderInclude,
        });
      } catch {
        // transaksi belum ada di Midtrans atau gagal dicek, abaikan
      }
    }
    return order;
  }

  // dipanggil oleh webhook Midtrans, lihat payments.controller.ts
  async handlePaymentNotification(payload: {
    order_id: string;
    transaction_status: string;
    status_code: string;
    gross_amount: string;
    signature_key: string;
    fraud_status?: string;
    payment_type?: string;
  }) {
    const expected = createHash('sha512')
      .update(
        `${payload.order_id}${payload.status_code}${payload.gross_amount}${this.config.getOrThrow<string>('MIDTRANS_SERVER_KEY')}`,
      )
      .digest('hex');
    if (expected !== payload.signature_key) {
      throw new ForbiddenException('Signature tidak valid');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { gatewayOrderId: payload.order_id },
    });
    if (!payment) return; // notifikasi tidak dikenal, abaikan
    if (payment.status !== 'PENDING') return; // sudah diproses, abaikan duplikat
    if (Number(payload.gross_amount) !== payment.amount) return;

    const isSuccess =
      payload.transaction_status === 'settlement' ||
      (payload.transaction_status === 'capture' &&
        payload.fraud_status === 'accept');
    const isFailed = ['deny', 'cancel', 'expire'].includes(
      payload.transaction_status,
    );

    if (!isSuccess && !isFailed) return; // status pending, belum final

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: isSuccess ? 'PAID' : 'FAILED',
          method: payload.payment_type,
          rawPayload: payload,
          paidAt: isSuccess ? new Date() : null,
        },
      });
      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: isSuccess ? 'PAID' : 'CANCELLED' },
      });
      await tx.subOrder.updateMany({
        where: { orderId: payment.orderId },
        data: { status: isSuccess ? 'PAID' : 'CANCELLED' },
      });

      // kalau gagal/expired, kembalikan stok
      if (isFailed) {
        const items = await tx.orderItem.findMany({
          where: { subOrder: { orderId: payment.orderId } },
        });
        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
    });
  }

    private async cancelAndRestock(orderId: string) {
    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
      });
      await tx.subOrder.updateMany({
        where: { orderId },
        data: { status: 'CANCELLED' },
      });
      const items = await tx.orderItem.findMany({
        where: { subOrder: { orderId } },
      });
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    });
  }

  private generateOrderCode() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
    return `TSR-${date}-${rand}`;
  }
}
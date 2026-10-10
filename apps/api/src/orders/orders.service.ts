import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MIDTRANS_SNAP } from '../payments/midtrans.provider';

type SnapClient = {
  createTransaction: (payload: unknown) => Promise<{
    token: string;
    redirect_url: string;
  }>;
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
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return order;
    });

    const buyer = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    const snapResponse = await this.snap.createTransaction({
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
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });
    if (!order || order.buyerId !== userId) {
      throw new NotFoundException('Pesanan tidak ditemukan');
    }
    return order;
  }

  // dipanggil oleh webhook Midtrans, lihat payments.controller.ts
  async handlePaymentNotification(payload: {
    order_id: string;
    transaction_status: string;
    fraud_status?: string;
    payment_type?: string;
  }) {
    const payment = await this.prisma.payment.findUnique({
      where: { gatewayOrderId: payload.order_id },
    });
    if (!payment) return; // notifikasi tidak dikenal, abaikan

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

  private generateOrderCode() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
    return `TSR-${date}-${rand}`;
  }
}
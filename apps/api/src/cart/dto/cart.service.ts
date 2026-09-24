import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const cartInclude = {
  items: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          unit: true,
          stock: true,
          imageUrl: true,
          isActive: true,
          store: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { id: 'asc' as const },
  },
};

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    return this.prisma.cart.findUnique({
      where: { id: cart.id },
      include: cartInclude,
    });
  }

  async addItem(userId: string, productId: string, quantity: number) {
    const cart = await this.getOrCreateCart(userId);
    const product = await this.getBuyableProductOrThrow(productId);

    const existing = await this.prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });

    const nextQty = (existing?.quantity ?? 0) + quantity;
    if (nextQty > product.stock) {
      throw new BadRequestException(`Stok tersisa ${product.stock}`);
    }

    await this.prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      update: { quantity: nextQty },
      create: { cartId: cart.id, productId, quantity: nextQty },
    });

    return this.get(userId);
  }

  async updateItem(userId: string, itemId: string, quantity: number) {
    const item = await this.getOwnedItemOrThrow(userId, itemId);
    if (quantity > item.product.stock) {
      throw new BadRequestException(`Stok tersisa ${item.product.stock}`);
    }
    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });
    return this.get(userId);
  }

  async removeItem(userId: string, itemId: string) {
    await this.getOwnedItemOrThrow(userId, itemId);
    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return this.get(userId);
  }

  private async getOrCreateCart(userId: string) {
    return this.prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  private async getBuyableProductOrThrow(productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, isActive: true, store: { status: 'ACTIVE' } },
    });
    if (!product) throw new NotFoundException('Produk tidak ditemukan');
    if (product.stock < 1) throw new BadRequestException('Stok habis');
    return product;
  }

  private async getOwnedItemOrThrow(userId: string, itemId: string) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { product: true, cart: true },
    });
    if (!item) throw new NotFoundException('Item tidak ditemukan');
    if (item.cart.userId !== userId) {
      throw new ForbiddenException('Bukan keranjang kamu');
    }
    return item;
  }
}
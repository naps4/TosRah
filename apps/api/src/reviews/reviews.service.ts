import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertReviewDto } from './dto/review.dto';

// "Nugroho Adi Pamungkas" -> "Nugroho P."
function maskName(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getProductOrThrow(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, isActive: true },
      select: { id: true },
    });
    if (!product) throw new NotFoundException('Produk tidak ditemukan');
    return product;
  }

  // hanya pembeli dengan pesanan yang sudah dibayar yang boleh mengulas
  private async hasPurchased(userId: string, productId: string) {
    const item = await this.prisma.orderItem.findFirst({
      where: {
        productId,
        subOrder: {
          status: { in: ['PAID', 'PACKED', 'SHIPPED', 'DONE'] },
          order: { buyerId: userId },
        },
      },
      select: { id: true },
    });
    return !!item;
  }

  async list(slug: string, page = 1, limit = 5) {
    const product = await this.getProductOrThrow(slug);
    const where = { productId: product.id };

    const [items, total, groups] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.review.count({ where }),
      this.prisma.review.groupBy({
        by: ['rating'],
        where,
        _count: { _all: true },
        orderBy: { rating: 'asc' },
      }),
    ]);

    return {
      items: items.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        userName: maskName(r.user.name),
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      distribution: [5, 4, 3, 2, 1].map((star) => ({
        star,
        count: groups.find((g) => g.rating === star)?._count._all ?? 0,
      })),
    };
  }

  // status ulasan milik user yang login: boleh mengulas atau tidak, dan ulasan lamanya
  async mine(slug: string, userId: string) {
    const product = await this.getProductOrThrow(slug);
    const [canReview, review] = await Promise.all([
      this.hasPurchased(userId, product.id),
      this.prisma.review.findUnique({
        where: { userId_productId: { userId, productId: product.id } },
        select: { id: true, rating: true, comment: true },
      }),
    ]);
    return { canReview, review };
  }

  async upsert(slug: string, userId: string, dto: UpsertReviewDto) {
    const product = await this.getProductOrThrow(slug);
    if (!(await this.hasPurchased(userId, product.id))) {
      throw new ForbiddenException(
        'Hanya pembeli produk ini yang bisa memberi ulasan',
      );
    }

    const comment = dto.comment?.trim() || null;

    return this.prisma.$transaction(async (tx) => {
      const review = await tx.review.upsert({
        where: { userId_productId: { userId, productId: product.id } },
        create: { userId, productId: product.id, rating: dto.rating, comment },
        update: { rating: dto.rating, comment },
      });

      const agg = await tx.review.aggregate({
        where: { productId: product.id },
        _avg: { rating: true },
        _count: { _all: true },
      });
      await tx.product.update({
        where: { id: product.id },
        data: {
          ratingAvg: Math.round((agg._avg.rating ?? 0) * 10) / 10,
          ratingCount: agg._count._all,
        },
      });

      return review;
    });
  }
}
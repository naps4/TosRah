import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { uniqueSlug } from '../common/slug.util';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateProductDto,
  ListProductsQueryDto,
  UpdateProductDto,
} from './dto/product.dto';

const productInclude = {
  store: { select: { id: true, name: true, slug: true, city: true } },
  category: { select: { id: true, name: true, slug: true } },
} as const;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // ===== katalog publik =====

  async list(query: ListProductsQueryDto) {
    const { q, category, page = 1, limit = 12 } = query;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      store: { status: 'ACTIVE' },
      ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
      ...(category ? { category: { slug: category } } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: productInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, isActive: true, store: { status: 'ACTIVE' } },
      include: productInclude,
    });
    if (!product) throw new NotFoundException('Produk tidak ditemukan');
    return product;
  }

  // ===== khusus penjual =====

  async create(userId: string, dto: CreateProductDto) {
    const storeId = await this.getActiveStoreId(userId);
    await this.ensureCategory(dto.categoryId);
    await this.ensureNameNotTaken(storeId, dto.name);
    return this.prisma.product.create({
      data: { ...dto, storeId, slug: uniqueSlug(dto.name) },
    });
  }

  async listMine(userId: string) {
    const storeId = await this.getActiveStoreId(userId);
    return this.prisma.product.findMany({
      where: { storeId },
      include: { category: { select: { id: true, name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(userId: string, id: string, dto: UpdateProductDto) {
    const storeId = await this.getActiveStoreId(userId);
    await this.getOwnedProductOrThrow(id, storeId);
    if (dto.categoryId) await this.ensureCategory(dto.categoryId);
    if (dto.name) await this.ensureNameNotTaken(storeId, dto.name, id);
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  // soft delete: produk disembunyikan, bukan dihapus,
  // karena riwayat order masih merujuk ke produk ini
  async remove(userId: string, id: string) {
    const storeId = await this.getActiveStoreId(userId);
    await this.getOwnedProductOrThrow(id, storeId);
    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ===== helper =====

  private async getActiveStoreId(userId: string) {
    const store = await this.prisma.store.findUnique({
      where: { ownerId: userId },
    });
    if (!store || store.status !== 'ACTIVE') {
      throw new ForbiddenException('Tokomu belum aktif');
    }
    return store.id;
  }

  private async getOwnedProductOrThrow(id: string, storeId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, storeId },
    });
    if (!product) throw new NotFoundException('Produk tidak ditemukan');
    return product;
  }

  private async ensureCategory(categoryId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) throw new BadRequestException('Kategori tidak ditemukan');
  }
    private async ensureNameNotTaken(
    storeId: string,
    name: string,
    excludeId?: string,
  ) {
    const existing = await this.prisma.product.findFirst({
      where: {
        storeId,
        isActive: true,
        name: { equals: name.trim(), mode: 'insensitive' },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (existing) {
      throw new ConflictException(
        `Kamu sudah punya produk bernama "${name}". Edit produk itu saja, tidak perlu bikin baru.`,
      );
    }
  }
}
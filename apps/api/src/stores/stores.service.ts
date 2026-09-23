import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreDto, StoreStatusName } from './dto/store.dto';

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateStoreDto) {
    const existing = await this.prisma.store.findUnique({
      where: { ownerId: userId },
    });

    if (existing && existing.status !== 'REJECTED') {
      throw new ConflictException('Kamu sudah mengajukan atau punya toko');
    }

    // pernah ditolak -> boleh mengajukan ulang
    if (existing) {
      return this.prisma.store.update({
        where: { id: existing.id },
        data: { ...dto, status: 'PENDING', rejectReason: null },
      });
    }

    return this.prisma.store.create({
      data: { ...dto, ownerId: userId, slug: this.makeSlug(dto.name) },
    });
  }

  findMine(userId: string) {
    return this.prisma.store.findUnique({ where: { ownerId: userId } });
  }

  list(status?: StoreStatusName) {
    return this.prisma.store.findMany({
      where: status ? { status } : undefined,
      include: { owner: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(id: string) {
    const store = await this.getPendingOrThrow(id);
    // dua perubahan harus berhasil bersamaan (transaksi)
    const [updated] = await this.prisma.$transaction([
      this.prisma.store.update({
        where: { id },
        data: { status: 'ACTIVE', approvedAt: new Date(), rejectReason: null },
      }),
      this.prisma.user.update({
        where: { id: store.ownerId },
        data: { role: 'SELLER' },
      }),
    ]);
    return updated;
  }

  async reject(id: string, reason: string) {
    await this.getPendingOrThrow(id);
    return this.prisma.store.update({
      where: { id },
      data: { status: 'REJECTED', rejectReason: reason },
    });
  }

  private async getPendingOrThrow(id: string) {
    const store = await this.prisma.store.findUnique({ where: { id } });
    if (!store) throw new NotFoundException('Toko tidak ditemukan');
    if (store.status !== 'PENDING') {
      throw new BadRequestException('Toko ini tidak sedang menunggu persetujuan');
    }
    return store;
  }

  private makeSlug(name: string) {
    const base = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `${base || 'toko'}-${Math.random().toString(36).slice(2, 6)}`;
  }
}
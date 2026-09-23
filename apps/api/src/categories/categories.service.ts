import { ConflictException, Injectable } from '@nestjs/common';
import { slugify } from '../common/slug.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  async create(dto: CreateCategoryDto) {
    const name = dto.name.trim();
    const exists = await this.prisma.category.findUnique({ where: { name } });
    if (exists) throw new ConflictException('Kategori sudah ada');
    return this.prisma.category.create({ data: { name, slug: slugify(name) } });
  }
}
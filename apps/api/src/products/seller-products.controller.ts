import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { ProductsService } from './products.service';

type AuthedReq = { user: { id: string } };

@Controller('seller/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SELLER')
export class SellerProductsController {
  constructor(private readonly products: ProductsService) {}

  @Post()
  create(@Req() req: AuthedReq, @Body() dto: CreateProductDto) {
    return this.products.create(req.user.id, dto);
  }

  @Get()
  list(@Req() req: AuthedReq) {
    return this.products.listMine(req.user.id);
  }

  @Patch(':id')
  update(
    @Req() req: AuthedReq,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.products.update(req.user.id, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: AuthedReq, @Param('id') id: string) {
    return this.products.remove(req.user.id, id);
  }
}
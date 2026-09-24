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
import { CartService } from './dto/cart.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto';

type AuthedReq = { user: { id: string } };

@Controller('cart')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('BUYER', 'SELLER') // penjual boleh belanja juga, admin tidak
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  get(@Req() req: AuthedReq) {
    return this.cart.get(req.user.id);
  }

  @Post('items')
  addItem(@Req() req: AuthedReq, @Body() dto: AddCartItemDto) {
    return this.cart.addItem(req.user.id, dto.productId, dto.quantity);
  }

  @Patch('items/:id')
  updateItem(
    @Req() req: AuthedReq,
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cart.updateItem(req.user.id, id, dto.quantity);
  }

  @Delete('items/:id')
  removeItem(@Req() req: AuthedReq, @Param('id') id: string) {
    return this.cart.removeItem(req.user.id, id);
  }
}
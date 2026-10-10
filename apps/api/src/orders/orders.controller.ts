import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CheckoutDto } from './dto/order.dto';
import { OrdersService } from './orders.service';

type AuthedReq = { user: { id: string } };

@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  checkout(@Req() req: AuthedReq, @Body() dto: CheckoutDto) {
    return this.orders.checkout(req.user.id, dto.addressId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findMine(@Req() req: AuthedReq) {
    return this.orders.findMine(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Req() req: AuthedReq, @Param('id') id: string) {
    return this.orders.findOne(req.user.id, id);
  }
}
import { Body, Controller, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('payments')
export class PaymentsWebhookController {
  constructor(private readonly orders: OrdersService) {}

  @Post('notification')
  handleNotification(@Body() payload: Record<string, unknown>) {
    return this.orders.handlePaymentNotification(payload as never);
  }
}
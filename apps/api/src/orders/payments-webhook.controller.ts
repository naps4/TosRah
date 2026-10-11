import { Body, Controller, HttpCode,Post } from '@nestjs/common';
import { OrdersService } from './orders.service';


@Controller('payments')
export class PaymentsWebhookController {
  constructor(private readonly orders: OrdersService) {}

  @Post('notification')
  @HttpCode(200)
  handleNotification(@Body() payload: Record<string, unknown>) {
    return this.orders.handlePaymentNotification(payload as never);
  }
}
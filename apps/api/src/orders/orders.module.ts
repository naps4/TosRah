import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PaymentsModule } from '../payments/payments.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PaymentsWebhookController } from './payments-webhook.controller';

@Module({
  imports: [AuthModule, PaymentsModule],
  controllers: [OrdersController, PaymentsWebhookController],
  providers: [OrdersService],
})
export class OrdersModule {}
import { Module } from '@nestjs/common';
import { midtransProvider } from './midtrans.provider';

@Module({
  providers: [midtransProvider],
  exports: [midtransProvider],
})
export class PaymentsModule {}
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminStoresController } from './admin-stores.controller';
import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';

@Module({
  imports: [AuthModule],
  controllers: [StoresController, AdminStoresController],
  providers: [StoresService],
})
export class StoresModule {}
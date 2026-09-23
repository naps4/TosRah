import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ListStoresQueryDto, RejectStoreDto } from './dto/store.dto';
import { StoresService } from './stores.service';

@Controller('admin/stores')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminStoresController {
  constructor(private readonly stores: StoresService) {}

  @Get()
  list(@Query() query: ListStoresQueryDto) {
    return this.stores.list(query.status);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.stores.approve(id);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body() dto: RejectStoreDto) {
    return this.stores.reject(id, dto.reason);
  }
}
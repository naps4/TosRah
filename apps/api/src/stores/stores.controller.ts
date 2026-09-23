import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateStoreDto } from './dto/store.dto';
import { StoresService } from './stores.service';

@Controller('stores')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StoresController {
  constructor(private readonly stores: StoresService) {}

  @Post()
  @Roles('BUYER')
  create(@Req() req: { user: { id: string } }, @Body() dto: CreateStoreDto) {
    return this.stores.create(req.user.id, dto);
  }

  @Get('me')
  me(@Req() req: { user: { id: string } }) {
    return this.stores.findMine(req.user.id);
  }
}
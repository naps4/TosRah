import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/address.dto';

type AuthedReq = { user: { id: string } };

@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private readonly addresses: AddressesService) {}

  @Get()
  list(@Req() req: AuthedReq) {
    return this.addresses.list(req.user.id);
  }

  @Post()
  create(@Req() req: AuthedReq, @Body() dto: CreateAddressDto) {
    return this.addresses.create(req.user.id, dto);
  }

  @Delete(':id')
  remove(@Req() req: AuthedReq, @Param('id') id: string) {
    return this.addresses.remove(req.user.id, id);
  }
}
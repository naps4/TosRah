import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @MinLength(2)
  label: string;

  @IsString()
  @MinLength(2)
  recipient: string;

  @IsString()
  @MinLength(8)
  phone: string;

  @IsString()
  @MinLength(5)
  street: string;

  @IsString()
  @MinLength(2)
  city: string;

  @IsString()
  @MinLength(2)
  province: string;

  @IsString()
  @MinLength(4)
  postalCode: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
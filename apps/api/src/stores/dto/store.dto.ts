import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export const STORE_STATUSES = [
  'PENDING',
  'ACTIVE',
  'REJECTED',
  'SUSPENDED',
] as const;
export type StoreStatusName = (typeof STORE_STATUSES)[number];

export class CreateStoreDto {
  @IsString()
  @MinLength(3)
  @MaxLength(60)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsString()
  @MinLength(2)
  city: string;
}

export class RejectStoreDto {
  @IsString()
  @MinLength(3)
  reason: string;
}

export class ListStoresQueryDto {
  @IsOptional()
  @IsIn(STORE_STATUSES)
  status?: StoreStatusName;
}
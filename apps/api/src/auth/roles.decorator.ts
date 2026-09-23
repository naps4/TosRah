import { SetMetadata } from '@nestjs/common';

export type RoleName = 'BUYER' | 'SELLER' | 'ADMIN';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);
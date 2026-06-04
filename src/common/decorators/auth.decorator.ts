import { applyDecorators, UseGuards } from '@nestjs/common';
import { UserRole } from '../enums/user-role.enum';
import { GqlAuthGuard } from '../guards/gql-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from './roles.decorator';

export function Auth(...roles: UserRole[]) {
  return applyDecorators(Roles(...roles), UseGuards(GqlAuthGuard, RolesGuard));
}

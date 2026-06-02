import { registerEnumType } from '@nestjs/graphql';

export enum UserRole {
  SUPERADMIN = 'superadmin',
  USER = 'user',
}

registerEnumType(UserRole, {
  name: 'UserRole',
});

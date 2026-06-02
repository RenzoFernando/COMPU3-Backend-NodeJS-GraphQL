import { registerEnumType } from '@nestjs/graphql';

export enum VaultPermission {
  VIEWER = 'viewer',
  EDITOR = 'editor',
  ADMIN = 'admin',
}

registerEnumType(VaultPermission, {
  name: 'VaultPermission',
});

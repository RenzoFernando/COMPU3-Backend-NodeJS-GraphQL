import { registerEnumType } from '@nestjs/graphql';

export enum VaultType {
  PERSONAL = 'personal',
  SHARED = 'shared',
  HOUSEHOLD = 'household',
}

registerEnumType(VaultType, {
  name: 'VaultType',
});

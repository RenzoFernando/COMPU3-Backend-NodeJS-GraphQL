import { registerEnumType } from '@nestjs/graphql';

export enum MovementKind {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer',
}

registerEnumType(MovementKind, {
  name: 'MovementKind',
});

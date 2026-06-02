import { registerEnumType } from '@nestjs/graphql';

export enum Currency {
  GALLEON = 'Galleon',
  SICKLE = 'Sickle',
  KNUT = 'Knut',
}

registerEnumType(Currency, {
  name: 'Currency',
});

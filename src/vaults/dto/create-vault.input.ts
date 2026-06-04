import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Currency } from '../../common/enums/currency.enum';
import { VaultType } from '../../common/enums/vault-type.enum';

@InputType()
export class CreateVaultInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  description?: string | null;

  @Field(() => VaultType, { nullable: true })
  @IsOptional()
  @IsEnum(VaultType)
  type?: VaultType;

  @Field(() => Currency, { nullable: true })
  @IsOptional()
  @IsEnum(Currency)
  baseCurrency?: Currency;
}

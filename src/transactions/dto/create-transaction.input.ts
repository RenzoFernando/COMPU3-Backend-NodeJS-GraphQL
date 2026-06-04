import { Field, GraphQLISODateTime, ID, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Currency } from '../../common/enums/currency.enum';
import { MovementKind } from '../../common/enums/movement-kind.enum';

@InputType()
export class CreateTransactionInput {
  @Field(() => ID)
  @IsMongoId()
  vaultId!: string;

  @Field(() => MovementKind)
  @IsEnum(MovementKind)
  type!: MovementKind;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  amountMinor!: number;

  @Field(() => Currency)
  @IsEnum(Currency)
  currency!: Currency;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  occurredAt?: Date;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  note?: string | null;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsMongoId()
  linkedTransactionId?: string | null;
}

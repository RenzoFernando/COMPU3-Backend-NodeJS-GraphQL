import { Field, GraphQLISODateTime, ID, ObjectType } from '@nestjs/graphql';
import { Prop, Schema as MongooseSchema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Currency } from '../../common/enums/currency.enum';
import { VaultType } from '../../common/enums/vault-type.enum';

export type VaultDocument = HydratedDocument<Vault>;

@MongooseSchema({
  collection: 'vaults',
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
@ObjectType()
export class Vault {
  @Field(() => ID)
  id!: string;

  @Prop({ required: true, trim: true })
  @Field(() => String)
  name!: string;

  @Prop({ type: String, default: null, trim: true })
  @Field(() => String, { nullable: true })
  description?: string | null;

  @Prop({ type: String, enum: Object.values(VaultType), default: VaultType.PERSONAL })
  @Field(() => VaultType)
  type!: VaultType;

  @Prop({ type: String, enum: Object.values(Currency), default: Currency.GALLEON })
  @Field(() => Currency)
  baseCurrency!: Currency;

  @Prop({ required: true })
  @Field(() => ID)
  ownerUserId!: string;

  @Prop({ type: Date, default: null })
  @Field(() => GraphQLISODateTime, { nullable: true })
  deletedAt?: Date | null;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt!: Date;
}

export const VaultSchema = SchemaFactory.createForClass(Vault);

VaultSchema.index({ ownerUserId: 1, deletedAt: 1 });
VaultSchema.index({ name: 1, ownerUserId: 1, deletedAt: 1 });

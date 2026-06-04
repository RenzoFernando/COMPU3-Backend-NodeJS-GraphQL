import { Field, GraphQLISODateTime, ID, Int, ObjectType } from '@nestjs/graphql';
import { Prop, Schema as MongooseSchema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Currency } from '../../common/enums/currency.enum';
import { MovementKind } from '../../common/enums/movement-kind.enum';

export type TransactionDocument = HydratedDocument<Transaction>;

@MongooseSchema({
  collection: 'transactions',
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
@ObjectType()
export class Transaction {
  @Field(() => ID)
  id!: string;

  @Prop({ required: true })
  @Field(() => ID)
  vaultId!: string;

  @Prop({ required: true })
  @Field(() => ID)
  createdByUserId!: string;

  @Prop({ type: String, enum: Object.values(MovementKind), required: true })
  @Field(() => MovementKind)
  type!: MovementKind;

  @Prop({ required: true, min: 1 })
  @Field(() => Int)
  amountMinor!: number;

  @Prop({ type: String, enum: Object.values(Currency), required: true })
  @Field(() => Currency)
  currency!: Currency;

  @Prop({ type: Date, required: true })
  @Field(() => GraphQLISODateTime)
  occurredAt!: Date;

  @Prop({ type: String, default: null, trim: true })
  @Field(() => String, { nullable: true })
  note?: string | null;

  @Prop({ type: String, default: null })
  @Field(() => ID, { nullable: true })
  linkedTransactionId?: string | null;

  @Prop({ type: Date, default: null })
  @Field(() => GraphQLISODateTime, { nullable: true })
  deletedAt?: Date | null;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt!: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

TransactionSchema.index({ vaultId: 1, deletedAt: 1, occurredAt: -1 });
TransactionSchema.index({ createdByUserId: 1, deletedAt: 1 });

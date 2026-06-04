import { Field, GraphQLISODateTime, ID, ObjectType } from '@nestjs/graphql';
import { Prop, Schema as MongooseSchema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRole } from '../../common/enums/user-role.enum';

export type UserDocument = HydratedDocument<User>;

@MongooseSchema({
  collection: 'users',
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
@ObjectType()
export class User {
  @Field(() => ID)
  id!: string;

  @Prop({ required: true, trim: true })
  @Field(() => String)
  fullName!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  @Field(() => String)
  email!: string;

  @Prop({ required: true, select: false })
  passwordHash!: string;

  @Prop({ type: [String], enum: Object.values(UserRole), default: [UserRole.USER] })
  @Field(() => [UserRole])
  roles!: UserRole[];

  @Prop({ default: true })
  @Field(() => Boolean)
  isActive!: boolean;

  @Prop({ type: String, default: null, select: false })
  refreshTokenHash?: string | null;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt!: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);


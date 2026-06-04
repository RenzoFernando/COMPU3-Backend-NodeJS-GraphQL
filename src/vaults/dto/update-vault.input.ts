import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { IsMongoId } from 'class-validator';
import { CreateVaultInput } from './create-vault.input';

@InputType()
export class UpdateVaultInput extends PartialType(CreateVaultInput) {
  @Field(() => ID)
  @IsMongoId()
  id!: string;
}

import { Field, InputType } from '@nestjs/graphql';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../common/enums/user-role.enum';

@InputType()
export class CreateUserInput {
  @Field(() => String)
  @IsNotEmpty()
  fullName!: string;

  @Field(() => String)
  @IsEmail()
  email!: string;

  @Field(() => String)
  @MinLength(6)
  password!: string;

  @Field(() => [UserRole], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(UserRole, { each: true })
  roles?: UserRole[];

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

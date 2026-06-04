import { Field, ObjectType } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';

@ObjectType()
export class AuthResponse {
  @Field(() => User)
  user!: User;

  @Field(() => String, {
    description: 'Alias compatible con las pruebas de clase; contiene el access token JWT.',
  })
  token!: string;

  @Field(() => String)
  accessToken!: string;

  @Field(() => String)
  refreshToken!: string;
}

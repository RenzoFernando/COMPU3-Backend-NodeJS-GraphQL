import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Auth } from '../common/decorators/auth.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { LoginInput } from './dto/login.input';
import { RefreshTokenInput } from './dto/refresh-token.input';
import { SignUpInput } from './dto/signup.input';
import { AuthResponse } from './types/auth-response.type';

@Resolver(() => User)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthResponse)
  signup(@Args('signupInput') signupInput: SignUpInput): Promise<AuthResponse> {
    return this.authService.signup(signupInput);
  }

  @Mutation(() => AuthResponse)
  login(@Args('loginInput') loginInput: LoginInput): Promise<AuthResponse> {
    return this.authService.login(loginInput);
  }

  @Mutation(() => AuthResponse)
  refresh(@Args('refreshTokenInput') refreshTokenInput: RefreshTokenInput): Promise<AuthResponse> {
    return this.authService.refresh(refreshTokenInput);
  }

  @Mutation(() => Boolean)
  @Auth()
  logout(@CurrentUser() user: User): Promise<boolean> {
    return this.authService.logout(user);
  }

  @Query(() => User)
  @Auth()
  me(@CurrentUser() user: User): User {
    return user;
  }
}

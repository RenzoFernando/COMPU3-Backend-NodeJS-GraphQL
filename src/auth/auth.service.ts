import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions, JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { LoginInput } from './dto/login.input';
import { RefreshTokenInput } from './dto/refresh-token.input';
import { SignUpInput } from './dto/signup.input';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { AuthResponse } from './types/auth-response.type';

type JwtExpiresIn = NonNullable<JwtModuleOptions['signOptions']>['expiresIn'];

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signup(signupInput: SignUpInput): Promise<AuthResponse> {
    const user = await this.usersService.createFromSignup(signupInput);
    return this.buildAuthResponse(user);
  }

  async login(loginInput: LoginInput): Promise<AuthResponse> {
    const user = await this.usersService.findByEmailWithPassword(loginInput.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    this.usersService.validateActiveUser(user);

    const passwordMatches = await bcrypt.compare(loginInput.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildAuthResponse(user);
  }

  async refresh(refreshTokenInput: RefreshTokenInput): Promise<AuthResponse> {
    const payload = await this.verifyRefreshToken(refreshTokenInput.refreshToken);
    const user = await this.usersService.findByIdWithRefreshToken(payload.sub);

    if (!user?.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    this.usersService.validateActiveUser(user);

    const refreshTokenMatches = await bcrypt.compare(refreshTokenInput.refreshToken, user.refreshTokenHash);

    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.buildAuthResponse(user);
  }

  async logout(user: User): Promise<boolean> {
    await this.usersService.removeRefreshToken(user.id);
    return true;
  }

  private async buildAuthResponse(user: User): Promise<AuthResponse> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles?.length ? user.roles : [UserRole.USER],
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET') ?? 'change_me_access_secret',
      expiresIn: (this.configService.get<string>('JWT_EXPIRES_IN') ?? '1h') as JwtExpiresIn,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET') ?? 'change_me_refresh_secret',
      expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d') as JwtExpiresIn,
    });

    await this.usersService.setCurrentRefreshToken(user.id, refreshToken);

    return {
      user,
      token: accessToken,
      accessToken,
      refreshToken,
    };
  }

  private async verifyRefreshToken(refreshToken: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') ?? 'change_me_refresh_secret',
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}

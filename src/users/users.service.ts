import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import bcrypt from 'bcrypt';
import { Model, Types } from 'mongoose';
import { UserRole } from '../common/enums/user-role.enum';
import { SignUpInput } from '../auth/dto/signup.input';
import { User, UserDocument } from './entities/user.entity';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureSuperadmin();
  }

  async createFromSignup(signupInput: SignUpInput): Promise<User> {
    const email = this.normalizeEmail(signupInput.email);
    const existingUser = await this.userModel.findOne({ email }).exec();

    if (existingUser) {
      throw new ConflictException(`User with email ${email} already exists`);
    }

    const passwordHash = await bcrypt.hash(signupInput.password, 10);

    const user = await this.userModel.create({
      email,
      passwordHash,
      fullName: signupInput.fullName.trim(),
      roles: [UserRole.USER],
      isActive: true,
    });

    return user;
  }

  async findById(id: string): Promise<User> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`User with id ${id} was not found`);
    }

    const user = await this.userModel.findById(id).exec();

    if (!user) {
      throw new NotFoundException(`User with id ${id} was not found`);
    }

    return user;
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: this.normalizeEmail(email) })
      .select('+passwordHash +refreshTokenHash')
      .exec();
  }

  async findByIdWithRefreshToken(id: string): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    return this.userModel.findById(id).select('+refreshTokenHash').exec();
  }

  async setCurrentRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.userModel.updateOne({ _id: userId }, { refreshTokenHash }).exec();
  }

  async removeRefreshToken(userId: string): Promise<void> {
    await this.userModel.updateOne({ _id: userId }, { refreshTokenHash: null }).exec();
  }

  private async ensureSuperadmin(): Promise<void> {
    const email = this.normalizeEmail(this.configService.get<string>('SUPERADMIN_EMAIL') ?? 'superadmin@gringotts.hp');
    const password = this.configService.get<string>('SUPERADMIN_PASSWORD') ?? 'ChangeMe2026*';
    const fullName = this.configService.get<string>('SUPERADMIN_NAME') ?? 'Ragnok Ironclaw';
    const passwordHash = await bcrypt.hash(password, 10);

    await this.userModel
      .updateOne(
        { email },
        {
          $set: {
            email,
            passwordHash,
            fullName,
            roles: [UserRole.SUPERADMIN],
            isActive: true,
          },
        },
        { upsert: true },
      )
      .exec();
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  validateActiveUser(user: User): void {
    if (!user.isActive) {
      throw new UnauthorizedException('User is inactive');
    }
  }
}

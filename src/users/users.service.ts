import {
  BadRequestException,
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
import { SignUpInput } from '../auth/dto/signup.input';
import { UserRole } from '../common/enums/user-role.enum';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
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

  async create(createUserInput: CreateUserInput): Promise<User> {
    const email = this.normalizeEmail(createUserInput.email);
    await this.ensureEmailIsAvailable(email);

    const passwordHash = await bcrypt.hash(createUserInput.password, 10);

    return this.userModel.create({
      email,
      passwordHash,
      fullName: createUserInput.fullName.trim(),
      roles: this.normalizeRoles(createUserInput.roles),
      isActive: createUserInput.isActive ?? true,
    });
  }

  async createFromSignup(signupInput: SignUpInput): Promise<User> {
    const email = this.normalizeEmail(signupInput.email);
    await this.ensureEmailIsAvailable(email);

    const passwordHash = await bcrypt.hash(signupInput.password, 10);

    return this.userModel.create({
      email,
      passwordHash,
      fullName: signupInput.fullName.trim(),
      roles: [UserRole.USER],
      isActive: true,
    });
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().sort({ createdAt: -1 }).exec();
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

  async update(updateUserInput: UpdateUserInput): Promise<User> {
    const { id, email, fullName, password, roles, isActive } = updateUserInput;

    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`User with id ${id} was not found`);
    }

    await this.findById(id);

    const updateData: Partial<{
      email: string;
      fullName: string;
      passwordHash: string;
      roles: UserRole[];
      isActive: boolean;
    }> = {};

    if (email !== undefined) {
      const normalizedEmail = this.normalizeEmail(email);
      await this.ensureEmailIsAvailable(normalizedEmail, id);
      updateData.email = normalizedEmail;
    }

    if (fullName !== undefined) {
      updateData.fullName = fullName.trim();
    }

    if (password !== undefined) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    if (roles !== undefined) {
      updateData.roles = this.normalizeRoles(roles);
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No data was provided to update the user');
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with id ${id} was not found`);
    }

    return updatedUser;
  }

  async remove(id: string): Promise<User> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`User with id ${id} was not found`);
    }

    const user = await this.userModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            isActive: false,
            refreshTokenHash: null,
          },
        },
        { new: true },
      )
      .exec();

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

  validateActiveUser(user: User): void {
    if (!user.isActive) {
      throw new UnauthorizedException('User is inactive');
    }
  }

  private async ensureSuperadmin(): Promise<void> {
    const email = this.normalizeEmail(
      this.configService.get<string>('SUPERADMIN_EMAIL') ?? 'superadmin@gringotts.hp',
    );
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

  private async ensureEmailIsAvailable(email: string, currentUserId?: string): Promise<void> {
    const query = currentUserId ? { email, _id: { $ne: currentUserId } } : { email };
    const existingUser = await this.userModel.findOne(query).exec();

    if (existingUser) {
      throw new ConflictException(`User with email ${email} already exists`);
    }
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private normalizeRoles(roles?: UserRole[]): UserRole[] {
    if (!roles || roles.length === 0) {
      return [UserRole.USER];
    }

    return Array.from(new Set(roles));
  }
}

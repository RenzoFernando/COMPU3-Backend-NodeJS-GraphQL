import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Auth } from '../common/decorators/auth.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => [User], { name: 'getAll' })
  @Auth()
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Query(() => User, { name: 'user' })
  @Auth()
  findOne(@Args('id', { type: () => ID }) id: string): Promise<User> {
    return this.usersService.findById(id);
  }

  @Mutation(() => User, { name: 'createUser' })
  @Auth(UserRole.SUPERADMIN)
  createUser(@Args('createUserInput') createUserInput: CreateUserInput): Promise<User> {
    return this.usersService.create(createUserInput);
  }

  @Mutation(() => User, { name: 'updateUser' })
  @Auth(UserRole.SUPERADMIN)
  updateUser(@Args('updateUserInput') updateUserInput: UpdateUserInput): Promise<User> {
    return this.usersService.update(updateUserInput);
  }

  @Mutation(() => User, { name: 'deleteUser' })
  @Auth(UserRole.SUPERADMIN)
  deleteUser(@Args('id', { type: () => ID }) id: string): Promise<User> {
    return this.usersService.remove(id);
  }
}

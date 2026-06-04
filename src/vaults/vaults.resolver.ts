import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Auth } from '../common/decorators/auth.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateVaultInput } from './dto/create-vault.input';
import { UpdateVaultInput } from './dto/update-vault.input';
import { Vault } from './entities/vault.entity';
import { VaultsService } from './vaults.service';

@Resolver(() => Vault)
export class VaultsResolver {
  constructor(private readonly vaultsService: VaultsService) {}

  @Query(() => [Vault], { name: 'vaults' })
  @Auth()
  findAll(@CurrentUser() user: User): Promise<Vault[]> {
    return this.vaultsService.findAll(user);
  }

  @Query(() => Vault, { name: 'vault' })
  @Auth()
  findOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ): Promise<Vault> {
    return this.vaultsService.findById(id, user);
  }

  @Mutation(() => Vault, { name: 'createVault' })
  @Auth()
  createVault(
    @Args('createVaultInput') createVaultInput: CreateVaultInput,
    @CurrentUser() user: User,
  ): Promise<Vault> {
    return this.vaultsService.create(createVaultInput, user);
  }

  @Mutation(() => Vault, { name: 'updateVault' })
  @Auth()
  updateVault(
    @Args('updateVaultInput') updateVaultInput: UpdateVaultInput,
    @CurrentUser() user: User,
  ): Promise<Vault> {
    return this.vaultsService.update(updateVaultInput, user);
  }

  @Mutation(() => Vault, { name: 'deleteVault' })
  @Auth()
  deleteVault(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ): Promise<Vault> {
    return this.vaultsService.remove(id, user);
  }
}

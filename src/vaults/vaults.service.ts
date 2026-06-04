import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Currency } from '../common/enums/currency.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { VaultType } from '../common/enums/vault-type.enum';
import { User } from '../users/entities/user.entity';
import { CreateVaultInput } from './dto/create-vault.input';
import { UpdateVaultInput } from './dto/update-vault.input';
import { Vault, VaultDocument } from './entities/vault.entity';

@Injectable()
export class VaultsService {
  constructor(
    @InjectModel(Vault.name)
    private readonly vaultModel: Model<VaultDocument>,
  ) {}

  async create(createVaultInput: CreateVaultInput, user: User): Promise<Vault> {
    return this.vaultModel.create({
      name: createVaultInput.name.trim(),
      description: this.normalizeNullableText(createVaultInput.description),
      type: createVaultInput.type ?? VaultType.PERSONAL,
      baseCurrency: createVaultInput.baseCurrency ?? Currency.GALLEON,
      ownerUserId: user.id,
      deletedAt: null,
    });
  }

  async findAll(user: User): Promise<Vault[]> {
    const filter = this.isSuperadmin(user)
      ? { deletedAt: null }
      : { ownerUserId: user.id, deletedAt: null };

    return this.vaultModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findById(id: string, user: User): Promise<Vault> {
    const vault = await this.findExistingVault(id);
    this.ensureCanViewVault(vault, user);
    return vault;
  }

  async update(updateVaultInput: UpdateVaultInput, user: User): Promise<Vault> {
    const vault = await this.findExistingVault(updateVaultInput.id);
    this.ensureCanEditVault(vault, user);

    const updateData: Partial<{
      name: string;
      description: string | null;
      type: VaultType;
      baseCurrency: Currency;
    }> = {};

    if (updateVaultInput.name !== undefined) {
      updateData.name = updateVaultInput.name.trim();
    }

    if (updateVaultInput.description !== undefined) {
      updateData.description = this.normalizeNullableText(updateVaultInput.description);
    }

    if (updateVaultInput.type !== undefined) {
      updateData.type = updateVaultInput.type;
    }

    if (updateVaultInput.baseCurrency !== undefined) {
      updateData.baseCurrency = updateVaultInput.baseCurrency;
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No data was provided to update the vault');
    }

    const updatedVault = await this.vaultModel
      .findByIdAndUpdate(updateVaultInput.id, { $set: updateData }, { new: true })
      .exec();

    if (!updatedVault) {
      throw new NotFoundException(`Vault with id ${updateVaultInput.id} was not found`);
    }

    return updatedVault;
  }

  async remove(id: string, user: User): Promise<Vault> {
    const vault = await this.findExistingVault(id);
    this.ensureCanEditVault(vault, user);

    const deletedVault = await this.vaultModel
      .findByIdAndUpdate(id, { $set: { deletedAt: new Date() } }, { new: true })
      .exec();

    if (!deletedVault) {
      throw new NotFoundException(`Vault with id ${id} was not found`);
    }

    return deletedVault;
  }

  async ensureUserCanViewVault(vaultId: string, user: User): Promise<Vault> {
    const vault = await this.findExistingVault(vaultId);
    this.ensureCanViewVault(vault, user);
    return vault;
  }

  async ensureUserCanEditVault(vaultId: string, user: User): Promise<Vault> {
    const vault = await this.findExistingVault(vaultId);
    this.ensureCanEditVault(vault, user);
    return vault;
  }

  private async findExistingVault(id: string): Promise<VaultDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Vault with id ${id} was not found`);
    }

    const vault = await this.vaultModel.findOne({ _id: id, deletedAt: null }).exec();

    if (!vault) {
      throw new NotFoundException(`Vault with id ${id} was not found`);
    }

    return vault;
  }

  private ensureCanViewVault(vault: Vault, user: User): void {
    if (this.isSuperadmin(user) || vault.ownerUserId === user.id) {
      return;
    }

    throw new ForbiddenException('You do not have permission to view this vault');
  }

  private ensureCanEditVault(vault: Vault, user: User): void {
    if (this.isSuperadmin(user) || vault.ownerUserId === user.id) {
      return;
    }

    throw new ForbiddenException('You do not have permission to modify this vault');
  }

  private isSuperadmin(user: User): boolean {
    return user.roles?.includes(UserRole.SUPERADMIN) ?? false;
  }

  private normalizeNullableText(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}

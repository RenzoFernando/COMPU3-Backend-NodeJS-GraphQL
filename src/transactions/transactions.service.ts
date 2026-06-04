import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Currency } from '../common/enums/currency.enum';
import { MovementKind } from '../common/enums/movement-kind.enum';
import { User } from '../users/entities/user.entity';
import { VaultsService } from '../vaults/vaults.service';
import { CreateTransactionInput } from './dto/create-transaction.input';
import { UpdateTransactionInput } from './dto/update-transaction.input';
import { Transaction, TransactionDocument } from './entities/transaction.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    private readonly vaultsService: VaultsService,
  ) {}

  async create(createTransactionInput: CreateTransactionInput, user: User): Promise<Transaction> {
    await this.vaultsService.ensureUserCanEditVault(createTransactionInput.vaultId, user);

    if (createTransactionInput.linkedTransactionId) {
      await this.ensureLinkedTransactionBelongsToVault(
        createTransactionInput.linkedTransactionId,
        createTransactionInput.vaultId,
      );
    }

    return this.transactionModel.create({
      vaultId: createTransactionInput.vaultId,
      createdByUserId: user.id,
      type: createTransactionInput.type,
      amountMinor: createTransactionInput.amountMinor,
      currency: createTransactionInput.currency,
      occurredAt: createTransactionInput.occurredAt ?? new Date(),
      note: this.normalizeNullableText(createTransactionInput.note),
      linkedTransactionId: this.normalizeNullableText(createTransactionInput.linkedTransactionId),
      deletedAt: null,
    });
  }

  async findAllByVault(vaultId: string, user: User): Promise<Transaction[]> {
    await this.vaultsService.ensureUserCanViewVault(vaultId, user);

    return this.transactionModel
      .find({ vaultId, deletedAt: null })
      .sort({ occurredAt: -1, createdAt: -1 })
      .exec();
  }

  async findById(id: string, user: User): Promise<Transaction> {
    const transaction = await this.findExistingTransaction(id);
    await this.vaultsService.ensureUserCanViewVault(transaction.vaultId, user);
    return transaction;
  }

  async update(updateTransactionInput: UpdateTransactionInput, user: User): Promise<Transaction> {
    const transaction = await this.findExistingTransaction(updateTransactionInput.id);
    await this.vaultsService.ensureUserCanEditVault(transaction.vaultId, user);

    const updateData: Partial<{
      vaultId: string;
      type: MovementKind;
      amountMinor: number;
      currency: Currency;
      occurredAt: Date;
      note: string | null;
      linkedTransactionId: string | null;
    }> = {};

    if (updateTransactionInput.vaultId !== undefined) {
      await this.vaultsService.ensureUserCanEditVault(updateTransactionInput.vaultId, user);
      updateData.vaultId = updateTransactionInput.vaultId;
    }

    if (updateTransactionInput.type !== undefined) {
      updateData.type = updateTransactionInput.type;
    }

    if (updateTransactionInput.amountMinor !== undefined) {
      updateData.amountMinor = updateTransactionInput.amountMinor;
    }

    if (updateTransactionInput.currency !== undefined) {
      updateData.currency = updateTransactionInput.currency;
    }

    if (updateTransactionInput.occurredAt !== undefined) {
      updateData.occurredAt = updateTransactionInput.occurredAt;
    }

    if (updateTransactionInput.note !== undefined) {
      updateData.note = this.normalizeNullableText(updateTransactionInput.note);
    }

    if (updateTransactionInput.linkedTransactionId !== undefined) {
      updateData.linkedTransactionId = this.normalizeNullableText(
        updateTransactionInput.linkedTransactionId,
      );
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No data was provided to update the transaction');
    }

    const finalVaultId = updateData.vaultId ?? transaction.vaultId;
    const finalLinkedTransactionId =
      updateData.linkedTransactionId === undefined
        ? transaction.linkedTransactionId
        : updateData.linkedTransactionId;

    if (finalLinkedTransactionId) {
      if (finalLinkedTransactionId === updateTransactionInput.id) {
        throw new BadRequestException('A transaction cannot be linked to itself');
      }

      await this.ensureLinkedTransactionBelongsToVault(finalLinkedTransactionId, finalVaultId);
    }

    const updatedTransaction = await this.transactionModel
      .findByIdAndUpdate(updateTransactionInput.id, { $set: updateData }, { new: true })
      .exec();

    if (!updatedTransaction) {
      throw new NotFoundException(`Transaction with id ${updateTransactionInput.id} was not found`);
    }

    return updatedTransaction;
  }

  async remove(id: string, user: User): Promise<Transaction> {
    const transaction = await this.findExistingTransaction(id);
    await this.vaultsService.ensureUserCanEditVault(transaction.vaultId, user);

    const deletedTransaction = await this.transactionModel
      .findByIdAndUpdate(id, { $set: { deletedAt: new Date() } }, { new: true })
      .exec();

    if (!deletedTransaction) {
      throw new NotFoundException(`Transaction with id ${id} was not found`);
    }

    return deletedTransaction;
  }

  private async findExistingTransaction(id: string): Promise<TransactionDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Transaction with id ${id} was not found`);
    }

    const transaction = await this.transactionModel.findOne({ _id: id, deletedAt: null }).exec();

    if (!transaction) {
      throw new NotFoundException(`Transaction with id ${id} was not found`);
    }

    return transaction;
  }

  private async ensureLinkedTransactionBelongsToVault(
    transactionId: string,
    vaultId: string,
  ): Promise<void> {
    const linkedTransaction = await this.findExistingTransaction(transactionId);

    if (linkedTransaction.vaultId !== vaultId) {
      throw new BadRequestException('The linked transaction must belong to the same vault');
    }
  }

  private normalizeNullableText(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}

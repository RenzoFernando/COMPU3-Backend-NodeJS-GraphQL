import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Auth } from '../common/decorators/auth.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateTransactionInput } from './dto/create-transaction.input';
import { UpdateTransactionInput } from './dto/update-transaction.input';
import { Transaction } from './entities/transaction.entity';
import { TransactionsService } from './transactions.service';

@Resolver(() => Transaction)
export class TransactionsResolver {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Query(() => [Transaction], { name: 'transactions' })
  @Auth()
  findAllByVault(
    @Args('vaultId', { type: () => ID }) vaultId: string,
    @CurrentUser() user: User,
  ): Promise<Transaction[]> {
    return this.transactionsService.findAllByVault(vaultId, user);
  }

  @Query(() => Transaction, { name: 'transaction' })
  @Auth()
  findOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ): Promise<Transaction> {
    return this.transactionsService.findById(id, user);
  }

  @Mutation(() => Transaction, { name: 'createTransaction' })
  @Auth()
  createTransaction(
    @Args('createTransactionInput') createTransactionInput: CreateTransactionInput,
    @CurrentUser() user: User,
  ): Promise<Transaction> {
    return this.transactionsService.create(createTransactionInput, user);
  }

  @Mutation(() => Transaction, { name: 'updateTransaction' })
  @Auth()
  updateTransaction(
    @Args('updateTransactionInput') updateTransactionInput: UpdateTransactionInput,
    @CurrentUser() user: User,
  ): Promise<Transaction> {
    return this.transactionsService.update(updateTransactionInput, user);
  }

  @Mutation(() => Transaction, { name: 'deleteTransaction' })
  @Auth()
  deleteTransaction(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ): Promise<Transaction> {
    return this.transactionsService.remove(id, user);
  }
}

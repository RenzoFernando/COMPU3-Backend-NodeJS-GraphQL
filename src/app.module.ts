import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { MongooseModule } from '@nestjs/mongoose';
import { Request } from 'express';
import { join } from 'node:path';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { TransactionsModule } from './transactions/transactions.module';
import { UsersModule } from './users/users.module';
import { VaultsModule } from './vaults/vaults.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      context: ({ req }: { req: Request }) => ({ req }),
    }),
    MongooseModule.forRoot(process.env.MONGO_URI ?? 'mongodb://localhost:27017/compu3_graphql'),
    HealthModule,
    AuthModule,
    UsersModule,
    VaultsModule,
    TransactionsModule,
  ],
})
export class AppModule {}

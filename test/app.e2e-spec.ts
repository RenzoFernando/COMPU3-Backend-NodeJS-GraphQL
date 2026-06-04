import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request = require('supertest');

jest.setTimeout(120000);

type AuthState = {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    roles: string[];
    isActive: boolean;
  };
};

describe('GraphQL API', () => {
  let app: INestApplication;
  let mongo: MongoMemoryServer;
  const suffix = `${Date.now()}${Math.floor(Math.random() * 100000)}`;

  let regularToken = '';
  let regularRefreshToken = '';
  let regularEmail = '';
  let regularUserId = '';
  let superadminToken = '';
  let managedUserId = '';
  let managedUserEmail = '';
  let otherToken = '';
  let ownerVaultId = '';
  let otherVaultId = '';
  let transactionId = '';
  let linkedTransactionId = '';

  const graphql = async (
    query: string,
    variables?: Record<string, unknown>,
    token?: string,
  ): Promise<request.Response> => {
    const req = request(app.getHttpServer())
      .post('/api/graphql')
      .set('Content-Type', 'application/json')
      .set('Apollo-Require-Preflight', 'true')
      .send({ query, variables });

    if (token) {
      req.set('Authorization', `Bearer ${token}`);
    }

    return req.expect(200);
  };

  const expectNoGraphqlErrors = (response: request.Response): void => {
    expect(response.body.errors).toBeUndefined();
  };

  const expectGraphqlErrors = (response: request.Response): void => {
    expect(response.body.errors).toEqual(expect.any(Array));
    expect(response.body.errors.length).toBeGreaterThan(0);
  };

  const signup = async (prefix: string, fullName: string): Promise<AuthState> => {
    const email = `${prefix}.${suffix}@test.com`;
    const response = await graphql(
      `mutation Signup($signupInput: SignUpInput!) {
        signup(signupInput: $signupInput) {
          token
          refreshToken
          user { id email fullName roles isActive }
        }
      }`,
      {
        signupInput: {
          email,
          password: 'User123456*',
          fullName,
        },
      },
    );

    expectNoGraphqlErrors(response);
    return response.body.data.signup;
  };

  const createVault = async (
    token: string,
    name: string,
    description = 'Vault used by e2e tests',
  ): Promise<Record<string, unknown>> => {
    const response = await graphql(
      `mutation CreateVault($createVaultInput: CreateVaultInput!) {
        createVault(createVaultInput: $createVaultInput) {
          id
          name
          description
          type
          baseCurrency
          ownerUserId
          deletedAt
        }
      }`,
      {
        createVaultInput: {
          name,
          description,
          type: 'PERSONAL',
          baseCurrency: 'GALLEON',
        },
      },
      token,
    );

    expectNoGraphqlErrors(response);
    return response.body.data.createVault;
  };

  const createTransaction = async (
    token: string,
    vaultId: string,
    amountMinor: number,
    note: string,
    linkedId?: string,
  ): Promise<Record<string, unknown>> => {
    const response = await graphql(
      `mutation CreateTransaction($createTransactionInput: CreateTransactionInput!) {
        createTransaction(createTransactionInput: $createTransactionInput) {
          id
          vaultId
          createdByUserId
          type
          amountMinor
          currency
          note
          linkedTransactionId
          deletedAt
        }
      }`,
      {
        createTransactionInput: {
          vaultId,
          type: 'INCOME',
          amountMinor,
          currency: 'GALLEON',
          note,
          ...(linkedId ? { linkedTransactionId: linkedId } : {}),
        },
      },
      token,
    );

    expectNoGraphqlErrors(response);
    return response.body.data.createTransaction;
  };

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test_access_secret';
    process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
    process.env.SUPERADMIN_NAME = 'Ragnok Ironclaw';
    process.env.SUPERADMIN_EMAIL = 'superadmin@gringotts.hp';
    process.env.SUPERADMIN_PASSWORD = 'ChangeMe2026*';

    mongo = await MongoMemoryServer.create();
    process.env.MONGO_URI = mongo.getUri();

    const { AppModule } = await import('../src/app.module');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  }, 120000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }

    await mongoose.connection.close(true);
    await mongoose.disconnect();

    if (mongo) {
      await mongo.stop();
    }
  }, 120000);

  it('exposes REST and GraphQL health checks', async () => {
    await request(app.getHttpServer()).get('/api/health').expect(200).expect(({ body }) => {
      expect(body.ok).toBe(true);
      expect(body.status).toBe('ok');
    });

    const response = await graphql('query { health { status message timestamp } }');
    expectNoGraphqlErrors(response);
    expect(response.body.data.health.status).toBe('ok');
    expect(response.body.data.health.message).toBe('COMPU3 GraphQL API is alive');
  });

  it('rejects protected GraphQL operations without JWT', async () => {
    const meResponse = await graphql('query { me { id email fullName roles isActive } }');
    expectGraphqlErrors(meResponse);

    const usersResponse = await graphql('query { getAll { id email fullName roles isActive } }');
    expectGraphqlErrors(usersResponse);
  });

  it('signs up a regular user with JWT tokens', async () => {
    const auth = await signup('regular', 'Regular User');

    regularToken = auth.token;
    regularRefreshToken = auth.refreshToken;
    regularEmail = auth.user.email;
    regularUserId = auth.user.id;

    expect(auth.token).toEqual(expect.any(String));
    expect(auth.refreshToken).toEqual(expect.any(String));
    expect(auth.user.email).toBe(`regular.${suffix}@test.com`);
    expect(auth.user.roles).toContain('USER');
    expect(auth.user.isActive).toBe(true);
  });

  it('rejects duplicated signup email', async () => {
    const response = await graphql(
      `mutation Signup($signupInput: SignUpInput!) {
        signup(signupInput: $signupInput) {
          token
          user { id }
        }
      }`,
      {
        signupInput: {
          email: regularEmail,
          password: 'User123456*',
          fullName: 'Duplicated User',
        },
      },
    );

    expectGraphqlErrors(response);
  });

  it('logs in the regular user with normalized email', async () => {
    const response = await graphql(
      `mutation Login($loginInput: LoginInput!) {
        login(loginInput: $loginInput) {
          token
          refreshToken
          user { id email fullName roles isActive }
        }
      }`,
      {
        loginInput: {
          email: regularEmail.toUpperCase(),
          password: 'User123456*',
        },
      },
    );

    expectNoGraphqlErrors(response);
    expect(response.body.data.login.token).toEqual(expect.any(String));
    expect(response.body.data.login.user.id).toBe(regularUserId);

    regularToken = response.body.data.login.token;
    regularRefreshToken = response.body.data.login.refreshToken;
  });

  it('refreshes regular user tokens', async () => {
    const response = await graphql(
      `mutation Refresh($refreshTokenInput: RefreshTokenInput!) {
        refresh(refreshTokenInput: $refreshTokenInput) {
          token
          refreshToken
          user { id email roles isActive }
        }
      }`,
      {
        refreshTokenInput: {
          refreshToken: regularRefreshToken,
        },
      },
    );

    expectNoGraphqlErrors(response);
    expect(response.body.data.refresh.token).toEqual(expect.any(String));
    expect(response.body.data.refresh.refreshToken).toEqual(expect.any(String));
    expect(response.body.data.refresh.user.id).toBe(regularUserId);

    regularToken = response.body.data.refresh.token;
    regularRefreshToken = response.body.data.refresh.refreshToken;
  });

  it('logs out and invalidates the stored refresh token', async () => {
    const logoutResponse = await graphql('mutation { logout }', undefined, regularToken);
    expectNoGraphqlErrors(logoutResponse);
    expect(logoutResponse.body.data.logout).toBe(true);

    const refreshResponse = await graphql(
      `mutation Refresh($refreshTokenInput: RefreshTokenInput!) {
        refresh(refreshTokenInput: $refreshTokenInput) {
          token
          user { id }
        }
      }`,
      {
        refreshTokenInput: {
          refreshToken: regularRefreshToken,
        },
      },
    );

    expectGraphqlErrors(refreshResponse);
  });

  it('rejects login with invalid credentials', async () => {
    const response = await graphql(
      `mutation Login($loginInput: LoginInput!) {
        login(loginInput: $loginInput) {
          token
          user { id }
        }
      }`,
      {
        loginInput: {
          email: regularEmail,
          password: 'Wrong123456*',
        },
      },
    );

    expectGraphqlErrors(response);
  });

  it('logs in the seeded superadmin', async () => {
    const response = await graphql(
      `mutation Login($loginInput: LoginInput!) {
        login(loginInput: $loginInput) {
          token
          refreshToken
          user { id email fullName roles isActive }
        }
      }`,
      {
        loginInput: {
          email: 'superadmin@gringotts.hp',
          password: 'ChangeMe2026*',
        },
      },
    );

    expectNoGraphqlErrors(response);
    expect(response.body.data.login.token).toEqual(expect.any(String));
    expect(response.body.data.login.user.roles).toContain('SUPERADMIN');

    superadminToken = response.body.data.login.token;
  });

  it('allows authenticated regular users to list users', async () => {
    const response = await graphql(
      'query { getAll { id email fullName roles isActive } }',
      undefined,
      regularToken,
    );

    expectNoGraphqlErrors(response);
    expect(response.body.data.getAll).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: regularUserId, email: regularEmail })]),
    );
  });

  it('rejects user creation from a regular user', async () => {
    const response = await graphql(
      `mutation CreateUser($createUserInput: CreateUserInput!) {
        createUser(createUserInput: $createUserInput) { id email fullName roles isActive }
      }`,
      {
        createUserInput: {
          email: `blocked.${suffix}@test.com`,
          password: 'Blocked123456*',
          fullName: 'Blocked User',
          roles: ['USER'],
          isActive: true,
        },
      },
      regularToken,
    );

    expectGraphqlErrors(response);
  });

  it('rejects invalid user input for superadmin user creation', async () => {
    const response = await graphql(
      `mutation CreateUser($createUserInput: CreateUserInput!) {
        createUser(createUserInput: $createUserInput) { id email fullName roles isActive }
      }`,
      {
        createUserInput: {
          email: 'not-an-email',
          password: '123',
          fullName: '',
          roles: ['USER'],
          isActive: true,
        },
      },
      superadminToken,
    );

    expectGraphqlErrors(response);
  });

  it('creates a managed user as superadmin', async () => {
    managedUserEmail = `managed.${suffix}@test.com`;

    const response = await graphql(
      `mutation CreateUser($createUserInput: CreateUserInput!) {
        createUser(createUserInput: $createUserInput) { id email fullName roles isActive }
      }`,
      {
        createUserInput: {
          email: managedUserEmail,
          password: 'Managed123456*',
          fullName: 'Managed User',
          roles: ['USER'],
          isActive: true,
        },
      },
      superadminToken,
    );

    expectNoGraphqlErrors(response);
    expect(response.body.data.createUser.email).toBe(managedUserEmail);
    expect(response.body.data.createUser.roles).toContain('USER');

    managedUserId = response.body.data.createUser.id;
  });

  it('reads a managed user by id as an authenticated user', async () => {
    const response = await graphql(
      `query User($id: ID!) {
        user(id: $id) { id email fullName roles isActive }
      }`,
      { id: managedUserId },
      regularToken,
    );

    expectNoGraphqlErrors(response);
    expect(response.body.data.user.id).toBe(managedUserId);
    expect(response.body.data.user.email).toBe(managedUserEmail);
  });

  it('updates a managed user as superadmin', async () => {
    const response = await graphql(
      `mutation UpdateUser($updateUserInput: UpdateUserInput!) {
        updateUser(updateUserInput: $updateUserInput) { id email fullName roles isActive }
      }`,
      {
        updateUserInput: {
          id: managedUserId,
          fullName: 'Managed User Updated',
        },
      },
      superadminToken,
    );

    expectNoGraphqlErrors(response);
    expect(response.body.data.updateUser.id).toBe(managedUserId);
    expect(response.body.data.updateUser.fullName).toBe('Managed User Updated');
  });

  it('deactivates a managed user as superadmin', async () => {
    const response = await graphql(
      `mutation DeleteUser($id: ID!) {
        deleteUser(id: $id) { id email isActive }
      }`,
      { id: managedUserId },
      superadminToken,
    );

    expectNoGraphqlErrors(response);
    expect(response.body.data.deleteUser.id).toBe(managedUserId);
    expect(response.body.data.deleteUser.isActive).toBe(false);
  });

  it('rejects login for an inactive managed user', async () => {
    const response = await graphql(
      `mutation Login($loginInput: LoginInput!) {
        login(loginInput: $loginInput) {
          token
          user { id }
        }
      }`,
      {
        loginInput: {
          email: managedUserEmail,
          password: 'Managed123456*',
        },
      },
    );

    expectGraphqlErrors(response);
  });

  it('creates a vault for the owner with expected defaults', async () => {
    const response = await graphql(
      `mutation CreateVault($createVaultInput: CreateVaultInput!) {
        createVault(createVaultInput: $createVaultInput) {
          id
          name
          description
          type
          baseCurrency
          ownerUserId
          deletedAt
        }
      }`,
      {
        createVaultInput: {
          name: 'Owner Vault',
        },
      },
      regularToken,
    );

    expectNoGraphqlErrors(response);
    expect(response.body.data.createVault.name).toBe('Owner Vault');
    expect(response.body.data.createVault.type).toBe('PERSONAL');
    expect(response.body.data.createVault.baseCurrency).toBe('GALLEON');
    expect(response.body.data.createVault.ownerUserId).toBe(regularUserId);
    expect(response.body.data.createVault.deletedAt).toBeNull();

    ownerVaultId = response.body.data.createVault.id;
  });

  it('lists only the owner vaults for a regular user', async () => {
    const otherAuth = await signup('other', 'Other User');
    otherToken = otherAuth.token;

    const otherVault = await createVault(otherToken, 'Other Vault');
    otherVaultId = otherVault.id as string;

    const response = await graphql(
      'query { vaults { id name ownerUserId deletedAt } }',
      undefined,
      regularToken,
    );

    expectNoGraphqlErrors(response);
    expect(response.body.data.vaults).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: ownerVaultId })]),
    );
    expect(response.body.data.vaults).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: otherVaultId })]),
    );
  });

  it('reads the owner vault by id', async () => {
    const response = await graphql(
      `query Vault($id: ID!) {
        vault(id: $id) { id name description type baseCurrency ownerUserId deletedAt }
      }`,
      { id: ownerVaultId },
      regularToken,
    );

    expectNoGraphqlErrors(response);
    expect(response.body.data.vault.id).toBe(ownerVaultId);
    expect(response.body.data.vault.ownerUserId).toBe(regularUserId);
  });

  it('updates the owner vault', async () => {
    const response = await graphql(
      `mutation UpdateVault($updateVaultInput: UpdateVaultInput!) {
        updateVault(updateVaultInput: $updateVaultInput) {
          id
          name
          description
          type
          baseCurrency
        }
      }`,
      {
        updateVaultInput: {
          id: ownerVaultId,
          name: 'Owner Vault Updated',
          description: 'Updated owner vault',
          type: 'SHARED',
          baseCurrency: 'SICKLE',
        },
      },
      regularToken,
    );

    expectNoGraphqlErrors(response);
    expect(response.body.data.updateVault.name).toBe('Owner Vault Updated');
    expect(response.body.data.updateVault.description).toBe('Updated owner vault');
    expect(response.body.data.updateVault.type).toBe('SHARED');
    expect(response.body.data.updateVault.baseCurrency).toBe('SICKLE');
  });

  it('rejects reading another regular user vault', async () => {
    const response = await graphql(
      `query Vault($id: ID!) {
        vault(id: $id) { id name ownerUserId }
      }`,
      { id: ownerVaultId },
      otherToken,
    );

    expectGraphqlErrors(response);
  });

  it('allows superadmin to read any vault', async () => {
    const response = await graphql(
      `query Vault($id: ID!) {
        vault(id: $id) { id name ownerUserId deletedAt }
      }`,
      { id: ownerVaultId },
      superadminToken,
    );

    expectNoGraphqlErrors(response);
    expect(response.body.data.vault.id).toBe(ownerVaultId);
  });

  it('creates a transaction in the owner vault', async () => {
    const transaction = await createTransaction(
      regularToken,
      ownerVaultId,
      1500,
      'Initial deposit',
    );

    expect(transaction.vaultId).toBe(ownerVaultId);
    expect(transaction.amountMinor).toBe(1500);
    expect(transaction.currency).toBe('GALLEON');
    expect(transaction.note).toBe('Initial deposit');
    expect(transaction.deletedAt).toBeNull();

    transactionId = transaction.id as string;
  });

  it('lists transactions from the owner vault', async () => {
    const response = await graphql(
      `query Transactions($vaultId: ID!) {
        transactions(vaultId: $vaultId) { id vaultId amountMinor currency type note deletedAt }
      }`,
      { vaultId: ownerVaultId },
      regularToken,
    );

    expectNoGraphqlErrors(response);
    expect(response.body.data.transactions).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: transactionId, vaultId: ownerVaultId })]),
    );
  });

  it('reads a transaction by id', async () => {
    const response = await graphql(
      `query Transaction($id: ID!) {
        transaction(id: $id) { id vaultId amountMinor currency type note deletedAt }
      }`,
      { id: transactionId },
      regularToken,
    );

    expectNoGraphqlErrors(response);
    expect(response.body.data.transaction.id).toBe(transactionId);
    expect(response.body.data.transaction.vaultId).toBe(ownerVaultId);
  });

  it('creates a linked transaction in the same vault', async () => {
    const transaction = await createTransaction(
      regularToken,
      ownerVaultId,
      700,
      'Linked deposit',
      transactionId,
    );

    expect(transaction.vaultId).toBe(ownerVaultId);
    expect(transaction.linkedTransactionId).toBe(transactionId);

    linkedTransactionId = transaction.id as string;
  });

  it('updates a transaction', async () => {
    const response = await graphql(
      `mutation UpdateTransaction($updateTransactionInput: UpdateTransactionInput!) {
        updateTransaction(updateTransactionInput: $updateTransactionInput) {
          id
          amountMinor
          note
          type
          currency
        }
      }`,
      {
        updateTransactionInput: {
          id: transactionId,
          amountMinor: 2500,
          note: 'Updated deposit',
          type: 'EXPENSE',
          currency: 'KNUT',
        },
      },
      regularToken,
    );

    expectNoGraphqlErrors(response);
    expect(response.body.data.updateTransaction.id).toBe(transactionId);
    expect(response.body.data.updateTransaction.amountMinor).toBe(2500);
    expect(response.body.data.updateTransaction.note).toBe('Updated deposit');
    expect(response.body.data.updateTransaction.type).toBe('EXPENSE');
    expect(response.body.data.updateTransaction.currency).toBe('KNUT');
  });

  it('rejects invalid transaction validation and linked transaction rules', async () => {
    const invalidAmountResponse = await graphql(
      `mutation CreateTransaction($createTransactionInput: CreateTransactionInput!) {
        createTransaction(createTransactionInput: $createTransactionInput) { id }
      }`,
      {
        createTransactionInput: {
          vaultId: ownerVaultId,
          type: 'INCOME',
          amountMinor: 0,
          currency: 'GALLEON',
          note: 'Invalid amount',
        },
      },
      regularToken,
    );

    expectGraphqlErrors(invalidAmountResponse);

    const selfLinkResponse = await graphql(
      `mutation UpdateTransaction($updateTransactionInput: UpdateTransactionInput!) {
        updateTransaction(updateTransactionInput: $updateTransactionInput) { id linkedTransactionId }
      }`,
      {
        updateTransactionInput: {
          id: transactionId,
          linkedTransactionId: transactionId,
        },
      },
      regularToken,
    );

    expectGraphqlErrors(selfLinkResponse);
  });

  it('rejects transaction mutations from another vault user and deletes created resources', async () => {
    const forbiddenTransactionResponse = await graphql(
      `mutation CreateTransaction($createTransactionInput: CreateTransactionInput!) {
        createTransaction(createTransactionInput: $createTransactionInput) { id }
      }`,
      {
        createTransactionInput: {
          vaultId: ownerVaultId,
          type: 'INCOME',
          amountMinor: 500,
          currency: 'GALLEON',
          note: 'Forbidden transaction',
        },
      },
      otherToken,
    );

    expectGraphqlErrors(forbiddenTransactionResponse);

    const deleteLinkedTransactionResponse = await graphql(
      `mutation DeleteTransaction($id: ID!) {
        deleteTransaction(id: $id) { id deletedAt }
      }`,
      { id: linkedTransactionId },
      regularToken,
    );

    expectNoGraphqlErrors(deleteLinkedTransactionResponse);
    expect(deleteLinkedTransactionResponse.body.data.deleteTransaction.deletedAt).toEqual(expect.any(String));

    const deleteTransactionResponse = await graphql(
      `mutation DeleteTransaction($id: ID!) {
        deleteTransaction(id: $id) { id deletedAt }
      }`,
      { id: transactionId },
      regularToken,
    );

    expectNoGraphqlErrors(deleteTransactionResponse);
    expect(deleteTransactionResponse.body.data.deleteTransaction.deletedAt).toEqual(expect.any(String));

    const deleteVaultResponse = await graphql(
      `mutation DeleteVault($id: ID!) {
        deleteVault(id: $id) { id deletedAt }
      }`,
      { id: ownerVaultId },
      regularToken,
    );

    expectNoGraphqlErrors(deleteVaultResponse);
    expect(deleteVaultResponse.body.data.deleteVault.deletedAt).toEqual(expect.any(String));
  });
});

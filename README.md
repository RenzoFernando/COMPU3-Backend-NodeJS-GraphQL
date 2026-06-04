# COMPU3 Backend NodeJS + GraphQL

- Luna Catalina Martínez Vásquez — A00401964
- Renzo Fernando Mosquera Daza — A00401681
- Hideki Tamura Hernández — A00348618


## Despliegue

```txt
Health:  https://compu3-backend-nodejs-graphql.onrender.com/api/health
GraphQL: https://compu3-backend-nodejs-graphql.onrender.com/api/graphql
```

El backend está desplegado en **Render** y utiliza **MongoDB Atlas** en producción.

## Tecnologías

NestJS, TypeScript, GraphQL con Apollo Driver, MongoDB, Mongoose, Passport, JWT, bcrypt, class-validator, Jest, Supertest, mongodb-memory-server, Postman, Docker Compose y Render.

## Funcionalidades implementadas

| Módulo | Funcionalidad |
|---|---|
| Auth | Registro, login, refresh token, logout y consulta del usuario autenticado. |
| Users | Consulta de usuarios para autenticados; creación, actualización y desactivación para `SUPERADMIN`. |
| Vaults | CRUD de bóvedas propias; el `SUPERADMIN` puede gestionar cualquier bóveda. |
| Transactions | CRUD de transacciones asociadas a bóvedas y relación opcional entre transacciones. |
| Health | Verificación del estado mediante REST y GraphQL. |

### Reglas principales

- Roles disponibles: `USER` y `SUPERADMIN`.
- Todas las operaciones de usuarios, bóvedas y transacciones requieren autenticación JWT.
- Solo el `SUPERADMIN` puede crear, actualizar o desactivar usuarios.
- Los usuarios gestionan únicamente sus propias bóvedas y transacciones; el `SUPERADMIN` puede gestionar todas.
- Las eliminaciones de usuarios, bóvedas y transacciones son lógicas.
- Contraseñas y refresh tokens se almacenan como hashes con bcrypt.

## Operaciones GraphQL

Todas se ejecutan mediante `POST /api/graphql`.

| Módulo | Operaciones | Acceso |
|---|---|---|
| Health | `health` | Público |
| Auth | `signup`, `login`, `refresh` | Público |
| Auth | `logout`, `me` | Autenticado |
| Users | `getAll`, `user(id)` | Autenticado |
| Users | `createUser`, `updateUser`, `deleteUser(id)` | `SUPERADMIN` |
| Vaults | `vaults`, `vault(id)`, `createVault`, `updateVault`, `deleteVault(id)` | Propietario o `SUPERADMIN` |
| Transactions | `transactions(vaultId)`, `transaction(id)`, `createTransaction`, `updateTransaction`, `deleteTransaction(id)` | Propietario o `SUPERADMIN` |

### Tipos de entrada

| Input | Campos principales |
|---|---|
| `SignUpInput` | `email`, `password`, `fullName` |
| `LoginInput` | `email`, `password` |
| `RefreshTokenInput` | `refreshToken` |
| `CreateUserInput` | `email`, `password`, `fullName`, `roles`, `isActive` |
| `UpdateUserInput` | `id` y campos modificables de usuario |
| `CreateVaultInput` | `name`, `description`, `type`, `baseCurrency` |
| `UpdateVaultInput` | `id` y campos modificables de bóveda |
| `CreateTransactionInput` | `vaultId`, `type`, `amountMinor`, `currency`, `occurredAt`, `note`, `linkedTransactionId` |
| `UpdateTransactionInput` | `id` y campos modificables de transacción |

Enums disponibles:

```txt
UserRole: SUPERADMIN, USER
VaultType: PERSONAL, SHARED, HOUSEHOLD
Currency: GALLEON, SICKLE, KNUT
MovementKind: INCOME, EXPENSE, TRANSFER
```

Para operaciones protegidas:

```txt
Authorization: Bearer <ACCESS_TOKEN>
```

Ejemplo de login:

```graphql
mutation {
  login(loginInput: {
    email: "superadmin@gringotts.hp"
    password: "ChangeMe2026*"
  }) {
    token
    refreshToken
    user { id email roles }
  }
}
```

## Configuración local

### Requisitos

- Node.js 22 o Bun compatible
- Bun
- Docker y/o una instancia disponible de MongoDB

### Variables de entorno

Crear `.env` a partir de `.env.example`:

```env
NODE_ENV=development
APP_PORT=9000
MONGO_URI=mongodb://127.0.0.1:27017/compu3_graphql
JWT_SECRET=<ACCESS_SECRET>
JWT_REFRESH_SECRET=<REFRESH_SECRET>
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
SUPERADMIN_NAME=Ragnok Ironclaw
SUPERADMIN_EMAIL=superadmin@gringotts.hp
SUPERADMIN_PASSWORD=<SUPERADMIN_PASSWORD>
```

Las credenciales predeterminadas solo deben usarse en desarrollo.

### Ejecución

```bash
bun install
docker compose up -d mongo
bun run start:dev
```

```txt
GraphQL local: http://localhost:9000/api/graphql
Health local:  http://localhost:9000/api/health
```

Compilación:

```bash
bun run build
```

## Pruebas y revisión de funcionalidades

### Supertest E2E

Las pruebas están en `test/app.e2e-spec.ts` y utilizan `mongodb-memory-server` para trabajar con una base de datos aislada. Cubren autenticación, permisos, validaciones, usuarios, bóvedas, transacciones, relaciones y errores esperados.

```bash
bun run test:e2e
```

### Postman

La colección de revisión está en:

```txt
postman/compu3-graphql.postman_collection.json
```

## Seguridad, validaciones y errores

- JWT adaptado al contexto de GraphQL mediante guards.
- Autorización por rol y propiedad del recurso.
- `ValidationPipe` global y validaciones con `class-validator`.
- Rechazo de campos no permitidos.
- Contraseñas y refresh tokens no se exponen en GraphQL.
- Manejo controlado de credenciales inválidas, emails duplicados, IDs inválidos, recursos inexistentes y accesos sin permisos.

## Despliegue

El servicio está configurado para Render mediante `render.yaml`. En producción se conecta a MongoDB Atlas mediante `MONGO_URI` y requiere configurar los secretos JWT y las credenciales del superadmin en las variables de entorno de Render.

## Dificultades resueltas y estado final

Las principales dificultades fueron adaptar Passport JWT al contexto de GraphQL, aplicar autorización por propietario en bóvedas y transacciones, y ejecutar pruebas E2E aisladas de la base de datos real.

No quedaron funcionalidades obligatorias del taller sin desarrollar. El proyecto incluye GraphQL, CRUD, validaciones, manejo de errores, autenticación, autorización, relación entre módulos, pruebas en Supertest y Postman, despliegue y esta documentación unificada como README e informe de funcionalidades.

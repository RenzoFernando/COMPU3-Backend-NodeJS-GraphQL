# COMPU3-Backend-NodeJS-GraphQL

Backend NestJS con GraphQL, JWT, roles de usuario y MongoDB.

## Requisitos

- Node.js 24 o compatible
- npm
- MongoDB local o MongoDB Atlas

## Variables de entorno

Copia `.env.example` a `.env` para desarrollo local.

```env
NODE_ENV=development
APP_PORT=9000
PORT=9000
MONGO_URI=mongodb+srv://renzofernandomd_db_user:renzofernandomd_db_password@graphql.oor9bkf.mongodb.net/compu3_graphql?retryWrites=true&w=majority
JWT_SECRET=change_me_access_secret
JWT_REFRESH_SECRET=change_me_refresh_secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
SUPERADMIN_NAME=Ragnok Ironclaw
SUPERADMIN_EMAIL=superadmin@gringotts.hp
SUPERADMIN_PASSWORD=ChangeMe2026*
```

## Ejecución local sin Docker

```bash
npm install
npm run start:dev
```

La API queda disponible en:

```txt
http://localhost:9000/api/graphql
```

El health check REST queda disponible en:

```txt
http://localhost:9000/api/health
```

## Ejecución local con Mongo en Docker

```bash
docker compose up -d mongo
npm install
npm run start:dev
```

Para usar Mongo local, cambia `MONGO_URI` por:

```env
MONGO_URI=mongodb://127.0.0.1:27017/compu3_graphql
```

## Despliegue en Render con Docker y MongoDB Atlas

Para Render no se debe depender del `docker-compose.yml`, porque ese archivo sólo levanta MongoDB local. En Render el backend debe conectarse a MongoDB Atlas mediante `MONGO_URI`.

1. Sube el repositorio a GitHub.
2. En Render, crea un Blueprint desde el repositorio si vas a usar `render.yaml`, o crea un Web Service manual con runtime Docker.
3. Configura estas variables de entorno en Render:

```env
NODE_ENV=production
PORT=10000
APP_PORT=10000
MONGO_URI=mongodb+srv://renzofernandomd_db_user:renzofernandomd_db_password@graphql.oor9bkf.mongodb.net/compu3_graphql?retryWrites=true&w=majority
JWT_SECRET=change_me_access_secret
JWT_REFRESH_SECRET=change_me_refresh_secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
SUPERADMIN_NAME=Ragnok Ironclaw
SUPERADMIN_EMAIL=superadmin@gringotts.hp
SUPERADMIN_PASSWORD=ChangeMe2026*
```

4. En MongoDB Atlas, permite conexiones desde Render. Para pruebas puedes permitir `0.0.0.0/0` en Network Access.
5. Ejecuta el deploy.
6. Revisa el health check en:

```txt
https://TU-SERVICIO.onrender.com/api/health
```

7. Revisa GraphQL en:

```txt
https://TU-SERVICIO.onrender.com/api/graphql
```

## Funcionalidades implementadas

- Registro de usuarios con `signup`.
- Inicio de sesión con `login`.
- Refresh token con `refresh`.
- Cierre de sesión con `logout`.
- Consulta del usuario autenticado con `me`.
- Listado de usuarios con `getAll`.
- Consulta de usuario por id con `user`.
- Creación, actualización y eliminación lógica de usuarios para rol superadmin.
- Creación automática de superadmin al iniciar la aplicación.
- Health check REST y GraphQL.

## Operaciones GraphQL principales

### Signup

```graphql
mutation {
  signup(signupInput: {
    email: "user@test.com"
    password: "User123456*"
    fullName: "User Test"
  }) {
    token
    refreshToken
    user {
      id
      email
      fullName
      roles
    }
  }
}
```

### Login

```graphql
mutation {
  login(loginInput: {
    email: "superadmin@gringotts.hp"
    password: "ChangeMe2026*"
  }) {
    token
    refreshToken
    user {
      id
      email
      fullName
      roles
    }
  }
}
```

### Me

```graphql
query {
  me {
    id
    email
    fullName
    roles
    isActive
  }
}
```

### GetAll

```graphql
query {
  getAll {
    id
    email
    fullName
    roles
    isActive
  }
}
```

### CreateUser

```graphql
mutation {
  createUser(createUserInput: {
    email: "new@test.com"
    password: "New123456*"
    fullName: "New User"
    roles: [USER]
    isActive: true
  }) {
    id
    email
    fullName
    roles
    isActive
  }
}
```

### UpdateUser

```graphql
mutation {
  updateUser(updateUserInput: {
    id: "USER_ID"
    fullName: "Updated User"
    isActive: true
  }) {
    id
    email
    fullName
    roles
    isActive
  }
}
```

### DeleteUser

```graphql
mutation {
  deleteUser(id: "USER_ID") {
    id
    email
    isActive
  }
}
```

## Autenticación en Postman

Para operaciones protegidas, agrega el header:

```txt
Authorization: Bearer TOKEN
```

## Dificultades o pendientes

- `docker-compose.yml` queda únicamente para desarrollo local.
- En Render se usa MongoDB Atlas mediante `MONGO_URI`.
- Los módulos `VaultsModule` y `TransactionsModule` están registrados pero todavía no tienen resolvers ni modelos propios en el reporte actual.

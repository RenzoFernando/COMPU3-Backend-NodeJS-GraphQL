export const envConfiguration = () => ({
  app: {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.APP_PORT ?? 9000),
  },
  database: {
    mongoUri: process.env.MONGO_URI ?? '',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'change_me_access_secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'change_me_refresh_secret',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  superadmin: {
    name: process.env.SUPERADMIN_NAME ?? 'Ragnok Ironclaw',
    email: process.env.SUPERADMIN_EMAIL ?? 'superadmin@gringotts.hp',
    password: process.env.SUPERADMIN_PASSWORD ?? 'ChangeMe2026*',
  },
});

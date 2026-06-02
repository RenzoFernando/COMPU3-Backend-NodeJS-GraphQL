FROM node:24-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile=false

COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src

RUN pnpm run build

FROM node:24-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable

COPY package.json pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile=false

COPY --from=builder /app/dist ./dist

EXPOSE 9000

CMD ["node", "dist/main.js"]

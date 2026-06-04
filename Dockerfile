FROM oven/bun:1.2.23-debian AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src

RUN bun run build

FROM oven/bun:1.2.23-debian AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY --from=builder /app/dist ./dist

EXPOSE 10000

CMD ["bun", "dist/main.js"]

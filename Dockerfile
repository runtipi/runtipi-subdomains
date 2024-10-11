# ---- BUILDER ----
FROM oven/bun:1.1.29-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3

COPY ./package.json ./package.json
COPY ./bun.lockb ./bun.lockb
COPY ./tsconfig.json ./tsconfig.json

COPY ./src ./src

RUN bun install

ENV NODE_ENV=production

RUN bun build ./src/index.ts --outdir ./build --minify --target=bun

# ---- RUNNER ----
FROM oven/bun:1.1.29-alpine AS runner

WORKDIR /app

COPY --from=builder /app/build/index.js ./index.js
COPY ./src/migrations ./migrations

ENV NODE_ENV=production

CMD ["bun", "index.js"]
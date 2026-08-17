FROM node:22-alpine AS base

WORKDIR /app

# Dependencies
FROM base AS deps

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile


# Build
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN yarn build


# Production
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Needed to run drizzle-kit db:push
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/lib ./lib

EXPOSE 3000

CMD ["sh", "-c", "yarn db:push && node server.js"]
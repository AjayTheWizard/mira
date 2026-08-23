FROM node:22-alpine AS base

WORKDIR /app

# Dependencies
FROM base AS deps
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Build
FROM base AS builder
ARG DATABASE_URL
ARG BETTER_AUTH_URL
ARG BETTER_AUTH_SECRET
ARG NEXT_PUBLIC_LOCATIONIQ_API_KEY

ENV DATABASE_URL=$DATABASE_URL
ENV BETTER_AUTH_URL=$BETTER_AUTH_URL
ENV BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET
ENV NEXT_PUBLIC_LOCATIONIQ_API_KEY=$NEXT_PUBLIC_LOCATIONIQ_API_KEY

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
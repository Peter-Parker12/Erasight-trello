# ============================
# 1) Builder stage
# ============================
FROM node:22-slim AS builder

WORKDIR /app

ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_CLERK_SIGN_IN_URL
ARG NEXT_PUBLIC_CLERK_SIGN_UP_URL
ARG NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL
ARG NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL
ARG NEXT_PUBLIC_UNSPLASH_ACCESS_KEY

ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY \
    NEXT_PUBLIC_CLERK_SIGN_IN_URL=$NEXT_PUBLIC_CLERK_SIGN_IN_URL \
    NEXT_PUBLIC_CLERK_SIGN_UP_URL=$NEXT_PUBLIC_CLERK_SIGN_UP_URL \
    NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=$NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL \
    NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=$NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL \
    NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=$NEXT_PUBLIC_UNSPLASH_ACCESS_KEY

# Install build tools
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    openssl \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./

RUN --mount=type=cache,target=/root/.npm \
    if [ -f package-lock.json ]; then \
      npm ci --legacy-peer-deps --ignore-scripts; \
    else \
      npm install --legacy-peer-deps --ignore-scripts; \
    fi

COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js app (standalone output traces only the deps it needs)
RUN --mount=type=cache,target=/app/.next/cache \
    npm run build

# ============================
# 2) Production stage
# ============================
FROM node:22-slim AS production

WORKDIR /app

RUN apt-get update && apt-get install -y \
    openssl \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

# Standalone output already bundles a minimal node_modules + server.js
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "server.js"]

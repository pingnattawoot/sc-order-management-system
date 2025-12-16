# =============================================
# ScreenCloud Order Management System - API
# Multi-stage Dockerfile for Railway deployment
# =============================================

# Stage 1: Build
FROM node:22.12-alpine AS builder

# Install pnpm via npm (corepack has signature issues)
RUN npm install -g pnpm@9.15.0

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/api ./apps/api

# Generate Prisma client
RUN pnpm --filter api exec prisma generate

# Build the API
RUN pnpm --filter api build

# Stage 2: Production
FROM node:22.12-alpine AS runner

# Install pnpm via npm
RUN npm install -g pnpm@9.15.0

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built files from builder
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/src/generated ./apps/api/src/generated
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

# Expose port
ENV PORT=3000
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start command
CMD ["sh", "-c", "pnpm --filter api exec prisma migrate deploy && node apps/api/dist/index.js"]


# =============================================
# ScreenCloud Order Management System - API
# Single-stage Dockerfile for Railway deployment
# =============================================

FROM node:22.12-alpine

# Install pnpm via npm
RUN npm install -g pnpm@9.15.0

WORKDIR /app

# Copy all package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy API source code
COPY apps/api ./apps/api

# Generate Prisma client (dummy URL - only reads schema)
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" pnpm --filter api exec prisma generate

# Build the API
RUN pnpm --filter api build

# Expose port (Railway sets PORT env var)
EXPOSE 3000

# Start command: run migrations then start server
CMD ["sh", "-c", "pnpm --filter api exec prisma migrate deploy && node apps/api/dist/index.js"]

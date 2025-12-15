# ScreenCloud Order Management System - Implementation Plan

## Overview

This document outlines the step-by-step implementation plan for building a production-ready Order Management System for ScreenCloud's SCOS devices.

**Estimated Time:** 4-6 hours  
**Tech Stack:** TypeScript, Node.js, Fastify, Prisma 7, GraphQL (Pothos), PostgreSQL, React (Vite), shadcn/ui, Leaflet

---

## Phase 1: Project Infrastructure Setup ✅

### 1.1 Initialize Monorepo Structure ✅

- [x] Create root `package.json` with workspaces configuration
- [x] Create folder structure:
  ```
  /
  ├── apps/
  │   ├── api/          # Backend GraphQL API
  │   └── web/          # React Frontend
  ├── packages/
  │   └── shared/       # Shared types and utilities
  ├── docs/             # Documentation & ADRs
  └── docker/           # Docker configurations
  ```
- [x] Initialize git repository with `.gitignore`
- [x] **COMMIT:** "chore: initialize monorepo structure" _(d656bc1)_

### 1.2 Setup Backend Project (apps/api) ✅

- [x] Initialize `apps/api/package.json`
- [x] Install core dependencies:
  - `fastify` - Web framework
  - `@prisma/client` - Database ORM
  - `prisma` - Database toolkit (dev)
  - `graphql` - GraphQL core
  - `graphql-yoga` - GraphQL server
  - `@pothos/core` - GraphQL schema builder
  - `decimal.js` - Precise decimal calculations
- [x] Install dev dependencies:
  - `typescript`, `tsx`, `@types/node`
  - `vitest` - Testing framework
  - `eslint`, `prettier`
- [x] Create `tsconfig.json` with strict mode
- [x] Create `.eslintrc.js` and `.prettierrc`
- [x] **COMMIT:** "chore(api): setup backend project with dependencies" _(92694fe)_

### 1.3 Setup Docker Environment ✅

- [x] Create `docker-compose.yml` with PostgreSQL service
- [x] Add health check for PostgreSQL
- [x] Create `.env.example` with required environment variables
- [x] **COMMIT:** "chore: add docker-compose for PostgreSQL" _(121da4b)_

---

## Phase 2: Database Layer (Prisma) ✅

### 2.1 Initialize Prisma ✅

- [x] Run `pnpm exec prisma init` in `apps/api`
- [x] Configure `DATABASE_URL` in `.env`
- [x] Configure `prisma.config.ts` for Prisma 7
- [x] **COMMIT:** "feat(api): add prisma 7 database layer with seed data" _(b97937e)_

### 2.2 Design Database Schema ✅

- [x] Create `Product` model
- [x] Create `Warehouse` model
- [x] Create `Order` model
- [x] Create `OrderShipment` model
- [x] Add `OrderStatus` enum: `PENDING`, `COMPLETED`, `CANCELLED`
- [x] Add necessary indexes for performance
- [x] _(included in Phase 2 commit)_

### 2.3 Create Database Migrations ✅

- [x] Run `pnpm exec prisma migrate dev --name init`
- [x] Migration created: `20251215093710_init`
- [x] _(included in Phase 2 commit)_

### 2.4 Create Seed Data ✅

- [x] Create `apps/api/prisma/seed.ts` with `@prisma/adapter-pg`
- [x] Add SCOS Station P1 Pro product data ($150, 365g)
- [x] Add 6 warehouse seed data (2,556 total units)
- [x] Configure `migrations.seed` in `prisma.config.ts`
- [x] _(included in Phase 2 commit)_

---

## Phase 3: Server & Entry Point ✅

> **Why Phase 3?** Start the server early so we can see changes immediately during development.

### 3.1 Setup Project Structure ✅

- [x] Create folder structure in `apps/api/src`:
  ```
  src/
  ├── index.ts           # Entry point
  ├── server.ts          # Fastify server setup
  ├── config/            # Configuration
  │   └── index.ts
  ├── lib/               # Shared utilities
  │   ├── prisma.ts      # Prisma client singleton
  │   ├── decimal.ts     # Decimal.js utilities
  │   └── haversine.ts   # Distance calculation (Phase 5)
  ├── domain/            # Business logic (Phase 5)
  │   ├── pricing/
  │   ├── logistics/
  │   └── orders/
  └── graphql/           # GraphQL layer (Phase 6)
  ```
- [x] _(consolidated with 3.4 commit)_

### 3.2 Create Prisma Client Singleton ✅

- [x] Create `apps/api/src/lib/prisma.ts`
- [x] Implement singleton pattern with pg adapter for Prisma 7
- [x] Add connection pooling configuration (max: 20, idle: 30s, timeout: 2s)
- [x] Add `disconnectPrisma()` for graceful shutdown
- [x] Add `checkDatabaseHealth()` for health endpoint
- [x] _(consolidated with 3.4 commit)_

### 3.3 Create Fastify Server ✅

- [x] Create `apps/api/src/server.ts`
- [x] Configure Fastify with:
  - Logger (pino-pretty in dev, JSON in prod)
  - CORS (@fastify/cors)
  - Health check endpoint (`/health`) with DB status
  - Root endpoint (`/`) with API info
- [x] Add graceful shutdown handling (SIGTERM, SIGINT)
- [x] _(consolidated with 3.4 commit)_

### 3.4 Create Entry Point ✅

- [x] Create `apps/api/src/index.ts`
- [x] Create `apps/api/src/config/index.ts` (centralized config)
- [x] Create `apps/api/src/lib/decimal.ts` (Decimal.js utilities)
- [x] Add @fastify/cors, pino-pretty dependencies
- [x] Server runs at http://localhost:4000
- [x] **COMMIT:** "feat(api): setup fastify server with health check"

---

## Phase 4: Testing Setup ✅

> **Why Phase 4?** Setup testing infrastructure before writing domain logic so we can test each function as we implement it.

### 4.1 Setup Vitest ✅

- [x] Create `apps/api/vitest.config.ts`
  - Node environment, globals enabled, v8 coverage
  - Include `src/**/*.test.ts` pattern
  - Single fork for database test isolation
- [x] Add vitest/globals types to `tsconfig.json`
- [x] Create `apps/api/src/__tests__/setup.ts` (test setup file)
- [x] _(consolidated with 4.2 commit)_

### 4.2 Create Test Helpers ✅

- [x] Create `apps/api/src/__tests__/helpers/factories.ts`:
  - `createTestProduct()` - product factory with defaults
  - `createTestWarehouse()` - warehouse factory with defaults
  - `createTestWarehouses()` - multiple warehouses (London, Manchester, Edinburgh)
  - `createTestCoordinate()` - coordinate factory
  - `createTestOrderInput()` - order input factory
  - `LOCATIONS` - well-known locations (London, NY, LA, Paris, HK, etc.)
- [x] Create `apps/api/src/__tests__/helpers/assertions.ts`:
  - `expectCloseTo()` - floating-point comparison
  - `expectCents()` - monetary value with 1 cent tolerance
  - `expectDistanceKm()` - distance comparison with km tolerance
  - `expectValidId()` - ID format validation
  - `expectRecentDate()` - recent date assertion
- [x] Create verification test `setup.test.ts` (8 tests passing)
- [x] **COMMIT:** "chore(api): setup vitest testing framework with helpers"

---

## Phase 5: Core Domain Logic ✅

> **Note:** Each section includes writing tests alongside implementation. **97 tests passing.**

### 5.1 Implement Haversine Distance Calculation ✅

- [x] Create `apps/api/src/lib/haversine.ts`
- [x] Implement `calculateDistanceKm(lat1, lon1, lat2, lon2)` with Decimal.js
- [x] Implement `calculateDistance(point1, point2)` helper
- [x] **TEST:** 11 tests covering LA→NY, Paris→HK, Sydney→Tokyo, London→NY, same point, antipodal, short distances, symmetry
- [x] _(consolidated with Phase 5 commit)_

### 5.2 Implement Pricing Logic - Discounts ✅

- [x] Create `apps/api/src/domain/pricing/discount.ts`
- [x] Implement volume discount tiers (0%, 5%, 10%, 15%, 20%)
- [x] Export `DISCOUNT_TIERS`, `getDiscountPercentage`, `calculateDiscount`, `getDiscountTier`
- [x] **TEST:** 23 tests covering all tiers, boundary conditions, DiscountResult structure
- [x] _(consolidated with Phase 5 commit)_

### 5.3 Implement Shipping Cost Calculation ✅

- [x] Create `apps/api/src/domain/pricing/shipping.ts`
- [x] Implement `calculateShippingCost(distanceKm, weightGrams, quantity)`
- [x] Implement `isShippingCostValid()`, `calculateShippingPercentage()`, `checkShippingValidity()`
- [x] **TEST:** 22 tests covering formula, 15% rule, edge cases, detailed validity breakdown
- [x] _(consolidated with Phase 5 commit)_

### 5.4 Implement Warehouse Optimizer (Core Algorithm) ✅

- [x] Create `apps/api/src/domain/logistics/warehouse-optimizer.ts`
- [x] Implement `WarehouseOptimizer` class with greedy nearest-first algorithm
- [x] Handle insufficient stock, weighted average distance calculation
- [x] **TEST:** 17 tests covering single/multi warehouse, insufficient stock, nearest-first selection, distance/shipping calculation
- [x] _(consolidated with Phase 5 commit)_

### 5.5 Implement Order Service ✅

- [x] Create `apps/api/src/domain/orders/order.service.ts`
- [x] Implement `verifyOrder()` - returns quote without DB write
- [x] Implement `submitOrder()` - transaction with pessimistic locking (SELECT FOR UPDATE)
- [x] Handle Prisma Decimal type conversions
- [x] Implement `getOrder()`, `getOrderByNumber()`, `listOrders()`
- [x] **TEST:** 16 tests covering verify, submit, stock updates, order retrieval
- [x] **COMMIT:** "feat(api): implement core domain logic with tests"

---

## Phase 6: GraphQL API Layer ✅

### 6.1 Setup Pothos Schema Builder ✅

- [x] Create `apps/api/src/graphql/builder.ts`
- [x] Configure Pothos with custom scalars (Decimal, DateTime)
- [x] Define Context type with requestId for tracing
- [x] _(consolidated with Phase 6 commit)_

### 6.2 Define GraphQL Types ✅

- [x] Create `apps/api/src/graphql/types/`:
  - `product.ts` - Product type with formatted price, weight in kg
  - `warehouse.ts` - Warehouse type with Decimal coordinates
  - `order.ts` - Order type with OrderStatus enum, formatted fields
  - `quote.ts` - OrderQuote, DiscountResult, ShippingValidity, QuoteProduct
  - `shipment.ts` - ShipmentDetail, OrderShipment types
- [x] All types include formatted currency fields (e.g., `priceFormatted`)
- [x] _(consolidated with Phase 6 commit)_

### 6.3 Implement Queries ✅

- [x] Create `apps/api/src/graphql/resolvers/queries.ts`
- [x] Implement queries:
  - `products` - List all products
  - `product(id)` - Get single product
  - `warehouses` - List all warehouses with current stock
  - `warehouse(id)` - Get single warehouse
  - `totalStock` - Aggregate total stock across warehouses
  - `orders(limit)` - List all orders (newest first)
  - `order(id)` - Get single order with shipment details
  - `orderByNumber(orderNumber)` - Get order by ORD-XXXXX number
- [x] _(consolidated with Phase 6 commit)_

### 6.4 Implement Mutations ✅

- [x] Create `apps/api/src/graphql/resolvers/mutations.ts`
- [x] Create `OrderInput` input type
- [x] Implement mutations:
  - `verifyOrder(input: OrderInput!)` → OrderQuote
    - Returns: isValid, discount, shipments[], shippingValidity, grandTotal
  - `submitOrder(input: OrderInput!)` → Order
    - Returns: created order with shipments and warehouse info
- [x] Add error handling with GraphQL error codes (VERIFICATION_ERROR, INSUFFICIENT_STOCK, etc.)
- [x] _(consolidated with Phase 6 commit)_

### 6.5 Integrate GraphQL with Fastify ✅

- [x] Create `apps/api/src/graphql/yoga.ts`
- [x] Integrate GraphQL Yoga with Fastify (GET, POST, OPTIONS)
- [x] Setup GraphQL context with requestId for tracing
- [x] Enable GraphiQL playground in development with default queries
- [x] Mask errors in production
- [x] _(consolidated with Phase 6 commit)_

### 6.6 Generate GraphQL Schema File ✅

- [x] Create `apps/api/scripts/generate-schema.ts`
- [x] Generated `schema.graphql` (358 lines)
- [x] Add `graphql:generate` script to package.json
- [x] **COMMIT:** "feat(api): implement graphql api layer"

---

## Phase 7: React Frontend ✅

> **UI Design:** Tab-based interface with 3 main tabs: New Order, Orders History, and Stock Management.

### 7.1 Initialize Vite React Project ✅

- [x] Create `apps/web` with `pnpm create vite`
- [x] Configure TypeScript with strict mode
- [x] Install dependencies (@apollo/client, graphql, react-leaflet, leaflet)
- [x] **COMMIT:** "chore(web): initialize vite react project" _(d28084c)_

### 7.2 Setup Tailwind & shadcn/ui ✅

- [x] Install and configure Tailwind CSS v4
- [x] Initialize shadcn/ui
- [x] Add essential components (Button, Input, Card, Badge, Sheet, Tabs, Table, Sonner)
- [x] **COMMIT:** "chore(web): setup tailwind and shadcn/ui" _(85e5584)_

### 7.3 Setup Apollo Client & GraphQL Codegen ✅

- [x] Create `apps/web/src/lib/apollo.ts`
- [x] Configure Apollo Client with `http://localhost:4000/graphql`
- [x] Setup ApolloProvider in main.tsx
- [x] Setup GraphQL Codegen with `.graphql` files
- [x] Generate types and hooks from backend API introspection
- [x] **COMMIT:** "chore(web): setup apollo client with queries" _(5d35730)_

### 7.4 Create Shared Map Components ✅

- [x] `Map/WarehouseMap.tsx` - Leaflet map with fit bounds and click-to-select
- [x] `Map/WarehouseMarker.tsx` - Custom marker with stock level colors (green/yellow/red)
- [x] `Map/CustomerMarker.tsx` - Destination pin marker
- [x] Draw shipment lines from warehouses to customer location
- [x] _(consolidated with Phase 7 commit)_

### 7.5 Implement Tab 1: New Order ✅

- [x] `NewOrderTab.tsx` with map and Sheet for order input
- [x] Click map → Open sheet with coordinates and quantity input
- [x] Verify order → Highlight source warehouses on map
- [x] Show pricing breakdown (subtotal, discount, shipping, total)
- [x] Show validity status with error messages
- [x] Submit button (if valid) → Success toast with order number
- [x] _(consolidated with Phase 7 commit)_

### 7.6 Implement Tab 2: Order History ✅

- [x] `OrdersTab.tsx` with table of all orders
- [x] Click row → Sheet with order detail and map
- [x] Map shows customer location + source warehouses with lines
- [x] Full pricing and shipment breakdown
- [x] _(consolidated with Phase 7 commit)_

### 7.7 Implement Tab 3: Stock Management ✅

- [x] `StockTab.tsx` with warehouse table
- [x] Stock level indicators (progress bars + badges)
- [x] Stats cards (total stock, warehouses, average, low stock alerts)
- [x] Map view with stock-based marker colors
- [x] _(consolidated with Phase 7 commit)_

### 7.8 Polish & Final Integration ✅

- [x] Create main `App.tsx` with Tabs component
- [x] Add loading states
- [x] Currency and date formatters
- [x] GraphQL Codegen with `.graphql` files for type safety
- [x] **COMMIT:** "feat(web): implement complete frontend with tabs" _(7c07498)_

---

## Phase 8: DevOps & Documentation

### 8.1 Create Unified Start Command

- [ ] Update root `package.json` scripts:
  - `dev` - Start both API and Web concurrently
  - `setup` - Install deps, run migrations, seed DB
  - `docker:up` - Start PostgreSQL
  - `docker:down` - Stop PostgreSQL
- [ ] Use pnpm's built-in `--parallel` flag for concurrent processes
- [ ] **COMMIT:** "chore: add unified development scripts"

### 8.2 Create Dockerfile for API

- [ ] Create `apps/api/Dockerfile`
- [ ] Multi-stage build for production
- [ ] Include Prisma generation step
- [ ] **COMMIT:** "chore(api): add production dockerfile"

### 8.3 Create README.md

- [ ] Add project description
- [ ] Add quick start guide
- [ ] Document API endpoints
- [ ] Add architecture overview
- [ ] Include development instructions
- [ ] **COMMIT:** "docs: add comprehensive readme"

### 8.4 Finalize Architecture Decision Records

- [x] ADR-001: GraphQL over REST
- [x] ADR-002: Prisma ORM Selection
- [x] ADR-003: Greedy Algorithm for Warehouse Selection
- [x] ADR-004: Decimal.js for Money Calculations
- [x] ADR-005: Pessimistic Locking for Stock Updates
- [x] ADR-006: pnpm Package Manager
- [ ] **COMMIT:** "docs: finalize architecture decision records"

### 8.5 Setup GitHub Actions (Bonus)

- [ ] Create `.github/workflows/ci.yml`
- [ ] Add lint check step
- [ ] Add type check step
- [ ] Add test step
- [ ] **COMMIT:** "ci: add github actions workflow"

---

## Final Checklist

### Code Quality

- [ ] No `any` types used inappropriately
- [ ] All functions have proper TypeScript types
- [ ] JSDoc comments for public APIs
- [ ] Consistent code formatting (Prettier)
- [ ] No ESLint errors

### Business Logic

- [ ] Discount tiers are correctly implemented
- [ ] 15% shipping cap uses post-discount amount
- [ ] Weight is converted from grams to kg correctly
- [ ] Distance calculation is accurate

### Data Consistency

- [ ] Stock updates use database transactions
- [ ] Race conditions are prevented
- [ ] Order numbers are unique

### Developer Experience

- [ ] Single command to start everything
- [ ] Clear error messages
- [ ] GraphiQL available for testing
- [ ] Hot reload in development

### Documentation

- [ ] README has clear setup instructions
- [ ] API is self-documented via GraphQL
- [ ] ADRs explain key decisions

---

## Time Breakdown Estimate

| Phase                     | Estimated Time |
| ------------------------- | -------------- |
| Phase 1: Infrastructure   | 30 min ✅      |
| Phase 2: Database         | 30 min ✅      |
| Phase 3: Server Setup     | 20 min         |
| Phase 4: Testing Setup    | 15 min         |
| Phase 5: Domain Logic     | 75 min         |
| Phase 6: GraphQL API      | 45 min         |
| Phase 7: Frontend         | 90 min         |
| Phase 8: DevOps & Docs    | 30 min         |
| **Total**                 | **~5.5 hours** |

---

## What Would I Do Next (If This Were Real)

1. **Observability**: Add structured logging, metrics (Prometheus), and tracing (OpenTelemetry)
2. **Rate Limiting**: Protect API from abuse
3. **Authentication**: Add API key or OAuth for sales reps
4. **Caching**: Cache warehouse data and precompute common distances
5. **Advanced Logistics**: Consider multi-item orders, different products
6. **Event Sourcing**: Track all stock movements for auditing
7. **CI/CD**: Full deployment pipeline with staging environment
8. **Load Testing**: Verify performance under concurrent orders

# Implementation Checklist

A quick-reference checklist for tracking implementation progress. See [docs/IMPLEMENTATION_PLAN.md](./docs/IMPLEMENTATION_PLAN.md) for detailed descriptions.

---

## Phase 1: Project Infrastructure Setup ✅

### 1.1 Initialize Monorepo Structure ✅

- [x] Create root `package.json` with pnpm workspaces
- [x] Create `pnpm-workspace.yaml`
- [x] Create folder structure (apps/, packages/, docs/, docker/)
- [x] Initialize git with `.gitignore`
- [x] **COMMIT:** `chore: initialize monorepo structure` _(d656bc1)_

### 1.2 Setup Backend Project ✅

- [x] Create `apps/api/package.json`
- [x] Install core deps (fastify, prisma, graphql-yoga, pothos, decimal.js)
- [x] Install dev deps (typescript, vitest, eslint, prettier)
- [x] Create `tsconfig.json` (strict mode)
- [x] Create linting configs
- [x] **COMMIT:** `chore(api): setup backend project with dependencies` _(92694fe)_

### 1.3 Setup Docker Environment ✅

- [x] Create `docker-compose.yml` (PostgreSQL)
- [x] Create `.env.example`
- [x] **COMMIT:** `chore: add docker-compose for PostgreSQL` _(121da4b)_

---

## Phase 2: Database Layer ✅

### 2.1 Initialize Prisma ✅

- [x] Run `pnpm exec prisma init`
- [x] Configure `.env` and `prisma.config.ts` (Prisma 7)
- [x] **COMMIT:** `feat(api): add prisma 7 database layer with seed data` _(b97937e)_

### 2.2 Database Schema ✅

- [x] Create `Product` model
- [x] Create `Warehouse` model
- [x] Create `Order` model
- [x] Create `OrderShipment` model
- [x] Add `OrderStatus` enum
- [x] Add indexes
- [x] _(included in Phase 2 commit)_

### 2.3 Migrations ✅

- [x] Run initial migration (`20251215093710_init`)
- [x] _(included in Phase 2 commit)_

### 2.4 Seed Data ✅

- [x] Create `prisma/seed.ts` with pg adapter
- [x] Add product seed (SCOS P1 Pro: $150, 365g)
- [x] Add warehouse seeds (6 locations, 2,556 total units)
- [x] Configure prisma.seed in prisma.config.ts
- [x] Run seed
- [x] _(included in Phase 2 commit)_

---

## Phase 3: Server & Entry Point ✅

> Start the server early for immediate feedback during development.

### 3.1 Project Structure ✅

- [x] Create folder structure (src/lib/, src/config/, src/domain/, src/graphql/)
- [x] Create `src/config/index.ts` (centralized config)
- [x] Create `src/lib/decimal.ts` (Decimal.js utilities)
- [x] _(consolidated with 3.2-3.4 commit)_

### 3.2 Prisma Client Singleton ✅

- [x] Create `lib/prisma.ts` with pg adapter
- [x] Add connection pooling, health check, graceful disconnect
- [x] _(consolidated with 3.3-3.4 commit)_

### 3.3 Fastify Server ✅

- [x] Create `server.ts`
- [x] Configure logger (pino-pretty in dev), CORS, health check
- [x] Add graceful shutdown (SIGTERM, SIGINT)
- [x] _(consolidated with 3.4 commit)_

### 3.4 Entry Point ✅

- [x] Create `index.ts`
- [x] Add @fastify/cors, pino-pretty dependencies
- [x] **COMMIT:** `feat(api): setup fastify server with health check`

---

## Phase 4: Testing Setup ✅

> Setup testing infrastructure before writing domain logic.

### 4.1 Vitest Setup ✅

- [x] Create `vitest.config.ts`
- [x] Configure test environment (node, globals, coverage)
- [x] Add setup file `src/__tests__/setup.ts`
- [x] Add vitest/globals types to tsconfig.json
- [x] _(consolidated with 4.2 commit)_

### 4.2 Test Helpers ✅

- [x] Create `src/__tests__/helpers/factories.ts` (Product, Warehouse, Coordinate factories)
- [x] Create `src/__tests__/helpers/assertions.ts` (expectCloseTo, expectCents, etc.)
- [x] Create `src/__tests__/helpers/index.ts` (re-exports)
- [x] Add well-known LOCATIONS constant for testing
- [x] Create verification test `setup.test.ts` (8 tests passing)
- [x] **COMMIT:** `chore(api): setup vitest testing framework with helpers`

---

## Phase 5: Core Domain Logic ✅

> Each feature includes tests alongside implementation.

### 5.1 Haversine Distance ✅

- [x] Create `lib/haversine.ts`
- [x] Implement `calculateDistanceKm()` with Decimal.js
- [x] **TEST:** 11 tests (LA→NY, Paris→HK, Sydney→Tokyo, antipodal, symmetry, etc.)
- [x] _(consolidated with Phase 5 commit)_

### 5.2 Discount Logic ✅

- [x] Create `domain/pricing/discount.ts`
- [x] Implement volume discount tiers (0%, 5%, 10%, 15%, 20%)
- [x] Export `DISCOUNT_TIERS`, `getDiscountPercentage`, `calculateDiscount`, `getDiscountTier`
- [x] **TEST:** 23 tests (all tiers, boundary conditions)
- [x] _(consolidated with Phase 5 commit)_

### 5.3 Shipping Cost ✅

- [x] Create `domain/pricing/shipping.ts`
- [x] Implement shipping cost formula (distance × weight × qty × $0.01)
- [x] Implement 15% validity check with detailed breakdown
- [x] **TEST:** 22 tests (formula, 15% rule, edge cases)
- [x] _(consolidated with Phase 5 commit)_

### 5.4 Warehouse Optimizer ✅

- [x] Create `domain/logistics/warehouse-optimizer.ts`
- [x] Implement greedy allocation algorithm (nearest-first)
- [x] Handle insufficient stock, weighted average distance
- [x] **TEST:** 17 tests (single/multi warehouse, insufficient, distance calc)
- [x] _(consolidated with Phase 5 commit)_

### 5.5 Order Service ✅

- [x] Create `domain/orders/order.service.ts`
- [x] Implement `verifyOrder()` - quote without DB write
- [x] Implement `submitOrder()` - with transaction & pessimistic locking
- [x] Handle Prisma Decimal type conversions
- [x] **TEST:** 16 tests (verify, submit, stock updates, order retrieval)
- [x] **COMMIT:** `feat(api): implement core domain logic with tests`

---

## Phase 6: GraphQL API ✅

### 6.1 Pothos Setup ✅

- [x] Create `graphql/builder.ts`
- [x] Configure Decimal & DateTime custom scalars
- [x] _(consolidated with Phase 6 commit)_

### 6.2 GraphQL Types ✅

- [x] Create Product, Warehouse, Order types
- [x] Create Quote, Shipment types with formatted fields
- [x] Add OrderStatus enum
- [x] _(consolidated with Phase 6 commit)_

### 6.3 Queries ✅

- [x] `products`, `product(id)`
- [x] `warehouses`, `warehouse(id)`, `totalStock`
- [x] `orders(limit)`, `order(id)`, `orderByNumber`
- [x] _(consolidated with Phase 6 commit)_

### 6.4 Mutations ✅

- [x] `verifyOrder(input)` - returns quote with full pricing breakdown
- [x] `submitOrder(input)` - creates order with pessimistic locking
- [x] OrderInput type with validation
- [x] _(consolidated with Phase 6 commit)_

### 6.5 Server Integration ✅

- [x] Create `graphql/yoga.ts`
- [x] Integrate with Fastify (GET, POST, OPTIONS)
- [x] Enable GraphiQL with default queries in development
- [x] _(consolidated with Phase 6 commit)_

### 6.6 Schema Generation ✅

- [x] Add `scripts/generate-schema.ts`
- [x] Generated `schema.graphql` (358 lines)
- [x] **COMMIT:** `feat(api): implement graphql api layer`

---

## Phase 7: React Frontend ✅

> Tab-based UI: New Order | Orders History | Stock Management

### 7.1 Vite Setup ✅

- [x] Create `apps/web` with Vite + TypeScript
- [x] Install deps (apollo, leaflet, react-leaflet)
- [x] **COMMIT:** `chore(web): initialize vite react project` _(d28084c)_

### 7.2 Tailwind & shadcn/ui ✅

- [x] Setup Tailwind CSS v4
- [x] Init shadcn/ui (New York style)
- [x] Add components: Button, Input, Card, Badge, Sheet/Dialog, Tabs, Table, Sonner
- [x] **COMMIT:** `chore(web): setup tailwind and shadcn/ui` _(85e5584)_

### 7.3 Apollo Client & Codegen ✅

- [x] Create `lib/apollo.ts` with endpoint
- [x] Setup ApolloProvider in main.tsx
- [x] Setup GraphQL Codegen with `.graphql` files
- [x] Generate types and hooks from backend API
- [x] **COMMIT:** `chore(web): setup apollo client with queries` _(5d35730)_

### 7.4 Shared Map Components ✅

- [x] `Map/WarehouseMap.tsx` - Leaflet map with fit bounds
- [x] `Map/WarehouseMarker.tsx` - Custom marker with stock level colors
- [x] `Map/CustomerMarker.tsx` - Destination marker
- [x] Draw shipment lines from warehouses to customer
- [x] _(consolidated with 7.5-7.8 commit)_

### 7.5 Tab 1: New Order ✅

- [x] Map with all warehouses (fit bounds)
- [x] Click map → Sheet with quantity input
- [x] Verify order → Show results on map
- [x] Highlight source warehouses (green markers + lines)
- [x] Show pricing breakdown + validity
- [x] Submit button (if valid)
- [x] Success toast with order number
- [x] _(consolidated with 7.6-7.8 commit)_

### 7.6 Tab 2: Order History ✅

- [x] Table listing all orders (newest first)
- [x] Click order → Show detail with map
- [x] Map shows customer + source warehouses
- [x] Full pricing and shipment breakdown
- [x] _(consolidated with 7.7-7.8 commit)_

### 7.7 Tab 3: Stock Management ✅

- [x] Warehouse table with stock levels
- [x] Stock indicators (progress bar/colors)
- [x] Map view with stock-based markers
- [x] Stats cards (total, average, low stock alerts)
- [x] _(consolidated with 7.8 commit)_

### 7.8 Polish & Integration ✅

- [x] Main App.tsx with Tabs
- [x] Loading states
- [x] Currency and date formatters
- [x] **COMMIT:** `feat(web): implement complete frontend with tabs` _(7c07498)_

---

## Phase 8: DevOps & Documentation

### 8.1 Unified Start Command

- [ ] Root scripts (`dev`, `setup`, `docker:up`)
- [ ] Use pnpm's built-in `--parallel` flag
- [ ] **COMMIT:** `chore: add unified scripts`

### 8.2 API Dockerfile

- [ ] Multi-stage build
- [ ] **COMMIT:** `chore(api): add dockerfile`

### 8.3 README

- [ ] Project description
- [ ] Quick start guide
- [ ] API documentation
- [ ] Architecture overview
- [ ] **COMMIT:** `docs: add readme`

### 8.4 ADRs

- [x] ADR-001: GraphQL
- [x] ADR-002: Prisma
- [x] ADR-003: Greedy Algorithm
- [x] ADR-004: Decimal.js
- [x] ADR-005: Pessimistic Locking
- [x] ADR-006: pnpm Package Manager
- [ ] **COMMIT:** `docs: finalize architecture decision records`

### 8.5 CI/CD (Bonus)

- [ ] GitHub Actions workflow
- [ ] **COMMIT:** `ci: add github actions`

---

## Final Verification

### Code Quality

- [ ] No inappropriate `any` types
- [ ] All functions typed
- [ ] JSDoc comments present
- [ ] No ESLint errors
- [ ] Consistent formatting

### Business Logic

- [ ] Discount tiers correct
- [ ] 15% cap uses post-discount amount
- [ ] Weight grams→kg conversion correct
- [ ] Distance calculation accurate

### Data Consistency

- [ ] Transactions for stock updates
- [ ] Race conditions prevented
- [ ] Order numbers unique

### DX

- [ ] Single command start works
- [ ] Clear error messages
- [ ] GraphiQL available
- [ ] Hot reload works

---

## Progress

| Phase             | Status         | Commits  |
| ----------------- | -------------- | -------- |
| 1. Infrastructure | ✅ Complete    | 3/3      |
| 2. Database       | ✅ Complete    | 1/1      |
| 3. Server Setup   | ✅ Complete    | 1/1      |
| 4. Testing Setup  | ✅ Complete    | 1/1      |
| 5. Domain Logic   | ✅ Complete    | 1/1      |
| 6. GraphQL API    | ✅ Complete    | 1/1      |
| 7. Frontend       | ✅ Complete    | 4/4      |
| 8. DevOps         | ⬜ Not Started | 0/5      |
| **Total**         | **81%**        | **12/17**|

Legend: ⬜ Not Started | 🟡 In Progress | ✅ Complete

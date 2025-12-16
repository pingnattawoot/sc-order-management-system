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

## Phase 7.9: Multi-Product & Multi-Item Architecture ✅

> **Critical Refactor:** Complete! Backend, frontend, and tests all updated.

### 7.9.1 Database Schema Migration ✅

- [x] Create `WarehouseStock` model (warehouseId, productId, quantity)
- [x] Create `OrderItem` model (orderId, productId, quantity, prices)
- [x] Update `Warehouse` - remove stock, add stocks[]
- [x] Update `Order` - remove quantity, add items[]
- [x] Update `OrderShipment` - orderItemId instead of orderId
- [x] Create migration script & update seed
- [x] **COMMIT:** `feat(api): migrate schema to multi-product architecture`

### 7.9.2 Domain Logic Updates ✅

- [x] Update `WarehouseOptimizer.optimizeForProduct(productId, ...)`
- [x] Create `OrderItemInput` type
- [x] Update `OrderInput` to use items[] array
- [x] Update `verifyOrder()` - process each item, run optimizer per product
- [x] Update `submitOrder()` - create OrderItems, link shipments
- [x] Update stock deduction to use WarehouseStock
- [x] _(Combined into single commit with 7.9.1)_

### 7.9.3 GraphQL API Updates ✅

- [x] Add `WarehouseStock`, `OrderItem` types
- [x] Add `OrderItemInput` input type
- [x] Update `OrderInput` with items[]
- [x] Update `OrderQuote` with item-level breakdowns
- [x] Update warehouse/order queries
- [x] _(Combined into single commit with 7.9.1)_

### 7.9.4 Frontend Updates ✅

- [x] Fetch products list on load
- [x] Add "Add Item" UI in NewOrderTab
- [x] Support multiple products before verification
- [x] Update order display for items
- [x] Update StockTab for stock per product
- [x] Regenerate GraphQL types
- [x] **COMMIT:** `feat(web): update frontend for multi-item orders`

### 7.9.5 Testing ✅

- [x] Update existing tests for new schema
- [x] Multi-product warehouse stock tests
- [x] Multi-item order verification tests
- [x] Greedy algorithm per product tests
- [x] **COMMIT:** `test: add multi-product order tests`

---

## Phase 8: DevOps & Documentation ✅

### 8.1 Unified Start Command ✅

- [x] Root scripts (`dev`, `build`, `lint`, `typecheck`)
- [x] pnpm workspace commands for filtering
- [x] _(included in monorepo setup)_

### 8.2 API Dockerfile ✅

- [x] Multi-stage build with Node 22 Alpine
- [x] pnpm workspace support
- [x] Prisma generate and migrate in Docker
- [x] Health check endpoint
- [x] **COMMIT:** `chore(api): add dockerfile`

### 8.3 README ✅

- [x] Project description
- [x] Live demo URLs
- [x] Quick start guide
- [x] Architecture overview
- [x] API documentation
- [x] **COMMIT:** `docs: add comprehensive readme`

### 8.4 ADRs ✅

- [x] ADR-001: GraphQL
- [x] ADR-002: Prisma
- [x] ADR-003: Greedy Algorithm
- [x] ADR-004: Decimal.js
- [x] ADR-005: Pessimistic Locking (with load testing recommendations)
- [x] ADR-006: pnpm Package Manager
- [x] ADR-007: Test Database Safety
- [x] ADR-008: Application-Level Haversine vs PostGIS
- [x] ADR-009: API Documentation Strategy
- [x] ADR-010: Deployment Strategy (Vercel + Railway + GitHub Actions)
- [x] _(All 10 ADRs complete)_

### 8.5 CI/CD ✅

- [x] GitHub Actions workflow (`.github/workflows/ci.yml`)
- [x] Quality checks (lint, typecheck)
- [x] Test job with PostgreSQL service
- [x] Deploy jobs (Railway + Vercel)
- [x] _(CI workflow created)_

---

## Phase 9: Load Testing & Enhanced Documentation 🟡

> Optional phase - load testing infrastructure documented in ADR-005 but not implemented.

### 9.1 Load Testing Infrastructure

- [ ] Install k6 load testing tool
- [ ] Create `load-tests/` directory structure
- [ ] Add `load-test` script to root package.json
- [ ] _(Documented in ADR-005 as future recommendation)_

### 9.2-9.3 Load Test Scenarios

- [ ] _(Future: Order submission, concurrent orders, rollback tests)_
- [ ] _(ADR-005 contains k6 example script for reference)_

### 9.4 GraphQL Schema Documentation ✅

- [x] GraphQL Playground available (self-documenting)
- [x] Schema introspection enabled (intentionally in production for demo)
- [x] Types have descriptions via Pothos builder
- [x] _(ADR-009 documents API documentation strategy)_

### 9.5 API Reference Documentation ✅

- [x] Static `schema.graphql` generated (358 lines)
- [x] Business rules documented in README.md
- [x] Example queries and mutations in README.md
- [x] _(Comprehensive README serves as API reference)_

### 9.6 Performance Documentation

- [ ] _(Future: Run load tests and capture baseline metrics)_
- [ ] _(ADR-008 documents when to consider PostGIS for scale)_

---

## Phase 10: Deployment & CI/CD ✅

> Deploy to free platforms (Vercel + Railway) with GitHub Actions CI/CD pipeline.

### 10.1 GitHub Actions CI Pipeline ✅

- [x] Create `.github/workflows/ci.yml`
- [x] Quality checks job (lint, typecheck)
- [x] Test job with PostgreSQL service container
- [x] Configure pnpm caching
- [x] _(CI workflow created and working)_

### 10.2 Railway Backend Deployment ✅

- [x] Create Railway account and project
- [x] Add PostgreSQL database
- [x] Create `railway.toml` configuration
- [x] Configure environment variables (DATABASE_URL, NODE_ENV)
- [x] API deployed and live
- [x] **URL:** `https://sc-oms-api-production.up.railway.app`

### 10.3 Vercel Frontend Deployment ✅

- [x] Create Vercel account and link repo
- [x] Create `vercel.json` for monorepo
- [x] Configure `VITE_API_URL` environment variable
- [x] Frontend deployed and live
- [x] **URL:** `https://sc-order-management-system.vercel.app`

### 10.4 Deploy Jobs in CI/CD ✅

- [x] Deploy jobs defined in CI workflow
- [x] Platform auto-deploy on main branch (simpler for demo)
- [x] Health check job after deployment
- [x] _(Using platform auto-deploy instead of CLI for simplicity)_

### 10.5 Production Configuration ✅

- [x] Apollo Client uses `VITE_API_URL` env var
- [x] Production CORS enabled (all origins for demo)
- [x] Production logging (JSON format in prod)
- [x] Database connection pooling configured
- [x] _(Production config complete)_

### 10.6 Deployment Documentation ✅

- [x] README includes live demo URLs
- [x] Environment variables documented in `.env.example`
- [x] ADR-010 documents deployment strategy
- [x] _(Documentation complete)_

### 10.7 Bonus: Reset Demo Feature ✅

- [x] POST `/api/reset-demo` endpoint
- [x] Reset button in frontend header
- [x] Clears orders and restores seed data
- [x] Perfect for interview demonstrations

---

## Final Verification ✅

### Code Quality

- [x] No inappropriate `any` types
- [x] All functions typed
- [x] JSDoc comments present
- [x] No ESLint errors
- [x] Consistent formatting

### Business Logic

- [x] Discount tiers correct (1-24: 0%, 25-49: 5%, 50-99: 10%, 100-249: 15%, 250+: 20%)
- [x] 15% cap uses post-discount amount
- [x] Weight grams→kg conversion correct
- [x] Distance calculation accurate (Haversine formula)

### Data Consistency

- [x] Transactions for stock updates
- [x] Race conditions prevented (pessimistic locking)
- [x] Order numbers unique

### DX

- [x] Single command start works (`pnpm dev`)
- [x] Clear error messages
- [x] GraphiQL available
- [x] Hot reload works

---

## Progress

| Phase               | Status         | Notes                          |
| ------------------- | -------------- | ------------------------------ |
| 1. Infrastructure   | ✅ Complete    | Monorepo, Docker, configs      |
| 2. Database         | ✅ Complete    | Prisma 7, migrations, seed     |
| 3. Server Setup     | ✅ Complete    | Fastify, health check          |
| 4. Testing Setup    | ✅ Complete    | Vitest, 97+ tests              |
| 5. Domain Logic     | ✅ Complete    | Pricing, logistics, orders     |
| 6. GraphQL API      | ✅ Complete    | Pothos, queries, mutations     |
| 7. Frontend         | ✅ Complete    | React, Leaflet, shadcn/ui      |
| 7.9 Multi-Product   | ✅ Complete    | Multi-item orders              |
| 8. DevOps & Docs    | ✅ Complete    | Dockerfile, README, 10 ADRs    |
| 9. Load Testing     | 🟡 Optional    | Documented in ADR-005          |
| 10. Deployment      | ✅ Complete    | Railway + Vercel + Reset Demo  |
| **Total**           | **~98%**       | **All requirements complete!** |

Legend: ⬜ Not Started | 🟡 Optional / Future | ✅ Complete

---

## Live Demo

| Component   | URL                                                    |
| ----------- | ------------------------------------------------------ |
| 🌐 Frontend | https://sc-order-management-system.vercel.app          |
| 🔧 API      | https://sc-oms-api-production.up.railway.app           |
| 📊 GraphQL  | https://sc-oms-api-production.up.railway.app/graphql   |
| ❤️ Health   | https://sc-oms-api-production.up.railway.app/health    |

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

## Phase 4: Testing Setup

> Setup testing infrastructure before writing domain logic.

### 4.1 Vitest Setup

- [ ] Create `vitest.config.ts`
- [ ] Configure test environment
- [ ] Add test helpers
- [ ] **COMMIT:** `chore(api): setup vitest testing framework`

### 4.2 Test Helpers

- [ ] Create test utilities
- [ ] Add mock factories
- [ ] **COMMIT:** `chore(api): add test helpers`

---

## Phase 5: Core Domain Logic

> Each feature includes tests alongside implementation.

### 5.1 Haversine Distance

- [ ] Create `lib/haversine.ts`
- [ ] Implement `calculateDistanceKm()` with Decimal.js
- [ ] **TEST:** Add haversine tests (LA→NY, Paris→HK, edge cases)
- [ ] **COMMIT:** `feat(api): implement haversine distance with tests`

### 5.2 Discount Logic

- [ ] Create `domain/pricing/discount.ts`
- [ ] Implement volume discount tiers (5%, 10%, 15%, 20%)
- [ ] **TEST:** Add discount tests (all tiers, boundaries)
- [ ] **COMMIT:** `feat(api): implement volume discount with tests`

### 5.3 Shipping Cost

- [ ] Create `domain/pricing/shipping.ts`
- [ ] Implement shipping cost formula
- [ ] Implement 15% validity check
- [ ] **TEST:** Add shipping tests (formula, 15% rule)
- [ ] **COMMIT:** `feat(api): implement shipping cost with tests`

### 5.4 Warehouse Optimizer

- [ ] Create `domain/logistics/warehouse-optimizer.ts`
- [ ] Implement greedy allocation algorithm
- [ ] Handle insufficient stock
- [ ] **TEST:** Add optimizer tests (single, multi, insufficient)
- [ ] **COMMIT:** `feat(api): implement warehouse optimizer with tests`

### 5.5 Order Service

- [ ] Create `domain/orders/order.service.ts`
- [ ] Implement `verifyOrder()` - quote without DB write
- [ ] Implement `submitOrder()` - with transaction & locking
- [ ] **TEST:** Add order service tests (verify, submit, errors)
- [ ] **COMMIT:** `feat(api): implement order service with tests`

---

## Phase 6: GraphQL API

### 6.1 Pothos Setup

- [ ] Create `graphql/builder.ts`
- [ ] Configure Decimal scalar
- [ ] **COMMIT:** `chore(api): setup pothos graphql builder`

### 6.2 GraphQL Types

- [ ] Create Product, Warehouse, Order types
- [ ] Create Quote, Shipment types
- [ ] **COMMIT:** `feat(api): add graphql type definitions`

### 6.3 Queries

- [ ] `products`, `product(id)`
- [ ] `warehouses`
- [ ] `orders`, `order(id)`
- [ ] **COMMIT:** `feat(api): add graphql queries`

### 6.4 Mutations

- [ ] `verifyOrder(quantity, lat, long)`
- [ ] `submitOrder(quantity, lat, long)`
- [ ] **COMMIT:** `feat(api): add graphql mutations`

### 6.5 Server Integration

- [ ] Create `graphql/yoga.ts`
- [ ] Integrate with Fastify
- [ ] Enable GraphiQL
- [ ] **COMMIT:** `feat(api): integrate graphql-yoga with fastify`

### 6.6 Schema Generation

- [ ] Add script to generate `schema.graphql`
- [ ] **COMMIT:** `chore(api): add graphql schema generation`

---

## Phase 7: React Frontend

### 7.1 Vite Setup

- [ ] Create `apps/web` with Vite
- [ ] Install deps (apollo, leaflet)
- [ ] **COMMIT:** `chore(web): initialize vite react project`

### 7.2 shadcn/ui

- [ ] Setup Tailwind
- [ ] Init shadcn/ui
- [ ] Add components (Button, Input, Card, etc.)
- [ ] **COMMIT:** `chore(web): setup shadcn/ui`

### 7.3 GraphQL Codegen

- [ ] Install codegen
- [ ] Create `codegen.yml`
- [ ] Generate hooks
- [ ] **COMMIT:** `chore(web): setup graphql codegen`

### 7.4 Apollo Client

- [ ] Create `lib/apollo.ts`
- [ ] Setup ApolloProvider
- [ ] **COMMIT:** `chore(web): setup apollo client`

### 7.5 Layout Components

- [ ] Header, Container
- [ ] **COMMIT:** `feat(web): add layout components`

### 7.6 Map Component

- [ ] OrderMap with Leaflet
- [ ] WarehouseMarker, CustomerMarker
- [ ] Click-to-select functionality
- [ ] **COMMIT:** `feat(web): add leaflet map`

### 7.7 Order Form

- [ ] OrderForm, QuantityInput, CoordinateInput
- [ ] Form validation
- [ ] **COMMIT:** `feat(web): add order form`

### 7.8 Order Summary

- [ ] Display pricing breakdown
- [ ] Show validity status
- [ ] **COMMIT:** `feat(web): add order summary`

### 7.9 Warehouse List

- [ ] Display warehouses with stock
- [ ] Show distances
- [ ] **COMMIT:** `feat(web): add warehouse list`

### 7.10 Order Page

- [ ] Combine map, form, summary
- [ ] Verify and submit flows
- [ ] **COMMIT:** `feat(web): implement main order page`

### 7.11 Order History

- [ ] List all orders
- [ ] Order details
- [ ] **COMMIT:** `feat(web): add order history page`

### 7.12 Navigation & Polish

- [ ] Routing
- [ ] Toasts
- [ ] Responsive design
- [ ] **COMMIT:** `feat(web): add navigation and polish`

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
| 4. Testing Setup  | ⬜ Not Started | 0/2      |
| 5. Domain Logic   | ⬜ Not Started | 0/5      |
| 6. GraphQL API    | ⬜ Not Started | 0/6      |
| 7. Frontend       | ⬜ Not Started | 0/12     |
| 8. DevOps         | ⬜ Not Started | 0/5      |
| **Total**         | **14%**        | **5/35** |

Legend: ⬜ Not Started | 🟡 In Progress | ✅ Complete

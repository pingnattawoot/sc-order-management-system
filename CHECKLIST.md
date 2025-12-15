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
- [x] **COMMIT:** `feat(api): add prisma 7 database layer with seed data`

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

## Phase 3: Core Domain Logic

### 3.1 Project Structure

- [ ] Create folder structure (lib/, domain/, graphql/)
- [ ] **COMMIT:** `chore(api): setup project folder structure`

### 3.2 Haversine Distance

- [ ] Create `lib/haversine.ts`
- [ ] Implement `calculateDistanceKm()` with Decimal.js
- [ ] **COMMIT:** `feat(api): implement haversine distance calculation`

### 3.3 Discount Logic

- [ ] Create `domain/pricing/discount.ts`
- [ ] Implement volume discount tiers
- [ ] **COMMIT:** `feat(api): implement volume discount calculation`

### 3.4 Shipping Cost

- [ ] Create `domain/pricing/shipping.ts`
- [ ] Implement shipping cost formula
- [ ] Implement 15% validity check
- [ ] **COMMIT:** `feat(api): implement shipping cost calculation`

### 3.5 Warehouse Optimizer

- [ ] Create `domain/logistics/warehouse-optimizer.ts`
- [ ] Implement greedy allocation algorithm
- [ ] Handle insufficient stock
- [ ] **COMMIT:** `feat(api): implement greedy warehouse optimizer`

### 3.6 Order Service

- [ ] Create `domain/orders/order.service.ts`
- [ ] Implement `verifyOrder()` - quote without DB write
- [ ] Implement `submitOrder()` - with transaction & locking
- [ ] **COMMIT:** `feat(api): implement order service`

### 3.7 Prisma Client

- [ ] Create `lib/prisma.ts` singleton
- [ ] **COMMIT:** `chore(api): add prisma client singleton`

---

## Phase 4: GraphQL API

### 4.1 Pothos Setup

- [ ] Install `@pothos/plugin-prisma`
- [ ] Create `graphql/builder.ts`
- [ ] **COMMIT:** `chore(api): setup pothos graphql builder`

### 4.2 GraphQL Types

- [ ] Create Product type
- [ ] Create Warehouse type
- [ ] Create Order type
- [ ] Create Quote type
- [ ] Create Shipment type
- [ ] **COMMIT:** `feat(api): add graphql type definitions`

### 4.3 Queries

- [ ] `products`, `product(id)`
- [ ] `warehouses`
- [ ] `orders`, `order(id)`
- [ ] **COMMIT:** `feat(api): add graphql queries`

### 4.4 Mutations

- [ ] `verifyOrder(quantity, lat, long)`
- [ ] `submitOrder(quantity, lat, long)`
- [ ] **COMMIT:** `feat(api): add graphql mutations`

### 4.5 Server Integration

- [ ] Create `graphql/yoga.ts`
- [ ] Integrate with Fastify
- [ ] Enable GraphiQL
- [ ] **COMMIT:** `feat(api): integrate graphql-yoga with fastify`

### 4.6 Schema Generation

- [ ] Add script to generate `schema.graphql`
- [ ] **COMMIT:** `chore(api): add graphql schema generation`

---

## Phase 5: Server & Entry Point

### 5.1 Fastify Server

- [ ] Create `server.ts`
- [ ] Configure logger, CORS, health check
- [ ] Add graceful shutdown
- [ ] **COMMIT:** `feat(api): setup fastify server`

### 5.2 Entry Point

- [ ] Create `index.ts`
- [ ] **COMMIT:** `feat(api): add server entry point`

### 5.3 Dev Scripts

- [ ] Add `dev`, `build`, `start` scripts
- [ ] Add `db:*` scripts
- [ ] **COMMIT:** `chore(api): add development scripts`

---

## Phase 6: Testing

### 6.1 Vitest Setup

- [ ] Create `vitest.config.ts`
- [ ] Add test helpers
- [ ] **COMMIT:** `chore(api): setup vitest`

### 6.2 Haversine Tests

- [ ] Test known distances (LA→NY, Paris→HK)
- [ ] Test edge cases
- [ ] **COMMIT:** `test(api): add haversine tests`

### 6.3 Pricing Tests

- [ ] Test all discount tiers
- [ ] Test boundary conditions
- [ ] **COMMIT:** `test(api): add discount tests`

### 6.4 Shipping Tests

- [ ] Test cost formula
- [ ] Test 15% rule
- [ ] **COMMIT:** `test(api): add shipping tests`

### 6.5 Integration Tests

- [ ] Setup test database
- [ ] Test order verification
- [ ] Test order submission
- [ ] Test insufficient stock
- [ ] Test invalid shipping
- [ ] **COMMIT:** `test(api): add order service integration tests`

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

- [ ] ADR-001: GraphQL
- [ ] ADR-002: Prisma
- [ ] ADR-003: Greedy Algorithm
- [ ] ADR-004: Decimal.js
- [ ] ADR-005: Pessimistic Locking
- [ ] ADR-006: pnpm Package Manager
- [ ] **COMMIT:** `docs: add architecture decision records`

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
| 3. Domain Logic   | ⬜ Not Started | 0/7      |
| 4. GraphQL API    | ⬜ Not Started | 0/6      |
| 5. Server         | ⬜ Not Started | 0/3      |
| 6. Testing        | ⬜ Not Started | 0/5      |
| 7. Frontend       | ⬜ Not Started | 0/12     |
| 8. DevOps         | ⬜ Not Started | 0/5      |
| **Total**         | **10%**        | **4/42** |

Legend: ⬜ Not Started | 🟡 In Progress | ✅ Complete

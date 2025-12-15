# Implementation Checklist

A quick-reference checklist for tracking implementation progress. See [docs/IMPLEMENTATION_PLAN.md](./docs/IMPLEMENTATION_PLAN.md) for detailed descriptions.

---

## Phase 1: Project Infrastructure Setup

### 1.1 Initialize Monorepo Structure

- [ ] Create root `package.json` with pnpm workspaces
- [ ] Create `pnpm-workspace.yaml`
- [ ] Create folder structure (apps/, packages/, docs/, docker/)
- [ ] Initialize git with `.gitignore`
- [ ] **COMMIT:** `chore: initialize monorepo structure`

### 1.2 Setup Backend Project

- [ ] Create `apps/api/package.json`
- [ ] Install core deps (fastify, prisma, graphql-yoga, pothos, decimal.js)
- [ ] Install dev deps (typescript, vitest, eslint, prettier)
- [ ] Create `tsconfig.json` (strict mode)
- [ ] Create linting configs
- [ ] **COMMIT:** `chore(api): setup backend project with dependencies`

### 1.3 Setup Docker Environment

- [ ] Create `docker-compose.yml` (PostgreSQL)
- [ ] Create `.env.example`
- [ ] **COMMIT:** `chore: add docker-compose for PostgreSQL`

---

## Phase 2: Database Layer

### 2.1 Initialize Prisma

- [ ] Run `pnpm exec prisma init`
- [ ] Configure `.env`
- [ ] **COMMIT:** `chore(api): initialize prisma`

### 2.2 Database Schema

- [ ] Create `Product` model
- [ ] Create `Warehouse` model
- [ ] Create `Order` model
- [ ] Create `OrderShipment` model
- [ ] Add `OrderStatus` enum
- [ ] Add indexes
- [ ] **COMMIT:** `feat(api): add prisma database schema`

### 2.3 Migrations

- [ ] Run initial migration
- [ ] **COMMIT:** `feat(api): add initial database migration`

### 2.4 Seed Data

- [ ] Create `prisma/seed.ts`
- [ ] Add product seed (SCOS P1 Pro)
- [ ] Add warehouse seeds (6 locations)
- [ ] Configure prisma.seed in package.json
- [ ] Run seed
- [ ] **COMMIT:** `feat(api): add seed data for products and warehouses`

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
| 1. Infrastructure | ⬜ Not Started | 0/3      |
| 2. Database       | ⬜ Not Started | 0/4      |
| 3. Domain Logic   | ⬜ Not Started | 0/7      |
| 4. GraphQL API    | ⬜ Not Started | 0/6      |
| 5. Server         | ⬜ Not Started | 0/3      |
| 6. Testing        | ⬜ Not Started | 0/5      |
| 7. Frontend       | ⬜ Not Started | 0/12     |
| 8. DevOps         | ⬜ Not Started | 0/5      |
| **Total**         | **0%**         | **0/45** |

Legend: ⬜ Not Started | 🟡 In Progress | ✅ Complete

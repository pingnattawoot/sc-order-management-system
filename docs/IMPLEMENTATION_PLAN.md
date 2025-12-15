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

## Phase 5: Core Domain Logic

> **Note:** Each section includes writing tests alongside implementation.

### 5.1 Implement Haversine Distance Calculation

- [ ] Create `apps/api/src/lib/haversine.ts`
- [ ] Implement `calculateDistanceKm(lat1, lon1, lat2, lon2)` function
- [ ] Use Decimal.js for precise calculations
- [ ] Add JSDoc documentation
- [ ] **TEST:** Create `apps/api/src/lib/__tests__/haversine.test.ts`
  - Test LA to New York distance
  - Test Paris to Hong Kong distance
  - Test same point (0 distance)
  - Test antipodal points
- [ ] **COMMIT:** "feat(api): implement haversine distance calculation with tests"

### 5.2 Implement Pricing Logic - Discounts

- [ ] Create `apps/api/src/domain/pricing/discount.ts`
- [ ] Implement volume discount tiers:
  - 1-24 units: 0% discount
  - 25-49 units: 5% discount
  - 50-99 units: 10% discount
  - 100-249 units: 15% discount
  - 250+ units: 20% discount
- [ ] Create `calculateDiscount(quantity, unitPriceCents)` function
- [ ] Use Decimal.js for calculations
- [ ] **TEST:** Create `apps/api/src/domain/pricing/__tests__/discount.test.ts`
  - Test all discount tiers
  - Test boundary conditions (24→25, 49→50, etc.)
- [ ] **COMMIT:** "feat(api): implement volume discount calculation with tests"

### 5.3 Implement Shipping Cost Calculation

- [ ] Create `apps/api/src/domain/pricing/shipping.ts`
- [ ] Implement `calculateShippingCost(distanceKm, weightGrams, quantity)`:
  - Rate: $0.01 per kg per km
  - Formula: distanceKm × (weightGrams/1000) × quantity × 0.01
- [ ] Create `isShippingCostValid(shippingCents, orderAmountAfterDiscount)`:
  - Returns false if shipping > 15% of order amount
- [ ] Use Decimal.js for all monetary calculations
- [ ] **TEST:** Create `apps/api/src/domain/pricing/__tests__/shipping.test.ts`
  - Test shipping cost formula
  - Test 15% validity rule
  - Test edge cases
- [ ] **COMMIT:** "feat(api): implement shipping cost calculation with tests"

### 5.4 Implement Warehouse Optimizer (Core Algorithm)

- [ ] Create `apps/api/src/domain/logistics/warehouse-optimizer.ts`
- [ ] Implement `WarehouseOptimizer` class with methods:
  - `findOptimalShipments(customerLat, customerLong, quantity, warehouses)`:
    1. Calculate distance from each warehouse to customer
    2. Sort warehouses by distance (ascending)
    3. Greedy allocation: fill from nearest warehouse first
    4. Return allocation plan with per-warehouse shipping costs
- [ ] Handle edge case: not enough total stock
- [ ] Return detailed breakdown for each warehouse
- [ ] **TEST:** Create `apps/api/src/domain/logistics/__tests__/warehouse-optimizer.test.ts`
  - Test single warehouse fulfillment
  - Test multi-warehouse split
  - Test insufficient stock error
  - Test nearest-first selection
- [ ] **COMMIT:** "feat(api): implement greedy warehouse optimizer with tests"

### 5.5 Implement Order Service

- [ ] Create `apps/api/src/domain/orders/order.service.ts`
- [ ] Implement `OrderService` class with methods:
  - `verifyOrder(quantity, lat, long)`:
    - Calculate optimal shipments
    - Calculate total costs and discount
    - Validate shipping cost (≤15% rule)
    - Return quote without saving to DB
  - `submitOrder(quantity, lat, long)`:
    - Re-verify order
    - Use Prisma transaction with SELECT FOR UPDATE
    - Update warehouse stock atomically
    - Create order and shipment records
    - Generate unique order number
- [ ] Add proper error handling
- [ ] **TEST:** Create `apps/api/src/domain/orders/__tests__/order.service.test.ts`
  - Test order verification flow
  - Test order submission flow
  - Test insufficient stock handling
  - Test invalid shipping cost rejection
  - Test concurrent order handling
- [ ] **COMMIT:** "feat(api): implement order service with tests"

---

## Phase 6: GraphQL API Layer

### 6.1 Setup Pothos Schema Builder

- [ ] Create `apps/api/src/graphql/builder.ts`
- [ ] Configure Pothos with custom scalars for Decimal
- [ ] **COMMIT:** "chore(api): setup pothos graphql schema builder"

### 6.2 Define GraphQL Types

- [ ] Create `apps/api/src/graphql/types/`:
  - `product.ts` - Product type
  - `warehouse.ts` - Warehouse type
  - `order.ts` - Order type
  - `quote.ts` - Quote type (for order verification)
  - `shipment.ts` - Shipment allocation type
- [ ] Define custom scalars for Decimal handling
- [ ] **COMMIT:** "feat(api): add graphql type definitions"

### 6.3 Implement Queries

- [ ] Create `apps/api/src/graphql/resolvers/queries.ts`
- [ ] Implement queries:
  - `products` - List all products
  - `product(id)` - Get single product
  - `warehouses` - List all warehouses with current stock
  - `orders` - List all orders
  - `order(id)` - Get single order with shipment details
- [ ] **COMMIT:** "feat(api): add graphql queries"

### 6.4 Implement Mutations

- [ ] Create `apps/api/src/graphql/resolvers/mutations.ts`
- [ ] Implement mutations:
  - `verifyOrder(quantity, latitude, longitude)` → Quote
    - Returns: subtotal, discount, shipping, total, isValid, shipments[]
  - `submitOrder(quantity, latitude, longitude)` → Order
    - Returns: created order with order number
- [ ] Add input validation
- [ ] **COMMIT:** "feat(api): add graphql mutations"

### 6.5 Integrate GraphQL with Fastify

- [ ] Create `apps/api/src/graphql/yoga.ts`
- [ ] Integrate GraphQL Yoga with Fastify
- [ ] Setup GraphQL context with Prisma and services
- [ ] Enable GraphiQL playground in development
- [ ] **COMMIT:** "feat(api): integrate graphql-yoga with fastify"

### 6.6 Generate GraphQL Schema File

- [ ] Add script to generate `schema.graphql` file
- [ ] Configure codegen for type generation (client use)
- [ ] **COMMIT:** "chore(api): add graphql schema generation"

---

## Phase 7: React Frontend

### 7.1 Initialize Vite React Project

- [ ] Create `apps/web` with `pnpm create vite`
- [ ] Configure TypeScript
- [ ] Install dependencies:
  - `@apollo/client` - GraphQL client
  - `graphql` - GraphQL core
  - `react-leaflet`, `leaflet` - Map
- [ ] **COMMIT:** "chore(web): initialize vite react project"

### 7.2 Setup shadcn/ui

- [ ] Install and configure Tailwind CSS
- [ ] Initialize shadcn/ui
- [ ] Add essential components:
  - Button, Input, Card, Label
  - Toast, Alert
  - Table
- [ ] **COMMIT:** "chore(web): setup shadcn/ui and tailwind"

### 7.3 GraphQL Codegen for Frontend

- [ ] Install `@graphql-codegen/cli` and plugins
- [ ] Create `codegen.yml` configuration
- [ ] Generate typed hooks from schema
- [ ] Add codegen script to package.json
- [ ] **COMMIT:** "chore(web): setup graphql codegen"

### 7.4 Setup Apollo Client

- [ ] Create `apps/web/src/lib/apollo.ts`
- [ ] Configure Apollo Client with API endpoint
- [ ] Setup ApolloProvider in main.tsx
- [ ] **COMMIT:** "chore(web): setup apollo client"

### 7.5 Create Layout Components

- [ ] Create `apps/web/src/components/layout/`:
  - `Header.tsx` - App header with logo
  - `Container.tsx` - Main content container
- [ ] Create base page layout
- [ ] **COMMIT:** "feat(web): add layout components"

### 7.6 Create Map Component

- [ ] Create `apps/web/src/components/map/`:
  - `OrderMap.tsx` - Leaflet map component
  - `WarehouseMarker.tsx` - Warehouse markers
  - `CustomerMarker.tsx` - Customer location marker
- [ ] Add click-to-select location functionality
- [ ] Display warehouse locations with stock info
- [ ] **COMMIT:** "feat(web): add interactive leaflet map"

### 7.7 Create Order Form Component

- [ ] Create `apps/web/src/components/order/`:
  - `OrderForm.tsx` - Main order form
  - `QuantityInput.tsx` - Quantity selector
  - `CoordinateInput.tsx` - Lat/Long inputs
  - `OrderQuote.tsx` - Display quote results
- [ ] Add form validation
- [ ] **COMMIT:** "feat(web): add order form components"

### 7.8 Create Order Summary Component

- [ ] Create `apps/web/src/components/order/OrderSummary.tsx`
- [ ] Display:
  - Product details
  - Quantity and subtotal
  - Discount breakdown
  - Shipping cost breakdown (per warehouse)
  - Total price
  - Validity status
- [ ] **COMMIT:** "feat(web): add order summary component"

### 7.9 Create Warehouse List Component

- [ ] Create `apps/web/src/components/warehouse/WarehouseList.tsx`
- [ ] Display all warehouses with current stock
- [ ] Show distance from selected location
- [ ] Highlight warehouses being used for shipment
- [ ] **COMMIT:** "feat(web): add warehouse list component"

### 7.10 Implement Main Order Page

- [ ] Create `apps/web/src/pages/OrderPage.tsx`
- [ ] Combine map, form, and summary components
- [ ] Implement verify order flow
- [ ] Implement submit order flow
- [ ] Add loading and error states
- [ ] **COMMIT:** "feat(web): implement main order page"

### 7.11 Create Order History Page

- [ ] Create `apps/web/src/pages/OrdersPage.tsx`
- [ ] List all submitted orders
- [ ] Show order details with shipment breakdown
- [ ] **COMMIT:** "feat(web): add order history page"

### 7.12 Add Navigation & Polish

- [ ] Implement routing (react-router-dom)
- [ ] Add navigation between pages
- [ ] Add toast notifications for success/error
- [ ] Ensure responsive design
- [ ] **COMMIT:** "feat(web): add navigation and polish ui"

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

# ScreenCloud Order Management System - Implementation Plan

## Overview

This document outlines the step-by-step implementation plan for building a production-ready Order Management System for ScreenCloud's SCOS devices.

**Estimated Time:** 4-6 hours  
**Tech Stack:** TypeScript, Node.js, Fastify, Prisma, GraphQL (Pothos), PostgreSQL, React (Vite), shadcn/ui, Leaflet

---

## Phase 1: Project Infrastructure Setup

### 1.1 Initialize Monorepo Structure

- [ ] Create root `package.json` with workspaces configuration
- [ ] Create folder structure:
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
- [ ] Initialize git repository with `.gitignore`
- [ ] **COMMIT:** "chore: initialize monorepo structure"

### 1.2 Setup Backend Project (apps/api)

- [ ] Initialize `apps/api/package.json`
- [ ] Install core dependencies:
  - `fastify` - Web framework
  - `@prisma/client` - Database ORM
  - `prisma` - Database toolkit (dev)
  - `graphql` - GraphQL core
  - `graphql-yoga` - GraphQL server
  - `@pothos/core` - GraphQL schema builder
  - `decimal.js` - Precise decimal calculations
- [ ] Install dev dependencies:
  - `typescript`, `tsx`, `@types/node`
  - `vitest` - Testing framework
  - `eslint`, `prettier`
- [ ] Create `tsconfig.json` with strict mode
- [ ] Create `.eslintrc.js` and `.prettierrc`
- [ ] **COMMIT:** "chore(api): setup backend project with dependencies"

### 1.3 Setup Docker Environment

- [ ] Create `docker-compose.yml` with PostgreSQL service
- [ ] Create `docker-compose.dev.yml` for development overrides
- [ ] Add health check for PostgreSQL
- [ ] Create `.env.example` with required environment variables
- [ ] **COMMIT:** "chore: add docker-compose for PostgreSQL"

---

## Phase 2: Database Layer (Prisma)

### 2.1 Initialize Prisma

- [ ] Run `pnpm exec prisma init` in `apps/api`
- [ ] Configure `DATABASE_URL` in `.env`
- [ ] **COMMIT:** "chore(api): initialize prisma"

### 2.2 Design Database Schema

- [ ] Create `Product` model:
  ```prisma
  model Product {
    id          String   @id @default(uuid())
    sku         String   @unique
    name        String
    priceInCents Int     // Store money as cents to avoid float issues
    weightGrams  Int
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt
  }
  ```
- [ ] Create `Warehouse` model:
  ```prisma
  model Warehouse {
    id        String   @id @default(uuid())
    name      String   @unique
    latitude  Decimal  @db.Decimal(10, 6)
    longitude Decimal  @db.Decimal(10, 6)
    stock     Int      @default(0)
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
  }
  ```
- [ ] Create `Order` model:
  ```prisma
  model Order {
    id              String        @id @default(uuid())
    orderNumber     String        @unique
    quantity        Int
    customerLat     Decimal       @db.Decimal(10, 6)
    customerLong    Decimal       @db.Decimal(10, 6)
    subtotalCents   Int
    discountCents   Int
    shippingCents   Int
    totalCents      Int
    status          OrderStatus   @default(COMPLETED)
    createdAt       DateTime      @default(now())
    updatedAt       DateTime      @updatedAt
    shipments       OrderShipment[]
  }
  ```
- [ ] Create `OrderShipment` model (tracks which warehouse ships what):
  ```prisma
  model OrderShipment {
    id            String    @id @default(uuid())
    orderId       String
    order         Order     @relation(fields: [orderId], references: [id])
    warehouseId   String
    warehouse     Warehouse @relation(fields: [warehouseId], references: [id])
    quantity      Int
    distanceKm    Decimal   @db.Decimal(10, 2)
    shippingCents Int
    createdAt     DateTime  @default(now())
  }
  ```
- [ ] Add `OrderStatus` enum: `PENDING`, `COMPLETED`, `CANCELLED`
- [ ] Add necessary indexes for performance
- [ ] **COMMIT:** "feat(api): add prisma database schema"

### 2.3 Create Database Migrations

- [ ] Run `pnpm exec prisma migrate dev --name init`
- [ ] Verify migration files are created
- [ ] **COMMIT:** "feat(api): add initial database migration"

### 2.4 Create Seed Data

- [ ] Create `apps/api/prisma/seed.ts`
- [ ] Add SCOS Station P1 Pro product data:
  - Price: $150 (15000 cents)
  - Weight: 365g
- [ ] Add 6 warehouse seed data with coordinates and stock:
  - Los Angeles: 33.9425, -118.408056, stock: 355
  - New York: 40.639722, -73.778889, stock: 578
  - São Paulo: -23.435556, -46.473056, stock: 265
  - Paris: 49.009722, 2.547778, stock: 694
  - Warsaw: 52.165833, 20.967222, stock: 245
  - Hong Kong: 22.308889, 113.914444, stock: 419
- [ ] Configure `prisma.seed` in `package.json`
- [ ] Run `pnpm exec prisma db seed`
- [ ] **COMMIT:** "feat(api): add seed data for products and warehouses"

---

## Phase 3: Core Domain Logic

### 3.1 Setup Project Structure

- [ ] Create folder structure in `apps/api/src`:
  ```
  src/
  ├── index.ts           # Entry point
  ├── server.ts          # Fastify server setup
  ├── config/            # Configuration
  │   └── index.ts
  ├── lib/               # Shared utilities
  │   ├── prisma.ts      # Prisma client singleton
  │   ├── decimal.ts     # Decimal.js utilities
  │   └── haversine.ts   # Distance calculation
  ├── domain/            # Business logic
  │   ├── pricing/
  │   │   ├── discount.ts
  │   │   └── shipping.ts
  │   ├── logistics/
  │   │   └── warehouse-optimizer.ts
  │   └── orders/
  │       ├── order.service.ts
  │       └── order.types.ts
  └── graphql/           # GraphQL layer
      ├── schema.ts
      ├── context.ts
      └── resolvers/
  ```
- [ ] **COMMIT:** "chore(api): setup project folder structure"

### 3.2 Implement Haversine Distance Calculation

- [ ] Create `apps/api/src/lib/haversine.ts`
- [ ] Implement `calculateDistanceKm(lat1, lon1, lat2, lon2)` function
- [ ] Use Decimal.js for precise calculations
- [ ] Add JSDoc documentation
- [ ] **COMMIT:** "feat(api): implement haversine distance calculation"

### 3.3 Implement Pricing Logic

- [ ] Create `apps/api/src/domain/pricing/discount.ts`
- [ ] Implement volume discount tiers:
  - 25+ units: 5% discount
  - 50+ units: 10% discount
  - 100+ units: 15% discount
  - 250+ units: 20% discount
- [ ] Create `calculateDiscount(quantity, unitPriceCents)` function
- [ ] Use Decimal.js for calculations
- [ ] **COMMIT:** "feat(api): implement volume discount calculation"

### 3.4 Implement Shipping Cost Calculation

- [ ] Create `apps/api/src/domain/pricing/shipping.ts`
- [ ] Implement `calculateShippingCost(distanceKm, weightGrams, quantity)`:
  - Rate: $0.01 per kg per km
  - Formula: distanceKm × (weightGrams/1000) × quantity × 0.01
- [ ] Create `isShippingCostValid(shippingCents, orderAmountAfterDiscount)`:
  - Returns false if shipping > 15% of order amount
- [ ] Use Decimal.js for all monetary calculations
- [ ] **COMMIT:** "feat(api): implement shipping cost calculation"

### 3.5 Implement Warehouse Optimizer (Core Algorithm)

- [ ] Create `apps/api/src/domain/logistics/warehouse-optimizer.ts`
- [ ] Implement `WarehouseOptimizer` class with methods:
  - `findOptimalShipments(customerLat, customerLong, quantity)`:
    1. Fetch all warehouses with stock > 0
    2. Calculate distance from each warehouse to customer
    3. Sort warehouses by distance (ascending)
    4. Greedy allocation: fill from nearest warehouse first
    5. Return allocation plan with per-warehouse shipping costs
- [ ] Handle edge case: not enough total stock
- [ ] Return detailed breakdown for each warehouse
- [ ] **COMMIT:** "feat(api): implement greedy warehouse optimizer"

### 3.6 Implement Order Service

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
- [ ] **COMMIT:** "feat(api): implement order service with verification and submission"

### 3.7 Setup Prisma Client Singleton

- [ ] Create `apps/api/src/lib/prisma.ts`
- [ ] Implement singleton pattern for Prisma client
- [ ] Add connection pooling configuration
- [ ] **COMMIT:** "chore(api): add prisma client singleton"

---

## Phase 4: GraphQL API Layer

### 4.1 Setup Pothos Schema Builder

- [ ] Install `@pothos/plugin-prisma` and generate types
- [ ] Create `apps/api/src/graphql/builder.ts`
- [ ] Configure Pothos with Prisma plugin
- [ ] **COMMIT:** "chore(api): setup pothos graphql schema builder"

### 4.2 Define GraphQL Types

- [ ] Create `apps/api/src/graphql/types/`:
  - `product.ts` - Product type
  - `warehouse.ts` - Warehouse type
  - `order.ts` - Order type
  - `quote.ts` - Quote type (for order verification)
  - `shipment.ts` - Shipment allocation type
- [ ] Define custom scalars for Decimal handling
- [ ] **COMMIT:** "feat(api): add graphql type definitions"

### 4.3 Implement Queries

- [ ] Create `apps/api/src/graphql/resolvers/queries.ts`
- [ ] Implement queries:
  - `products` - List all products
  - `product(id)` - Get single product
  - `warehouses` - List all warehouses with current stock
  - `orders` - List all orders
  - `order(id)` - Get single order with shipment details
- [ ] **COMMIT:** "feat(api): add graphql queries"

### 4.4 Implement Mutations

- [ ] Create `apps/api/src/graphql/resolvers/mutations.ts`
- [ ] Implement mutations:
  - `verifyOrder(quantity, latitude, longitude)` → Quote
    - Returns: subtotal, discount, shipping, total, isValid, shipments[]
  - `submitOrder(quantity, latitude, longitude)` → Order
    - Returns: created order with order number
- [ ] Add input validation
- [ ] **COMMIT:** "feat(api): add graphql mutations for order verification and submission"

### 4.5 Setup GraphQL Yoga Server

- [ ] Create `apps/api/src/graphql/yoga.ts`
- [ ] Integrate with Fastify
- [ ] Setup GraphQL context with Prisma and services
- [ ] Enable GraphiQL playground in development
- [ ] **COMMIT:** "feat(api): integrate graphql-yoga with fastify"

### 4.6 Generate GraphQL Schema File

- [ ] Add script to generate `schema.graphql` file
- [ ] Configure codegen for type generation (client use)
- [ ] **COMMIT:** "chore(api): add graphql schema generation"

---

## Phase 5: Server & Entry Point

### 5.1 Create Fastify Server

- [ ] Create `apps/api/src/server.ts`
- [ ] Configure Fastify with:
  - Logger (pino)
  - CORS
  - Health check endpoint
  - GraphQL route
- [ ] Add graceful shutdown handling
- [ ] **COMMIT:** "feat(api): setup fastify server with graphql"

### 5.2 Create Entry Point

- [ ] Create `apps/api/src/index.ts`
- [ ] Load environment variables
- [ ] Start server with port configuration
- [ ] Add startup logging
- [ ] **COMMIT:** "feat(api): add server entry point"

### 5.3 Add Development Scripts

- [ ] Add scripts to `package.json`:
  - `dev` - Run with tsx watch mode
  - `build` - Build TypeScript
  - `start` - Run production build
  - `db:migrate` - Run migrations
  - `db:seed` - Seed database
  - `db:studio` - Open Prisma Studio
- [ ] **COMMIT:** "chore(api): add development scripts"

---

## Phase 6: Testing

### 6.1 Setup Vitest

- [ ] Create `apps/api/vitest.config.ts`
- [ ] Configure test environment
- [ ] Add test utilities and helpers
- [ ] **COMMIT:** "chore(api): setup vitest testing framework"

### 6.2 Unit Tests for Haversine

- [ ] Create `apps/api/src/lib/__tests__/haversine.test.ts`
- [ ] Test known distance calculations:
  - LA to New York
  - Paris to Hong Kong
  - Edge cases (same point, antipodal points)
- [ ] **COMMIT:** "test(api): add haversine distance calculation tests"

### 6.3 Unit Tests for Pricing

- [ ] Create `apps/api/src/domain/pricing/__tests__/discount.test.ts`
- [ ] Test all discount tiers:
  - 1-24 units: 0% discount
  - 25-49 units: 5% discount
  - 50-99 units: 10% discount
  - 100-249 units: 15% discount
  - 250+ units: 20% discount
- [ ] Test boundary conditions
- [ ] **COMMIT:** "test(api): add discount calculation tests"

### 6.4 Unit Tests for Shipping

- [ ] Create `apps/api/src/domain/pricing/__tests__/shipping.test.ts`
- [ ] Test shipping cost formula
- [ ] Test 15% validity rule
- [ ] **COMMIT:** "test(api): add shipping cost calculation tests"

### 6.5 Integration Tests for Order Service

- [ ] Create `apps/api/src/domain/orders/__tests__/order.service.test.ts`
- [ ] Setup test database with seeded data
- [ ] Test order verification flow
- [ ] Test order submission flow
- [ ] Test insufficient stock handling
- [ ] Test invalid shipping cost rejection
- [ ] **COMMIT:** "test(api): add order service integration tests"

---

## Phase 7: React Frontend

### 7.1 Initialize Vite React Project

- [ ] Create `apps/web` with `pnpm create vite`
- [ ] Configure TypeScript
- [ ] Install dependencies:
  - `@apollo/client` - GraphQL client
  - `graphql` - GraphQL core
  - `react-leaflet`, `leaflet` - Map
  - `@tanstack/react-query` (optional)
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

- [ ] Create root `package.json` scripts:
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

### 8.4 Create Architecture Decision Records

- [ ] ADR-001: GraphQL over REST
- [ ] ADR-002: Prisma ORM Selection
- [ ] ADR-003: Greedy Algorithm for Warehouse Selection
- [ ] ADR-004: Decimal.js for Money Calculations
- [ ] ADR-005: Pessimistic Locking for Stock Updates
- [ ] ADR-006: pnpm Package Manager
- [ ] **COMMIT:** "docs: add architecture decision records"

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

| Phase                   | Estimated Time |
| ----------------------- | -------------- |
| Phase 1: Infrastructure | 30 min         |
| Phase 2: Database       | 30 min         |
| Phase 3: Domain Logic   | 60 min         |
| Phase 4: GraphQL API    | 45 min         |
| Phase 5: Server Setup   | 15 min         |
| Phase 6: Testing        | 45 min         |
| Phase 7: Frontend       | 90 min         |
| Phase 8: DevOps & Docs  | 30 min         |
| **Total**               | **~5.5 hours** |

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

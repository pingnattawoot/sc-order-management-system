# ScreenCloud Order Management System

A backend system for managing SCOS device orders, built as a technical assessment for the **Staff Engineer** position at ScreenCloud. The solution demonstrates architecture design, API development, and production-ready practices.

## 🌐 Live Demo

| Component        | URL                                                                                    |
| ---------------- | -------------------------------------------------------------------------------------- |
| **Frontend**     | [sc-order-management-system.vercel.app](https://sc-order-management-system.vercel.app) |
| **API**          | [api-production-1800.up.railway.app](https://api-production-1800.up.railway.app/)      |
| **GraphQL**      | [/graphql](https://api-production-1800.up.railway.app/graphql)                         |
| **Health Check** | [/health](https://api-production-1800.up.railway.app/health)                           |

> 💡 **Tip:** Click the "🔄 Reset Demo" button in the header to restore the database to its initial state.

---

## 📋 Challenge Requirements

### Product Specification

| Property   | Value               |
| ---------- | ------------------- |
| **Name**   | SCOS Station P1 Pro |
| **Price**  | $150                |
| **Weight** | 365g                |

### Volume Discounts

| Quantity | Discount |
| -------- | -------- |
| 1-24     | 0%       |
| 25-49    | 5%       |
| 50-99    | 10%      |
| 100-249  | 15%      |
| 250+     | 20%      |

### Warehouse Network

| Warehouse   | Coordinates            | Stock |
| ----------- | ---------------------- | ----- |
| Los Angeles | 33.9425, -118.408056   | 355   |
| New York    | 40.639722, -73.778889  | 578   |
| São Paulo   | -23.435556, -46.473056 | 265   |
| Paris       | 49.009722, 2.547778    | 694   |
| Warsaw      | 52.165833, 20.967222   | 245   |
| Hong Kong   | 22.308889, 113.914444  | 419   |

### Business Rules

1. **Shipping Cost:** `Distance(km) × Weight(kg) × Quantity × $0.01`
2. **15% Rule:** Shipping cannot exceed 15% of order total (after discount)
3. **Multi-Warehouse Fulfillment:** Orders can ship from multiple warehouses to minimize cost
4. **Greedy Algorithm:** Nearest warehouse first to minimize shipping costs

---

## ✅ Requirements Checklist

### Functional Requirements

- ✅ **Verify Order** - Sales rep can input quantity and coordinates to see price breakdown and validity
- ✅ **Submit Order** - Creates order with unique order number, updates inventory immediately
- ✅ **Price Calculation** - Total price, discount, and shipping cost calculated correctly
- ✅ **Validity Check** - Orders rejected if shipping exceeds 15% of discounted total

### Technical Requirements

- ✅ **TypeScript** - Full TypeScript implementation (frontend and backend)
- ✅ **Database** - PostgreSQL with Prisma ORM
- ✅ **Well-Documented API** - GraphQL with introspection + schema descriptions
- ✅ **Testing Strategy** - 100+ tests covering unit, integration, and database operations
- ✅ **Production-Ready** - Pessimistic locking, transaction safety, connection pooling
- ✅ **Easy Local Setup** - Single `pnpm dev` command after database setup
- ✅ **CI/CD Pipeline** - GitHub Actions with Railway + Vercel deployment

### Beyond Requirements (Bonus)

- ✅ **Interactive Frontend** - React app with map-based location selection
- ✅ **Multi-Product Support** - Extended to support multiple products (extensibility demo)
- ✅ **Architecture Decision Records** - 10 ADRs documenting key decisions
- ✅ **Live Deployment** - Hosted demo with database reset functionality

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Bonus - Vercel)                    │
│              React + Vite + Apollo Client + Leaflet             │
└─────────────────────────┬───────────────────────────────────────┘
                          │ GraphQL
┌─────────────────────────▼───────────────────────────────────────┐
│                  Backend API Server (Railway)                   │
│              Fastify + GraphQL Yoga + Pothos + Prisma           │
└─────────────────────────┬───────────────────────────────────────┘
                          │ PostgreSQL
┌─────────────────────────▼───────────────────────────────────────┐
│                     Database (Railway)                          │
│                        PostgreSQL 16                            │
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer          | Technology                                          |
| -------------- | --------------------------------------------------- |
| **Backend**    | Node.js 22, Fastify, TypeScript                     |
| **GraphQL**    | GraphQL Yoga, Pothos Schema Builder                 |
| **Database**   | PostgreSQL 16, Prisma 7 (with pg adapter)           |
| **Testing**    | Vitest (100+ tests)                                 |
| **Frontend**   | React 19, Vite, Tailwind CSS v4, shadcn/ui, Leaflet |
| **Deployment** | Vercel (frontend), Railway (API + DB)               |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 22+
- pnpm 9+
- Docker (for local PostgreSQL)

### Local Development

```bash
# Clone and install
git clone https://github.com/pingnattawoot/sc-order-management-system.git
cd sc-order-management-system
pnpm install

# Start PostgreSQL
docker-compose up -d

# Setup environment and database
cp apps/api/.env.example apps/api/.env
pnpm --filter api db:generate
pnpm --filter api db:migrate
pnpm --filter api db:seed

# Start development servers
pnpm dev
```

- API: http://localhost:4000
- GraphQL: http://localhost:4000/graphql
- Frontend: http://localhost:3000

### Running Tests

```bash
# First time: setup test database
pnpm --filter api db:test:setup

# Run tests
pnpm test
```

### Load Testing (k6)

Validates pessimistic locking under concurrent load:

```bash
# Install k6 first: brew install k6

# Gradual load test (0→50 VUs)
pnpm load-test

# Spike test (50 concurrent VUs)
pnpm load-test:spike
```

See [load-tests/README.md](load-tests/README.md) for details.

---

## 📝 API Documentation

### GraphQL Endpoint

```
POST /graphql
```

### Query Products

```graphql
query Products {
  products {
    id
    name
    sku
    priceInCents
    weightGrams
  }
}
```

### Verify Order (Quote)

```graphql
mutation VerifyOrder {
  verifyOrder(
    input: {
      items: [{ productId: "ID-OF-SCOS-STATION-P1-PRO", quantity: 50 }]
      latitude: 51.5074
      longitude: -0.1278
    }
  ) {
    isValid
    grandTotalCents
    subtotalCents
    totalShippingCostCents
    discount {
      tierName
      discountPercentage
      discountAmountCents
    }
    shippingValidity {
      isValid
      shippingPercentage
      maxAllowedShippingCents
    }
    items {
      productName
      canFulfill
      unitPriceCents
      subtotalCents
      shippingCostCents
      shipments {
        warehouseName
        quantity
        distanceKm
        shippingCostCents
      }
    }
  }
}
```

### Submit Order

```graphql
mutation SubmitOrder {
  submitOrder(
    input: {
      items: [{ productId: "ID-OF-SCOS-STATION-P1-PRO", quantity: 50 }]
      latitude: 51.5074
      longitude: -0.1278
    }
  ) {
    id
    orderNumber
    status
    subtotalCents
    discountCents
    shippingCents
    totalCents
  }
}
```

### Query Warehouses with Stock

```graphql
query Warehouses {
  warehouses {
    id
    name
    latitude
    longitude
    stocks {
      product {
        name
      }
      quantity
    }
  }
}
```

### Query Order by Number

```graphql
query GetOrder {
  orderByNumber(orderNumber: "ORD-00001") {
    id
    orderNumber
    status
    subtotalCents
    discountCents
    shippingCents
    totalCents
    items {
      product {
        name
      }
      quantity
      shipments {
        warehouseName
        quantity
        distanceKm
        shippingCents
      }
    }
  }
}
```

---

## 🧪 Testing Strategy

The project demonstrates a **comprehensive testing approach** with 106 tests:

### Test Categories

| Category              | Description                               | Examples                             |
| --------------------- | ----------------------------------------- | ------------------------------------ |
| **Unit Tests**        | Pure functions, no I/O                    | Haversine distance, discount tiers   |
| **Integration Tests** | Business logic with mocked dependencies   | Order service, warehouse optimizer   |
| **Database Tests**    | Prisma operations against real PostgreSQL | Stock updates, transaction rollbacks |

### Key Test Scenarios

- ✅ Distance calculation accuracy (Haversine formula)
- ✅ Discount tier boundaries (24→25, 49→50, etc.)
- ✅ Shipping cost calculation
- ✅ 15% shipping validity rule
- ✅ Multi-warehouse fulfillment allocation
- ✅ Pessimistic locking prevents overselling
- ✅ Transaction rollback on partial failures
- ✅ Concurrent order submission safety

```bash
# Run tests
pnpm --filter api test

# Coverage report
pnpm --filter api test:coverage
```

---

## 🏛️ Architecture Decision Records

Key architectural decisions are documented in ADRs:

| ADR     | Decision                   | Rationale                                        |
| ------- | -------------------------- | ------------------------------------------------ |
| ADR-001 | GraphQL over REST          | Self-documenting, type-safe, flexible queries    |
| ADR-002 | Prisma ORM                 | Type-safe queries, excellent transaction support |
| ADR-003 | Greedy Algorithm           | Provably optimal for uniform-weight products     |
| ADR-004 | Decimal.js for Money       | Avoid floating-point precision errors            |
| ADR-005 | Pessimistic Locking        | Prevent race conditions in stock updates         |
| ADR-006 | pnpm Package Manager       | Disk efficient, fast, strict node_modules        |
| ADR-007 | Test Database Safety       | Prevent accidental production data loss          |
| ADR-008 | Haversine vs PostGIS       | Application-level sufficient for 6 warehouses    |
| ADR-009 | API Documentation Strategy | GraphQL introspection + schema descriptions      |
| ADR-010 | Deployment Strategy        | Free tier platforms, production-ready practices  |

See [docs/adr/](docs/adr/) for full decision records.

---

## 📁 Project Structure

```
sc-order-management-system/
├── apps/
│   ├── api/                    # Backend GraphQL API (main deliverable)
│   │   ├── src/
│   │   │   ├── config/         # Environment configuration
│   │   │   ├── domain/         # Business logic (DDD-style)
│   │   │   │   ├── logistics/  # Warehouse optimizer
│   │   │   │   ├── orders/     # Order service
│   │   │   │   └── pricing/    # Discount & shipping
│   │   │   ├── graphql/        # Schema & resolvers (Pothos)
│   │   │   └── lib/            # Utilities (prisma, haversine)
│   │   ├── prisma/             # Database schema & migrations
│   │   └── tests/              # Test suites
│   │
│   └── web/                    # React Frontend (bonus)
│       └── src/
│           ├── components/     # UI components
│           └── generated/      # GraphQL codegen
│
├── docs/
│   ├── adr/                    # Architecture Decision Records
│   └── IMPLEMENTATION_PLAN.md  # Development approach
│
└── .github/
    └── workflows/ci.yml        # CI/CD pipeline
```

---

## 🔮 What I Would Do Next

If this were a real production system, I would prioritize:

1. **Observability** - Structured logging (Pino JSON), metrics (Prometheus), distributed tracing (OpenTelemetry)
2. **Rate Limiting** - Protect API from abuse, implement per-client quotas
3. **Authentication** - API keys or OAuth for sales rep identification
4. **Caching** - Cache warehouse locations, precompute common shipping routes
5. **Event Sourcing** - Track all stock movements for auditing and analytics
6. **Horizontal Scaling** - Read replicas, connection pooling optimization (PgBouncer)
7. **Advanced Features** - Order cancellation, stock reservations with TTL

---

## 📄 License

MIT

---

## 👤 Author

Built by [pingnattawoot](https://github.com/pingnattawoot) for ScreenCloud Technical Assessment.

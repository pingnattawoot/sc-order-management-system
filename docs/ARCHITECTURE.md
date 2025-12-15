# System Architecture Overview

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                    React Frontend (Vite)                    │   │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │   │
│   │  │  Order   │  │  Map     │  │ Warehouse│  │  Order   │     │   │
│   │  │  Form    │  │ (Leaflet)│  │  List    │  │ History  │     │   │
│   │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘     │   │
│   │       └─────────────┴─────────────┴─────────────┘           │   │
│   │                          │                                  │   │
│   │              ┌───────────▼───────────┐                      │   │
│   │              │    Apollo Client      │                      │   │
│   │              │  (GraphQL Queries &   │                      │   │
│   │              │     Mutations)        │                      │   │
│   │              └───────────┬───────────┘                      │   │
│   └──────────────────────────┼──────────────────────────────────┘   │
│                              │ GraphQL                              │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                            API LAYER                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                     Fastify Server                          │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │   │
│   │  │    CORS      │  │   Logger     │  │ Health Check │       │   │
│   │  └──────────────┘  └──────────────┘  └──────────────┘       │   │
│   └───────────────────────────┬─────────────────────────────────┘   │
│                               │                                     │
│   ┌───────────────────────────▼──────────────────────────────────┐  │
│   │                    GraphQL Yoga                              │  │
│   │  ┌───────────────────────────────────────────────────────┐   │  │
│   │  │                   Pothos Schema                       │   │  │
│   │  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐   │   │  │
│   │  │  │   Queries   │  │  Mutations   │  │    Types    │   │   │  │
│   │  │  │ • products  │  │ • verifyOrder│  │ • Product   │   │   │  │
│   │  │  │ • warehouses│  │ • submitOrder│  │ • Warehouse │   |   │  │
│   │  │  │ • orders    │  │              │  │ • Order     │   │   │  │
│   │  │  └─────────────┘  └──────────────┘  │ • Quote     │   │   │  │
│   │  │                                     └─────────────┘   │   │  │
│   │  └───────────────────────────────────────────────────────┘   │  │
│   └───────────────────────────┬──────────────────────────────────┘  │
│                               │                                     │
└───────────────────────────────┼─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          DOMAIN LAYER                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│   │  Order Service  │  │ Warehouse       │  │   Pricing       │     │
│   │                 │  │ Optimizer       │  │                 │     │
│   │ • verifyOrder() │  │                 │  │ • discount.ts   │     │
│   │ • submitOrder() │  │ • findOptimal   │  │ • shipping.ts   │     │
│   │                 │  │   Shipments()   │  │                 │     │
│   └────────┬────────┘  └────────┬────────┘  └────────┬────────┘     │
│            │                    │                    │              │
│            └────────────────────┼────────────────────┘              │
│                                 │                                   │
│   ┌─────────────────────────────▼─────────────────────────────────┐ │
│   │                       Shared Libraries                        │ │
│   │  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────┐  │ │
│   │  │   haversine.ts  │  │   decimal.ts    │  │   prisma.ts   │  │ │
│   │  │  (Distance Calc)│  │  (Money Utils)  │  │  (DB Client)  │  │ │
│   │  └─────────────────┘  └─────────────────┘  └───────────────┘  │ │
│   └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                      Prisma ORM                             │   │
│   │  ┌─────────────────────────────────────────────────────┐    │   │
│   │  │                    Prisma Client                    │    │   │
│   │  │  • Type-safe queries                                │    │   │
│   │  │  • Interactive transactions (SELECT FOR UPDATE)     │    │   │
│   │  │  • Connection pooling                               │    │   │
│   │  └─────────────────────────────────────────────────────┘    │   │
│   └───────────────────────────┬─────────────────────────────────┘   │
│                               │                                     │
│   ┌───────────────────────────▼──────────────────────────────────┐  │
│   │                     PostgreSQL                               │  │
│   │  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐  │  │
│   │  │   Product   │  │  Warehouse  │  │       Order          │  │  │
│   │  │  ┌───────┐  │  │  ┌───────┐  │  │  ┌────────────────┐  │  │  │
│   │  │  │ id    │  │  │  │ id    │  │  │  │ id             │  │  │  │
│   │  │  │ name  │  │  │  │ name  │  │  │  │ orderNumber    │  │  │  │
│   │  │  │ price │  │  │  │ lat   │  │  │  │ quantity       │  │  │  │
│   │  │  │ weight│  │  │  │ long  │  │  │  │ subtotalCents  │  │  │  │
│   │  │  └───────┘  │  │  │ stock │  │  │  │ discountCents  │  │  │  │
│   │  └─────────────┘  │  └───────┘  │  │  │ shippingCents  │  │  │  │
│   │                   └─────────────┘  │  │ totalCents     │  │  │  │
│   │                                    │  └────────────────┘  │  │  │
│   │                                    │           │          │  │  │
│   │                                    │           ▼          │  │  │
│   │                                    │  ┌────────────────┐  │  │  │
│   │                                    │  │ OrderShipment  │  │  │  │
│   │                                    │  │ ┌────────────┐ │  │  │  │
│   │                                    │  │ │ warehouseId│ │  │  │  │
│   │                                    │  │ │ quantity   │ │  │  │  │
│   │                                    │  │ │ distanceKm │ │  │  │  │
│   │                                    │  │ │ shippingCt │ │  │  │  │
│   │                                    │  │ └────────────┘ │  │  │  │
│   │                                    │  └────────────────┘  │  │  │
│   │                                    └──────────────────────┘  │  │
│   └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Request Flow

### Order Verification Flow

```
┌────────┐    ┌─────────┐    ┌─────────────┐    ┌──────────────┐    ┌─────────┐
│Frontend│───▶│ GraphQL │───▶│OrderService │───▶│ Warehouse    │───▶│ Prisma  │
│        │    │  Yoga   │    │verifyOrder()│    │ Optimizer    │    │(Read)   │
└────────┘    └─────────┘    └─────────────┘    └──────────────┘    └─────────┘
     │                              │                   │                 │
     │  verifyOrder mutation        │                   │                 │
     │  (qty, lat, long)            │                   │                 │
     │  ────────────────────────▶   │                   │                 │
     │                              │  findOptimal()    │                 │
     │                              │  ─────────────────▶                 │
     │                              │                   │  get warehouses │
     │                              │                   │  ───────────────▶
     │                              │                   │  ◀───────────────
     │                              │  ◀─────────────────                 │
     │                              │  allocation plan  │                 │
     │                              │                   │                 │
     │                              │  calculate prices │                 │
     │                              │  (discount, ship) │                 │
     │                              │                   │                 │
     │  ◀────────────────────────────                   │                 │
     │  Quote { subtotal, discount, │                   │                 │
     │         shipping, isValid }  │                   │                 │
     ▼                              ▼                   ▼                 ▼
```

### Order Submission Flow

```
┌────────┐    ┌─────────┐    ┌─────────────┐    ┌──────────────┐    ┌─────────┐
│Frontend│───▶│ GraphQL │───▶│OrderService │───▶│   Prisma     │───▶│PostgreSQL
│        │    │  Yoga   │    │submitOrder()│    │ Transaction  │    │(Locked) │
└────────┘    └─────────┘    └─────────────┘    └──────────────┘    └─────────┘
     │                              │                   │                 │
     │  submitOrder mutation        │                   │                 │
     │  ─────────────────────────▶  │                   │                 │
     │                              │  $transaction()   │                 │
     │                              │  ─────────────────▶                 │
     │                              │                   │ SELECT...FOR    │
     │                              │                   │ UPDATE          │
     │                              │                   │ ───────────────▶│
     │                              │                   │ ◀───────────────│
     │                              │                   │ (rows locked)   │
     │                              │                   │                 │
     │                              │  calculate alloc  │                 │
     │                              │  ◀─────────────────                 │
     │                              │                   │                 │
     │                              │  validate 15%     │                 │
     │                              │                   │                 │
     │                              │  update stocks    │                 │
     │                              │  ─────────────────▶ UPDATE warehouse│
     │                              │                   │ ───────────────▶│
     │                              │                   │                 │
     │                              │  create order     │                 │
     │                              │  ─────────────────▶ INSERT order    │
     │                              │                   │ ───────────────▶│
     │                              │                   │                 │
     │                              │  commit           │                 │
     │                              │  ─────────────────▶ COMMIT          │
     │                              │                   │ ───────────────▶│
     │                              │                   │ ◀───────────────│
     │                              │  ◀─────────────────                 │
     │  ◀────────────────────────────  (order released)                   │
     │  Order { orderNumber, ... }  │                   │                 │
     ▼                              ▼                   ▼                 ▼
```

## Project Structure

```
sc-order-management-system/
├── apps/
│   ├── api/                          # Backend API
│   │   ├── src/
│   │   │   ├── index.ts              # Entry point
│   │   │   ├── server.ts             # Fastify setup
│   │   │   ├── config/
│   │   │   │   └── index.ts          # Environment config
│   │   │   ├── lib/
│   │   │   │   ├── prisma.ts         # Prisma singleton
│   │   │   │   ├── decimal.ts        # Money utilities
│   │   │   │   └── haversine.ts      # Distance calculation
│   │   │   ├── domain/
│   │   │   │   ├── pricing/
│   │   │   │   │   ├── discount.ts   # Volume discounts
│   │   │   │   │   └── shipping.ts   # Shipping cost
│   │   │   │   ├── logistics/
│   │   │   │   │   └── warehouse-optimizer.ts
│   │   │   │   └── orders/
│   │   │   │       ├── order.service.ts
│   │   │   │       └── order.types.ts
│   │   │   └── graphql/
│   │   │       ├── builder.ts        # Pothos builder
│   │   │       ├── schema.ts         # Complete schema
│   │   │       ├── types/
│   │   │       │   ├── product.ts
│   │   │       │   ├── warehouse.ts
│   │   │       │   ├── order.ts
│   │   │       │   └── quote.ts
│   │   │       └── resolvers/
│   │   │           ├── queries.ts
│   │   │           └── mutations.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── seed.ts
│   │   │   └── migrations/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vitest.config.ts
│   │
│   └── web/                          # Frontend
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   ├── lib/
│       │   │   └── apollo.ts
│       │   ├── components/
│       │   │   ├── layout/
│       │   │   ├── map/
│       │   │   ├── order/
│       │   │   └── warehouse/
│       │   ├── pages/
│       │   │   ├── OrderPage.tsx
│       │   │   └── OrdersPage.tsx
│       │   └── generated/            # GraphQL codegen output
│       ├── package.json
│       ├── codegen.yml
│       └── vite.config.ts
│
├── docs/
│   ├── IMPLEMENTATION_PLAN.md
│   ├── ARCHITECTURE.md
│   └── adr/
│       ├── README.md
│       ├── ADR-001-graphql-over-rest.md
│       ├── ADR-002-prisma-orm-selection.md
│       ├── ADR-003-greedy-algorithm-warehouse-selection.md
│       ├── ADR-004-decimal-js-for-money-calculations.md
│       └── ADR-005-pessimistic-locking-for-stock-updates.md
│
├── docker/
│   └── docker-compose.yml
│
├── package.json                      # Root workspace config
├── CHECKLIST.md                      # Implementation progress
└── README.md                         # Project README
```

## Key Algorithms

### Haversine Formula (Distance Calculation)

The Haversine formula calculates the great-circle distance between two points on a sphere given their longitudes and latitudes.

```
a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlon/2)
c = 2 × atan2(√a, √(1−a))
d = R × c

Where:
- R = Earth's radius (6,371 km)
- lat1, lat2 = latitudes in radians
- Δlat = lat2 − lat1
- Δlon = lon2 − lon1
```

### Greedy Warehouse Allocation

```python
def allocate_shipments(customer_lat, customer_long, quantity):
    warehouses = get_warehouses_with_stock()

    # Calculate distances
    for warehouse in warehouses:
        warehouse.distance = haversine(
            warehouse.lat, warehouse.long,
            customer_lat, customer_long
        )

    # Sort by distance (nearest first)
    warehouses.sort(key=lambda w: w.distance)

    # Greedy allocation
    shipments = []
    remaining = quantity

    for warehouse in warehouses:
        if remaining <= 0:
            break

        allocate = min(remaining, warehouse.stock)
        if allocate > 0:
            shipments.append({
                warehouse: warehouse,
                quantity: allocate
            })
            remaining -= allocate

    if remaining > 0:
        raise InsufficientStockError()

    return shipments
```

### Volume Discount Tiers

| Units   | Discount |
| ------- | -------- |
| 1-24    | 0%       |
| 25-49   | 5%       |
| 50-99   | 10%      |
| 100-249 | 15%      |
| 250+    | 20%      |

### Shipping Cost Formula

```
Shipping Cost = Distance (km) × Weight (kg) × Rate × Quantity

Where:
- Weight = 365g = 0.365 kg
- Rate = $0.01 per kg per km
```

### Order Validity Rule

An order is **invalid** if:

```
Shipping Cost > 15% × (Subtotal − Discount)
```

## Scalability Considerations

### Current Design Handles

- **6 warehouses**: O(W log W) sorting is trivial
- **Moderate concurrent orders**: Row-level locking scales well
- **Single product**: Simple pricing logic

### Future Scaling Options

1. **Read Replicas**

   - Route read queries (warehouse list, order history) to replicas
   - Keep writes on primary

2. **Caching**

   - Cache warehouse locations (rarely change)
   - Cache product pricing
   - Invalidate on updates

3. **Queue-Based Order Processing**

   - Move order submission to a queue (SQS, RabbitMQ)
   - Better handling of traffic spikes
   - Natural rate limiting

4. **Multi-Region Deployment**

   - Deploy API close to each warehouse region
   - Use database replication or sharding

5. **Event Sourcing**
   - Track all inventory movements as events
   - Better audit trail
   - Enables CQRS pattern

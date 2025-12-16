# ADR-005: Pessimistic Locking for Stock Updates

## Status

**Accepted**

## Date

2025-12-15

## Context

The Order Management System must handle concurrent order submissions. The challenge states:

> "A successful order submission should result in warehouse inventory immediately being updated."

### The Race Condition Problem

Consider this scenario without proper locking:

1. Warehouse LA has 5 units in stock
2. User A submits order for 3 units (verifies: OK, stock = 5)
3. User B submits order for 4 units (verifies: OK, stock = 5)
4. User A's transaction: stock = 5 - 3 = 2 ✓
5. User B's transaction: stock = 5 - 4 = 1 ✓ (WRONG! Should fail)

Both orders succeed, but we've promised 7 units from a warehouse with only 5.

### Options Considered

1. **No Locking** (Unsafe)
   - Race conditions as shown above
2. **Optimistic Locking** (Version-based)
   - Add version column
   - Check version on update
   - Retry on conflict
3. **Pessimistic Locking** (Row-level locks)
   - Lock rows during transaction
   - Other transactions wait
   - Guaranteed consistency

## Decision

We will use **Pessimistic Locking** with Prisma's interactive transactions and `SELECT FOR UPDATE`.

## Rationale

### Why Pessimistic Locking?

1. **Order submission is a critical path**

   - We cannot afford to fail and retry
   - User expects immediate confirmation
   - Stock must be accurate

2. **Contention is expected but manageable**

   - Multiple sales reps may order simultaneously
   - Lock duration is short (milliseconds)
   - 6 warehouses means distributed contention

3. **Simpler error handling**

   - No retry logic needed
   - Transaction either succeeds or fails cleanly
   - No partial updates possible

4. **Prisma has excellent transaction support**
   - Interactive transactions available
   - Raw query support for SELECT FOR UPDATE

### Implementation

```typescript
async function submitOrder(quantity: number, lat: number, long: number) {
  return await prisma.$transaction(
    async (tx) => {
      // Step 1: Lock and fetch warehouses with stock
      // Using raw query for SELECT ... FOR UPDATE
      const warehouses = await tx.$queryRaw<Warehouse[]>`
      SELECT id, name, latitude, longitude, stock
      FROM "Warehouse"
      WHERE stock > 0
      FOR UPDATE
    `;

      // Step 2: Calculate optimal allocation (in memory)
      const allocation = calculateOptimalShipments(
        warehouses,
        quantity,
        lat,
        long
      );

      // Step 3: Validate total stock is sufficient
      if (!allocation.canFulfill) {
        throw new InsufficientStockError();
      }

      // Step 4: Update stock for each warehouse
      for (const shipment of allocation.shipments) {
        await tx.warehouse.update({
          where: { id: shipment.warehouseId },
          data: { stock: { decrement: shipment.quantity } },
        });
      }

      // Step 5: Create order record
      const order = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          quantity,
          customerLat: lat,
          customerLong: long,
          subtotalCents: allocation.subtotalCents,
          discountCents: allocation.discountCents,
          shippingCents: allocation.shippingCents,
          totalCents: allocation.totalCents,
          shipments: {
            create: allocation.shipments.map((s) => ({
              warehouseId: s.warehouseId,
              quantity: s.quantity,
              distanceKm: s.distanceKm,
              shippingCents: s.shippingCents,
            })),
          },
        },
      });

      return order;
    },
    {
      isolationLevel: "Serializable", // Highest isolation
      maxWait: 5000, // Max wait for transaction slot
      timeout: 10000, // Max transaction duration
    }
  );
}
```

### Key Implementation Details

1. **SELECT FOR UPDATE**

   - Locks all warehouse rows with stock > 0
   - Other transactions wait until lock is released
   - Lock is released at transaction commit/rollback

2. **Serializable Isolation**

   - Highest isolation level
   - Prevents all concurrency anomalies
   - May slightly reduce throughput (acceptable for this use case)

3. **Transaction Timeouts**

   - Prevents deadlocks from holding locks forever
   - 10-second timeout is generous for this operation

4. **Atomic Multi-Warehouse Updates**
   - All warehouse updates succeed or none do
   - Order is only created if all stock is reserved

### Alternative: Optimistic Locking

```typescript
// This is NOT our approach, but shown for comparison
model Warehouse {
  id      String @id
  stock   Int
  version Int    @default(0)
}

// Update with version check
const updated = await prisma.warehouse.updateMany({
  where: {
    id: warehouseId,
    stock: { gte: quantity },
    version: expectedVersion
  },
  data: {
    stock: { decrement: quantity },
    version: { increment: 1 }
  }
});

if (updated.count === 0) {
  throw new ConcurrencyConflictError();
}
```

**Why we didn't choose this:**

- More complex error handling
- Need retry logic
- Multi-warehouse updates require checking each one
- User experience is worse (retries, potential failures)

### Preventing Negative Stock

Defense in depth - even with locking, we add a database constraint:

```prisma
model Warehouse {
  id    String @id
  stock Int    @default(0)

  @@check(stock >= 0) // PostgreSQL check constraint
}
```

And validate in application code:

```typescript
// Before decrementing
if (warehouse.stock < shipment.quantity) {
  throw new InsufficientStockError();
}
```

## Consequences

### Positive

- Guaranteed data consistency
- No race conditions possible
- Simple, predictable behavior
- Clear audit trail of stock movements

### Negative

- Slightly reduced throughput under extreme load
- Potential for longer wait times if many concurrent orders
- Lock escalation possible with many warehouses

### Mitigations

- Keep transaction duration short
- Lock only rows needed (FOR UPDATE, not table-level)
- Use connection pooling to manage database connections

### Performance Characteristics

Under normal load (< 100 concurrent orders):

- Transaction completes in < 100ms
- Lock contention is minimal
- No perceptible delay to users

Under high load (100+ concurrent orders):

- Transactions may queue briefly
- Still completes within timeout
- Consider read replicas for non-transactional queries

## Load Testing Recommendations

### Why Load Test Pessimistic Locking?

Pessimistic locking has predictable worst-case behavior, but we should verify:

1. **Lock wait times** under concurrent load
2. **Rollback behavior** works correctly
3. **Connection pool** doesn't exhaust
4. **Timeout handling** is appropriate

### Recommended Tool: k6

k6 provides excellent support for GraphQL and concurrent testing:

```javascript
// load-tests/order-submission.js
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const errorRate = new Rate("errors");
const orderDuration = new Trend("order_duration");

export const options = {
  scenarios: {
    // Scenario 1: Gradual ramp-up
    ramp_up: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 20 }, // Warm up
        { duration: "1m", target: 50 }, // Normal load
        { duration: "30s", target: 100 }, // Push limits
        { duration: "1m", target: 100 }, // Sustain high load
        { duration: "30s", target: 0 }, // Cool down
      ],
    },
    // Scenario 2: Spike test
    spike: {
      executor: "ramping-vus",
      startVUs: 0,
      startTime: "4m", // Start after ramp_up
      stages: [
        { duration: "10s", target: 200 }, // Sudden spike
        { duration: "30s", target: 200 }, // Sustain spike
        { duration: "10s", target: 0 }, // Drop
      ],
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% under 500ms
    errors: ["rate<0.05"], // Error rate under 5%
    order_duration: ["p(99)<1000"], // 99% orders under 1s
  },
};

const GRAPHQL_ENDPOINT = "http://localhost:4000/graphql";

// Get a random product ID (assumes products are seeded)
const productIds = JSON.parse(open("./product-ids.json"));

export default function () {
  const productId = productIds[Math.floor(Math.random() * productIds.length)];
  const quantity = Math.floor(Math.random() * 10) + 1; // 1-10 units

  // Random location (roughly UK area for test variety)
  const lat = 51 + (Math.random() * 5 - 2.5);
  const lon = -1 + (Math.random() * 4 - 2);

  const mutation = `
    mutation SubmitOrder($input: OrderInput!) {
      submitOrder(input: $input) {
        orderNumber
        totalCents
        status
      }
    }
  `;

  const variables = {
    input: {
      items: [{ productId, quantity }],
      latitude: lat,
      longitude: lon,
    },
  };

  const startTime = Date.now();

  const res = http.post(
    GRAPHQL_ENDPOINT,
    JSON.stringify({ query: mutation, variables }),
    { headers: { "Content-Type": "application/json" } }
  );

  const duration = Date.now() - startTime;
  orderDuration.add(duration);

  const success = check(res, {
    "status is 200": (r) => r.status === 200,
    "no GraphQL errors": (r) => {
      const body = JSON.parse(r.body);
      return !body.errors || body.errors.length === 0;
    },
    "has order number": (r) => {
      const body = JSON.parse(r.body);
      return body.data?.submitOrder?.orderNumber !== undefined;
    },
  });

  errorRate.add(!success);

  sleep(Math.random() * 2); // Random think time 0-2s
}
```

### Expected Results

| Metric          | Target     | Notes                        |
| --------------- | ---------- | ---------------------------- |
| **p50 latency** | < 100ms    | Most orders fast             |
| **p95 latency** | < 500ms    | Acceptable queue time        |
| **p99 latency** | < 1000ms   | Worst case under 1s          |
| **Error rate**  | < 1%       | Only stock/validation errors |
| **Throughput**  | 100+ req/s | With 6 warehouses            |

### Rollback Verification

Test that rollback works correctly:

```javascript
// Intentionally order more than available stock
const hugeOrder = {
  input: {
    items: [{ productId: "xxx", quantity: 999999 }],
    latitude: 51.5,
    longitude: -0.1,
  },
};

// Should return error, not create partial order
// Stock levels should be unchanged
```

### Connection Pool Monitoring

Monitor these PostgreSQL metrics during load tests:

- `pg_stat_activity.count` - Active connections
- `pg_stat_activity.wait_event_type` - Lock waits
- `pg_locks` - Lock contention

```sql
-- Check lock contention during test
SELECT
  relation::regclass,
  mode,
  count(*) as lock_count
FROM pg_locks
WHERE granted = false
GROUP BY relation, mode;
```

## Capacity Planning

Based on our locking strategy:

| Concurrent Users | Expected p95 Latency | Notes              |
| ---------------- | -------------------- | ------------------ |
| 10               | < 50ms               | No contention      |
| 50               | < 100ms              | Minimal contention |
| 100              | < 300ms              | Some queuing       |
| 200              | < 800ms              | Near capacity      |
| 500+             | > 1s or timeouts     | Need scaling       |

### Scaling Options (If Needed)

1. **Read Replicas** - Offload read queries
2. **Queue-Based Processing** - Decouple submission from processing
3. **Sharding by Region** - Distribute writes across DB instances

## Future Considerations

1. **Event Sourcing**

   - Track all stock movements as events
   - Stock level becomes sum of events
   - Better audit trail and debugging

2. **Saga Pattern**

   - For distributed systems with multiple services
   - Not needed for current monolithic design

3. **Queue-Based Processing**
   - Process orders through a queue
   - Natural rate limiting
   - Better for very high throughput

## References

- [Prisma Interactive Transactions](https://www.prisma.io/docs/orm/prisma-client/queries/transactions#interactive-transactions)
- [PostgreSQL Row-Level Locking](https://www.postgresql.org/docs/current/explicit-locking.html#LOCKING-ROWS)
- [Martin Kleppmann - Designing Data-Intensive Applications](https://dataintensive.net/)
- [k6 Load Testing](https://k6.io/docs/)
- [PostgreSQL Lock Monitoring](https://www.postgresql.org/docs/current/monitoring-locks.html)

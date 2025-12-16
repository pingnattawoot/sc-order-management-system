# Load Tests

Load testing suite for **validating pessimistic locking** prevents overselling under concurrent load.

## What We're Testing

The **primary goal** is to verify that **stock never goes negative**, even under heavy concurrent load. This validates that our pessimistic locking (SELECT FOR UPDATE) is working correctly.

### Expected Behaviors

| Behavior                      | Expected? | Why                                    |
| ----------------------------- | --------- | -------------------------------------- |
| Orders succeed                | ✅ Yes    | Normal operation                       |
| "Insufficient stock" errors   | ✅ Yes    | Stock depleted, business rule enforced |
| "Shipping exceeds 15%" errors | ✅ Yes    | Business rule enforced correctly       |
| Negative stock values         | ❌ NO!    | **This would indicate a bug**          |

### Pass/Fail Criteria

- ✅ **PASS**: All stock values >= 0 after test (shown in teardown)
- ❌ **FAIL**: Any negative stock value detected

## Prerequisites

1. **Install k6**

   ```bash
   # macOS
   brew install k6

   # Linux
   sudo apt-get install k6

   # Windows
   choco install k6
   ```

2. **Start the API server**

   ```bash
   pnpm dev:api
   ```

3. **Seed the database** (if needed)
   ```bash
   pnpm --filter api db:seed
   ```

## Running Tests

### Order Submission (Gradual Load)

Tests the system under gradually increasing load:

```bash
# Local
k6 run load-tests/order-submission.js

# Against production (use carefully!)
k6 run -e API_URL=https://api-production-1800.up.railway.app load-tests/order-submission.js
```

### Concurrent Orders (Spike Test)

Tests sudden concurrent spikes to verify locking prevents overselling:

```bash
k6 run load-tests/concurrent-orders.js
```

## Test Scenarios

### order-submission.js

- **Ramp-up**: 0 → 10 → 25 → 50 VUs over 2 minutes
- **Purpose**: Verify consistent performance under normal-to-high load
- **Key metrics**:
  - `order_duration` p95 < 1000ms
  - `errors` rate < 10%

### concurrent-orders.js

- **Spike**: 0 → 50 VUs instantly, sustained for 20s
- **Purpose**: Verify no overselling during concurrent bursts
- **Key check**: No negative stock values after test
- **Expected**: Some stock errors as inventory depletes

## Interpreting Results

### Successful Test Output

```
=== Database Integrity Check ===
  Los Angeles: 120 units remaining
  New York: 85 units remaining
  ...

✅ DATABASE INTEGRITY: All stock values >= 0
Pessimistic locking is working correctly.

=== Expected Errors ===
- Stock errors: Orders rejected due to insufficient inventory
- Shipping errors: Orders rejected due to 15% shipping rule
These are business validation errors, NOT test failures.
```

### Failed Test Output (Critical Bug!)

```
❌ NEGATIVE STOCK: Los Angeles - SCOS Station P1 Pro: -5

❌ TEST FAILED: Negative stock detected!
This indicates pessimistic locking is NOT working correctly.
```

### Metrics to Watch

| Metric              | Healthy         | Notes                             |
| ------------------- | --------------- | --------------------------------- |
| `errors`            | Low (< 5%)      | Only counts **unexpected** errors |
| `stock_errors`      | Can be high     | Expected as inventory depletes    |
| `shipping_errors`   | Can occur       | 15% rule being enforced           |
| `unexpected_errors` | Should be **0** | Real problems to investigate      |

## Performance Targets

| Metric          | Target   | Notes                        |
| --------------- | -------- | ---------------------------- |
| **p50 latency** | < 200ms  | Most orders fast             |
| **p95 latency** | < 1000ms | Acceptable queue time        |
| **p99 latency** | < 2000ms | Worst case under 2s          |
| **Error rate**  | < 10%    | Only stock/validation errors |
| **Throughput**  | 50+ rps  | With pessimistic locking     |

## Troubleshooting

### Connection Refused

API server not running. Start with `pnpm dev:api`.

### No Products Found

Database not seeded. Run `pnpm --filter api db:seed`.

### High Error Rate

Check API logs for specific errors. Common causes:

- All stock depleted (expected in spike tests)
- Database connection pool exhausted
- Transaction timeouts

### Reset Database

Use the reset endpoint after testing:

```bash
curl -X POST http://localhost:4000/api/reset-demo
```

## References

- [ADR-005: Pessimistic Locking](../docs/adr/ADR-005-pessimistic-locking-for-stock-updates.md)
- [k6 Documentation](https://k6.io/docs/)

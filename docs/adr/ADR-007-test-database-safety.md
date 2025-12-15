# ADR-007: Test Database Safety

## Status

Accepted

## Date

2025-12-15

## Context

Integration tests require database access to test database operations (CRUD, transactions, stock locking). However, running tests against a production database could result in catastrophic data loss:

```typescript
// 🚨 DANGER: Without safety checks, this could wipe production data!
beforeEach(async () => {
  await prisma.orderShipment.deleteMany();
  await prisma.order.deleteMany();
});
```

If `DATABASE_URL` accidentally points to production (misconfiguration, copy-paste error, CI variable leak), running tests would permanently delete all orders.

## Decision

Implement multi-layer database safety for tests:

### Layer 1: URL Validation

Before any test runs, validate the database URL against:

- **Blocklist**: Cloud providers (AWS, Azure, GCP, Heroku, Railway, Supabase, Neon, PlanetScale)
- **Blocklist**: Production keywords (prod, production, live)
- **Allowlist**: Safe patterns (localhost, 127.0.0.1, test, dev, local)

```typescript
// Blocks execution immediately if URL looks like production
validateTestDatabaseUrl(process.env.DATABASE_URL);
```

### Layer 2: Separate Test Database URL

Encourage using `TEST_DATABASE_URL` instead of sharing `DATABASE_URL`:

```bash
# .env.test
TEST_DATABASE_URL="postgresql://test:test@localhost:5432/test_db"
```

### Layer 3: Testcontainers (Recommended)

Provide testcontainers support for truly isolated tests:

```typescript
const container = new TestDatabaseContainer();
await container.start(); // Fresh PostgreSQL per test run
await container.migrate(); // Apply schema
await container.seed(); // Seed test data
// Tests run against completely isolated database
await container.stop(); // Cleanup
```

## Consequences

### Positive

- **Catastrophic failure prevention**: Tests cannot run against production
- **Early failure**: Catches dangerous configurations at startup, not during test execution
- **Clear error messages**: Explains exactly what went wrong and how to fix it
- **CI-friendly**: Testcontainers work in any CI environment with Docker
- **Zero trust**: Each test run gets a fresh database (testcontainers mode)

### Negative

- **Slightly slower startup**: URL validation adds ~1ms overhead
- **Testcontainers overhead**: Container startup adds ~2-5s to first test run
- **Docker dependency**: Testcontainers requires Docker to be running

## Implementation

Files created/modified:

- `src/__tests__/helpers/test-database.ts` - URL validation and testcontainers helper
- `src/__tests__/setup.ts` - Runs validation before all tests
- `package.json` - Added `@testcontainers/postgresql` dev dependency

## Usage

### Option 1: Local Test Database (Fast)

```bash
# Set TEST_DATABASE_URL to a safe local database
export TEST_DATABASE_URL="postgresql://test:test@localhost:5432/test_db"
pnpm test
```

### Option 2: Testcontainers (Safest)

```typescript
import { getTestContainer } from "../helpers/test-database.js";

describe("Integration Tests", () => {
  let container;

  beforeAll(async () => {
    container = await getTestContainer();
  });

  afterAll(async () => {
    await stopTestContainer();
  });
});
```

## Related

- ADR-002: Pessimistic Locking (database transaction safety)
- ADR-005: Decimal.js for Money (data integrity)

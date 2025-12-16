# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for the ScreenCloud Order Management System.

## What are ADRs?

ADRs are short documents that capture important architectural decisions made along with their context and consequences. They help future developers understand why certain decisions were made.

## Index

| ADR                                                           | Title                                    | Status   | Date       |
| ------------------------------------------------------------- | ---------------------------------------- | -------- | ---------- |
| [ADR-001](./ADR-001-graphql-over-rest.md)                     | GraphQL Over REST API                    | Accepted | 2025-12-15 |
| [ADR-002](./ADR-002-prisma-orm-selection.md)                  | Prisma ORM Selection                     | Accepted | 2025-12-15 |
| [ADR-003](./ADR-003-greedy-algorithm-warehouse-selection.md)  | Greedy Algorithm for Warehouse Selection | Accepted | 2025-12-15 |
| [ADR-004](./ADR-004-decimal-js-for-money-calculations.md)     | Decimal.js for Money Calculations        | Accepted | 2025-12-15 |
| [ADR-005](./ADR-005-pessimistic-locking-for-stock-updates.md) | Pessimistic Locking for Stock Updates    | Accepted | 2025-12-15 |
| [ADR-006](./ADR-006-pnpm-package-manager.md)                  | pnpm Package Manager                     | Accepted | 2025-12-15 |
| [ADR-007](./ADR-007-test-database-safety.md)                  | Test Database Safety                     | Accepted | 2025-12-15 |
| [ADR-008](./ADR-008-haversine-vs-postgis.md)                  | Application-Level Haversine vs PostGIS   | Accepted | 2025-12-16 |
| [ADR-009](./ADR-009-api-documentation-strategy.md)            | API Documentation Strategy               | Accepted | 2025-12-16 |
| [ADR-010](./ADR-010-deployment-strategy.md)                   | Deployment Strategy                      | Accepted | 2025-12-16 |

## ADR Template

```markdown
# ADR-XXX: Title

## Status

Proposed | Accepted | Deprecated | Superseded by ADR-XXX

## Date

YYYY-MM-DD

## Context

What is the issue that we're seeing that is motivating this decision?

## Decision

What is the change that we're proposing?

## Rationale

Why did we choose this decision over alternatives?

## Consequences

What becomes easier or harder as a result of this decision?

## Alternatives Considered

What other options did we consider?

## References

Links to relevant documentation, articles, etc.
```

## Key Design Decisions Summary

### 1. GraphQL API (ADR-001)

We use GraphQL for its self-documenting nature, type safety, and flexibility. Pothos provides compile-time type checking for the schema.

### 2. Prisma ORM (ADR-002)

Prisma offers declarative schemas, type-safe queries, and excellent transaction support crucial for inventory management.

### 3. Greedy Algorithm (ADR-003)

For uniform-weight products, the greedy "nearest warehouse first" approach is provably optimal, not just a heuristic.

### 4. Decimal.js (ADR-004)

All monetary calculations use Decimal.js to avoid floating-point precision errors. Money is stored as integers (cents) in the database.

### 5. Pessimistic Locking (ADR-005)

We use database row-level locks (SELECT FOR UPDATE) to prevent race conditions when updating inventory during order submission.

### 6. pnpm Package Manager (ADR-006)

We use pnpm for its disk efficiency (content-addressable store), faster installations, strict node_modules structure, and excellent monorepo workspace support.

### 7. Test Database Safety (ADR-007)

Dedicated test database with safety guards to prevent accidental production data loss during test runs.

### 8. Application-Level Haversine (ADR-008)

For 6 warehouses, application-level Haversine calculation is simpler and equally performant compared to PostGIS. PostGIS would be considered at 100+ warehouses for spatial indexing benefits.

### 9. API Documentation Strategy (ADR-009)

GraphQL introspection provides self-documenting APIs. We enhance this with rich schema descriptions in Pothos types and supplementary markdown documentation for business rules.

### 10. Deployment Strategy (ADR-010)

Multi-platform deployment: Vercel for frontend (CDN edge), Railway for backend + PostgreSQL, GitHub Actions for CI/CD. All free tier, production-ready practices.

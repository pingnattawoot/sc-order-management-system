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

# ADR-002: Prisma ORM Selection

## Status
**Accepted**

## Date
2025-12-15

## Context

We need a database access layer for the Order Management System. The system requires:
- Complex transactions (order submission with stock updates)
- Relational data (orders, shipments, warehouses)
- Type safety for database operations
- Easy database migrations

Options considered:
- Raw SQL with `pg` driver
- Kysely (type-safe query builder)
- Drizzle ORM
- Prisma ORM
- TypeORM

## Decision

We will use **Prisma** as our ORM with **PostgreSQL** as the database.

## Rationale

### Why Prisma?

1. **Declarative Schema**
   ```prisma
   model Warehouse {
     id        String  @id @default(uuid())
     name      String  @unique
     latitude  Decimal @db.Decimal(10, 6)
     longitude Decimal @db.Decimal(10, 6)
     stock     Int     @default(0)
   }
   ```
   - Single source of truth for database structure
   - Easy to understand and modify

2. **Type-Safe Queries**
   ```typescript
   const warehouse = await prisma.warehouse.findUnique({
     where: { id: warehouseId }
   });
   // warehouse is fully typed: Warehouse | null
   ```

3. **Interactive Transactions**
   - Critical for our stock management
   ```typescript
   await prisma.$transaction(async (tx) => {
     await tx.warehouse.update({
       where: { id: warehouseId },
       data: { stock: { decrement: quantity } }
     });
     await tx.order.create({ data: orderData });
   });
   ```

4. **Built-in Migration System**
   ```bash
   npx prisma migrate dev --name add-order-status
   ```
   - Generates SQL migration files
   - Version controlled database changes
   - Easy rollbacks

5. **Prisma Studio**
   - Built-in database GUI
   - Great for development and debugging

6. **Pothos Integration**
   - `@pothos/plugin-prisma` auto-generates GraphQL types
   - Reduces boilerplate significantly

### Why PostgreSQL?

1. **Decimal Precision**
   - `DECIMAL(10, 6)` for coordinates
   - Proper money handling (no floating point issues)

2. **Transaction Support**
   - ACID compliance for order processing
   - Row-level locking for concurrent stock updates

3. **Reliability**
   - Battle-tested in production
   - ScreenCloud likely already uses PostgreSQL

4. **JSON Support**
   - Future flexibility for metadata storage

## Consequences

### Positive
- Fast development with generated types
- Easy migrations and seeding
- Excellent developer experience
- Strong community and documentation

### Negative
- Abstraction overhead (can't use all PostgreSQL features)
- Some complex queries require raw SQL
- Generated client increases bundle size (not relevant for backend)

### Mitigations
- Use `prisma.$queryRaw` for complex queries if needed
- PostgreSQL-specific features accessible via `@db.` directives

## Money Storage Strategy

We store all monetary values as **integers in cents**:
- `priceInCents: 15000` instead of `price: 150.00`

This prevents floating-point precision issues and matches Decimal.js usage in business logic.

## Alternatives Considered

1. **Kysely**
   - More flexible SQL generation
   - Less opinionated, more learning curve
   - No migration system built-in

2. **Drizzle ORM**
   - Excellent performance
   - Newer, less mature ecosystem
   - No Pothos plugin available

3. **TypeORM**
   - Full ORM with relations
   - More complex configuration
   - Less TypeScript-native feel

## References
- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Transactions](https://www.prisma.io/docs/concepts/components/prisma-client/transactions)


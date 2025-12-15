# ADR-001: GraphQL Over REST API

## Status
**Accepted**

## Date
2025-12-15

## Context

We need to design an API for the ScreenCloud Order Management System that allows sales representatives to:
1. Verify potential orders (get quote with pricing breakdown)
2. Submit orders (create order with inventory updates)

The API should be well-documented and developer-friendly. We considered two main approaches:
- REST API with OpenAPI/Swagger documentation
- GraphQL API with introspection and schema-first design

## Decision

We will use **GraphQL** as our API layer, implemented with:
- **GraphQL Yoga** as the server
- **Pothos** as the schema builder (type-safe schema generation)

## Rationale

### Advantages of GraphQL for this use case:

1. **Self-Documenting API**
   - GraphQL schemas are introspectable
   - GraphiQL/Apollo Sandbox provides interactive documentation
   - Types are explicit and strongly typed

2. **Flexible Data Fetching**
   - Clients can request exactly the fields they need
   - Order verification can return minimal data for quick validation
   - Order details can include full shipment breakdown when needed

3. **Type Safety End-to-End**
   - Pothos generates TypeScript types from the schema
   - GraphQL Codegen generates typed React hooks
   - Reduces runtime errors significantly

4. **Better Developer Experience**
   - Single endpoint simplifies client configuration
   - Built-in validation for inputs
   - Clear error handling patterns

5. **Future Extensibility**
   - Adding new fields is non-breaking
   - Subscriptions can be added for real-time stock updates
   - Federation possible for microservices architecture

### Why not REST?

- REST would require multiple endpoints with potentially overlapping data
- OpenAPI documentation requires manual synchronization
- Nested resources (Order → Shipments → Warehouses) are awkward in REST

### Why Pothos over Schema-First (SDL)?

- Pothos provides TypeScript type safety at compile time
- Resolvers are colocated with type definitions
- Prisma plugin auto-generates types from database schema
- Better IDE support and refactoring capabilities

## Consequences

### Positive
- Frontend team can use typed GraphQL operations
- API documentation is always up-to-date
- Easier to iterate on API structure

### Negative
- Slightly higher complexity than simple REST endpoints
- Team needs GraphQL knowledge
- Caching strategies differ from REST (no HTTP caching)

### Mitigations
- Use Apollo Client on frontend for intelligent caching
- Provide GraphQL query examples in documentation
- Keep schema simple for this MVP

## Alternatives Considered

1. **REST with Express + Swagger**
   - Simpler but less type-safe
   - More boilerplate for documentation

2. **tRPC**
   - Excellent type safety
   - But not a standard API format
   - Harder to document for non-TypeScript clients

## References
- [GraphQL Yoga Documentation](https://the-guild.dev/graphql/yoga-server)
- [Pothos GraphQL](https://pothos-graphql.dev/)


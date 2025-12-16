# ADR-009: API Documentation Strategy

## Status

**Accepted**

## Date

2025-12-16

## Context

The Order Management System exposes a GraphQL API for order management. We need to decide how to document this API for:

1. **Developers** integrating with the API
2. **QA teams** testing endpoints
3. **Business stakeholders** understanding available operations

### Documentation Approaches Considered

1. **GraphQL Introspection Only** (GraphiQL/Playground)
2. **Schema Descriptions** (Rich annotations in Pothos)
3. **External Documentation** (Docusaurus, GitBook, etc.)
4. **OpenAPI Generation** (graphql-to-openapi for REST consumers)

## Decision

We will use a **layered documentation approach**:

1. **Primary:** GraphQL Introspection with GraphiQL playground
2. **Enhanced:** Rich schema descriptions in Pothos types
3. **Supplementary:** Markdown documentation for business rules

## Rationale

### GraphQL's Self-Documenting Nature

GraphQL provides built-in documentation through introspection:

```graphql
# Query the schema
{
  __schema {
    types {
      name
      description
    }
    queryType {
      fields {
        name
        description
        args {
          name
          description
        }
      }
    }
    mutationType {
      fields {
        name
        description
        args {
          name
          description
        }
      }
    }
  }
}
```

**Advantages:**

- Documentation is always in sync with code
- Interactive exploration via GraphiQL
- Type information is automatic
- No separate maintenance burden

### Enhanced Schema Descriptions

We add rich descriptions to our Pothos schema:

```typescript
// types/order.ts
builder.objectType("Order", {
  description: "A customer order containing one or more items",
  fields: (t) => ({
    orderNumber: t.exposeString("orderNumber", {
      description: "Unique order identifier (format: ORD-XXXXX-XXXXX)",
    }),
    status: t.expose("status", {
      type: OrderStatusEnum,
      description: "Current order status: PENDING, COMPLETED, or CANCELLED",
    }),
    totalCents: t.exposeInt("totalCents", {
      description:
        "Final order total in cents (subtotal - discount + shipping)",
    }),
  }),
});

// resolvers/mutations.ts
builder.mutationField("submitOrder", (t) =>
  t.field({
    type: OrderType,
    description: `
Submit an order for fulfillment.

## Business Rules
- Shipping cost must not exceed 15% of discounted subtotal
- Stock is reserved immediately using pessimistic locking
- Order number is generated automatically (ORD-XXXXX-XXXXX)

## Error Codes
- \`INSUFFICIENT_STOCK\`: Not enough inventory for requested items
- \`SHIPPING_TOO_EXPENSIVE\`: Shipping exceeds 15% threshold
- \`INVALID_COORDINATES\`: Latitude/longitude out of range
    `,
    args: {
      input: t.arg({ type: OrderInput, required: true }),
    },
    resolve: async (_, { input }) => {
      // ...
    },
  })
);
```

### What GraphQL Introspection Provides

| Feature             | GraphQL      | Traditional REST |
| ------------------- | ------------ | ---------------- |
| Type definitions    | ✅ Automatic | Manual OpenAPI   |
| Field descriptions  | ✅ In schema | Manual           |
| Input validation    | ✅ Built-in  | Manual           |
| Interactive testing | ✅ GraphiQL  | Swagger UI       |
| Always in sync      | ✅ Yes       | Often outdated   |

### What Requires Supplementary Docs

| Topic                         | Location                   |
| ----------------------------- | -------------------------- |
| Business rules (15% shipping) | ADRs + Schema descriptions |
| Architecture overview         | docs/ARCHITECTURE.md       |
| Setup instructions            | README.md                  |
| Authentication (if added)     | Dedicated security docs    |
| Rate limits                   | Operational docs           |
| Changelog                     | CHANGELOG.md               |

## Implementation

### 1. GraphiQL Configuration

```typescript
// graphql/yoga.ts
const yoga = createYoga({
  graphiql: {
    title: "ScreenCloud OMS API",
    defaultQuery: `
# Welcome to ScreenCloud Order Management API
# 
# Try these example queries:

# List all products
query Products {
  products {
    id
    name
    priceFormatted
  }
}

# Verify an order
mutation VerifyOrder {
  verifyOrder(input: {
    items: [{ productId: "xxx", quantity: 10 }]
    latitude: 51.5074
    longitude: -0.1278
  }) {
    isValid
    grandTotalFormatted
  }
}
    `,
  },
});
```

### 2. Schema Description Standards

Every type, field, and argument should have:

- **Description:** What it represents
- **Format:** For special formats (dates, IDs, money)
- **Constraints:** Valid ranges, required conditions
- **Examples:** Where helpful

### 3. Business Rules Documentation

Documented in both:

- Schema descriptions (developer-facing)
- ADR documents (decision context)

```typescript
// Example: Shipping validity in schema
shippingValidity: t.field({
  type: ShippingValidityType,
  description: `
Shipping cost validation result.

The order is INVALID if:
  shippingCost > 15% × (subtotal - discount)

This prevents unprofitable orders where shipping
exceeds reasonable margins.
  `,
});
```

## Consequences

### Positive

- ✅ Documentation always matches implementation
- ✅ No separate tooling to maintain
- ✅ Interactive API exploration
- ✅ Type safety extends to documentation
- ✅ Lower maintenance burden

### Negative

- ⚠️ Business stakeholders may prefer formatted docs
- ⚠️ No offline documentation without running server
- ⚠️ Cannot document non-API concepts (deployment, ops)

### Mitigation

- Generate static schema.graphql for offline reference
- Maintain ADRs for architectural decisions
- README.md for quick start guide

## Alternatives Considered

### 1. OpenAPI/Swagger Generation (Rejected)

- **Pros:** Familiar to REST developers, wide tool support
- **Cons:** Lossy translation, additional maintenance

### 2. Docusaurus/GitBook (Deferred)

- **Pros:** Beautiful docs, versioning, search
- **Cons:** Separate maintenance, sync issues
- **Decision:** Can add later if needed for enterprise customers

### 3. GraphQL Voyager (Nice to Have)

- **Pros:** Visual schema explorer
- **Cons:** Additional dependency
- **Decision:** Easy to add later

## Documentation Checklist

For each GraphQL type/field:

- [ ] Clear description (what, not how)
- [ ] Input constraints documented
- [ ] Error conditions listed
- [ ] Examples for complex inputs
- [ ] Business rules referenced

## References

- [GraphQL Best Practices - Documentation](https://graphql.org/learn/best-practices/#documentation)
- [Pothos Schema Builder](https://pothos-graphql.dev/docs/api/schema-builder)
- [GraphiQL IDE](https://github.com/graphql/graphiql)
- [ADR Process](https://adr.github.io/)

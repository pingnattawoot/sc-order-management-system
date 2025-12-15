# ADR-004: Decimal.js for Money Calculations

## Status
**Accepted**

## Date
2025-12-15

## Context

The Order Management System handles financial calculations:
- Product pricing ($150 per unit)
- Volume discounts (5%, 10%, 15%, 20%)
- Shipping costs ($0.01 per kg per km)
- Total order amounts

JavaScript's native `Number` type uses IEEE 754 floating-point representation, which can lead to precision errors:

```javascript
0.1 + 0.2 // = 0.30000000000000004
150 * 0.05 // = 7.500000000000001
```

These errors are unacceptable for financial calculations.

## Decision

We will use **Decimal.js** for all monetary and distance calculations.

Additionally:
- Store all monetary values as **integers in cents** in the database
- Convert to display format only at the API/UI boundary
- Use Decimal.js for intermediate calculations

## Rationale

### Why Decimal.js?

1. **Arbitrary Precision**
   ```typescript
   import Decimal from 'decimal.js';
   
   new Decimal(0.1).plus(0.2).toString(); // "0.3"
   new Decimal(150).times(0.05).toString(); // "7.5"
   ```

2. **Rounding Control**
   ```typescript
   Decimal.set({ rounding: Decimal.ROUND_HALF_UP });
   new Decimal(7.555).toDecimalPlaces(2); // "7.56"
   ```

3. **Comparison Operations**
   ```typescript
   const shipping = new Decimal(shippingCost);
   const maxAllowed = orderTotal.times(0.15);
   
   if (shipping.greaterThan(maxAllowed)) {
     throw new InvalidOrderError();
   }
   ```

4. **Chainable API**
   ```typescript
   const total = new Decimal(unitPrice)
     .times(quantity)
     .minus(discount)
     .plus(shipping)
     .toNumber();
   ```

5. **Immutable**
   - Operations return new Decimal instances
   - No mutation bugs

### Storage Strategy: Cents as Integers

```prisma
model Order {
  subtotalCents   Int  // 15000 = $150.00
  discountCents   Int  // 750 = $7.50
  shippingCents   Int  // 1234 = $12.34
  totalCents      Int  // 15484 = $154.84
}
```

**Why integers?**
1. Integers have no precision loss in databases
2. Comparisons and additions are exact
3. Common practice in financial systems (Stripe uses cents)
4. Avoids decimal point confusion

### Calculation Example

```typescript
import Decimal from 'decimal.js';

function calculateOrderTotal(quantity: number, distanceKm: number) {
  const UNIT_PRICE_CENTS = 15000; // $150.00
  const WEIGHT_GRAMS = 365;
  const SHIPPING_RATE = 0.01; // $0.01 per kg per km
  
  // Subtotal in cents
  const subtotal = new Decimal(UNIT_PRICE_CENTS).times(quantity);
  
  // Calculate discount
  const discountPercent = getDiscountPercent(quantity);
  const discount = subtotal.times(discountPercent).dividedBy(100);
  
  // Calculate shipping in cents
  // Formula: distance * weight_kg * rate * quantity * 100 (to cents)
  const shipping = new Decimal(distanceKm)
    .times(WEIGHT_GRAMS)
    .dividedBy(1000) // to kg
    .times(SHIPPING_RATE)
    .times(quantity)
    .times(100); // to cents
  
  const total = subtotal.minus(discount).plus(shipping);
  
  return {
    subtotalCents: subtotal.round().toNumber(),
    discountCents: discount.round().toNumber(),
    shippingCents: shipping.round().toNumber(),
    totalCents: total.round().toNumber()
  };
}
```

### Haversine Precision

For distance calculations, Decimal.js ensures accuracy:

```typescript
function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): Decimal {
  const R = new Decimal(6371); // Earth's radius in km
  
  const dLat = toRadians(new Decimal(lat2).minus(lat1));
  const dLon = toRadians(new Decimal(lon2).minus(lon1));
  
  // a = sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlon/2)
  const a = Decimal.sin(dLat.dividedBy(2)).pow(2)
    .plus(
      Decimal.cos(toRadians(new Decimal(lat1)))
        .times(Decimal.cos(toRadians(new Decimal(lat2))))
        .times(Decimal.sin(dLon.dividedBy(2)).pow(2))
    );
  
  // c = 2 * atan2(√a, √(1−a))
  const c = new Decimal(2).times(
    Decimal.atan2(a.sqrt(), new Decimal(1).minus(a).sqrt())
  );
  
  return R.times(c);
}
```

## Consequences

### Positive
- Eliminates floating-point precision bugs
- Consistent rounding behavior
- Clear money handling throughout codebase
- Industry-standard approach

### Negative
- Slightly more verbose code
- Small performance overhead (negligible for this use case)
- Need to convert at boundaries (API inputs/outputs)

### API Response Format

Return formatted values for display:
```json
{
  "subtotal": "$1,500.00",
  "subtotalCents": 150000,
  "discount": "$150.00",
  "discountCents": 15000,
  "shipping": "$45.67",
  "shippingCents": 4567,
  "total": "$1,395.67",
  "totalCents": 139567
}
```

## Alternatives Considered

1. **Native JavaScript Number**
   - Rejected due to precision issues
   - Unacceptable for financial calculations

2. **dinero.js**
   - Also excellent for money handling
   - More opinionated API
   - Less flexibility for distance calculations

3. **big.js**
   - Simpler than Decimal.js
   - Lacks trigonometric functions (needed for Haversine)

4. **bignumber.js**
   - Similar to Decimal.js
   - Decimal.js has more features (trig functions)

## References
- [Decimal.js Documentation](https://mikemcl.github.io/decimal.js/)
- [What Every Programmer Should Know About Floating-Point Arithmetic](https://floating-point-gui.de/)
- [Stripe API uses cents](https://stripe.com/docs/api/charges)


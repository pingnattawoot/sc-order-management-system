# ADR-003: Greedy Algorithm for Warehouse Selection

## Status
**Accepted**

## Date
2025-12-15

## Context

The Order Management System must determine how to fulfill orders from multiple warehouses while minimizing shipping costs. The challenge states:

> "A single order can be shipped from multiple warehouses... However, we always want the cost to be as low as possible."

The shipping cost formula is:
```
Shipping Cost = Distance (km) × Weight (kg) × $0.01 × Quantity
```

Key constraints:
- All products have the same weight (365g)
- Multiple warehouses may need to contribute to a single order
- Total stock across all warehouses may or may not be sufficient

## Decision

We will use a **Greedy Algorithm** that:
1. Calculates distance from each warehouse to the customer
2. Sorts warehouses by distance (ascending)
3. Allocates units from the nearest warehouse first
4. Continues to the next nearest warehouse until order is fulfilled

## Rationale

### Why Greedy Works Here

Since all units have **identical weight**, the shipping cost per unit from a warehouse is solely determined by distance:

```
Cost per unit = Distance × 0.365 kg × $0.01
```

This means:
- **Nearest warehouse always has lowest per-unit cost**
- There's no benefit to shipping from a farther warehouse
- The greedy approach is **optimal**, not just approximate

### Mathematical Proof

Given warehouses W1, W2, W3 with distances D1 < D2 < D3:
- Cost from W1: D1 × 0.365 × 0.01 × quantity
- Cost from W2: D2 × 0.365 × 0.01 × quantity
- Cost from W3: D3 × 0.365 × 0.01 × quantity

Total cost is minimized when we maximize allocation to W1, then W2, then W3.

This is exactly what the greedy algorithm does.

### Algorithm Pseudocode

```typescript
function optimizeShipments(customerLat, customerLong, quantity) {
  // 1. Get warehouses with stock
  const warehouses = await getWarehousesWithStock();
  
  // 2. Calculate distances and sort
  const sorted = warehouses
    .map(w => ({
      ...w,
      distance: haversine(w.lat, w.long, customerLat, customerLong)
    }))
    .sort((a, b) => a.distance - b.distance);
  
  // 3. Greedy allocation
  let remaining = quantity;
  const shipments = [];
  
  for (const warehouse of sorted) {
    if (remaining <= 0) break;
    
    const allocate = Math.min(remaining, warehouse.stock);
    if (allocate > 0) {
      shipments.push({
        warehouseId: warehouse.id,
        quantity: allocate,
        distance: warehouse.distance,
        cost: calculateShippingCost(warehouse.distance, 365, allocate)
      });
      remaining -= allocate;
    }
  }
  
  // 4. Check if fulfilled
  if (remaining > 0) {
    throw new InsufficientStockError(quantity - remaining, quantity);
  }
  
  return shipments;
}
```

### Time Complexity

- Fetching warehouses: O(W) where W = number of warehouses
- Distance calculation: O(W)
- Sorting: O(W log W)
- Allocation: O(W)
- **Total: O(W log W)**

For 6 warehouses, this is trivially fast. Even with 1000 warehouses, it would be sub-millisecond.

## Consequences

### Positive
- Simple to implement and understand
- Provably optimal for uniform-weight products
- Fast execution time
- Easy to explain to stakeholders

### Negative
- Would need revision for multi-product orders with different weights
- Doesn't consider warehouse shipping capacity limits
- Doesn't optimize for consolidation (multiple orders to same region)

### Future Considerations

If requirements change, we might need:

1. **Multi-Product Optimization**
   - If products have different weights, the problem becomes a variant of the Transportation Problem
   - May need Linear Programming or more sophisticated algorithms

2. **Batch Optimization**
   - Consolidating multiple orders to reduce total shipments
   - This is a separate optimization layer

3. **Lead Time Considerations**
   - Some warehouses might ship faster
   - Could add secondary sorting by delivery time

## Alternatives Considered

1. **Linear Programming (Simplex)**
   - Overkill for single-weight products
   - Would be necessary for complex constraints

2. **Dynamic Programming**
   - Not applicable - no overlapping subproblems

3. **Random/Weighted Sampling**
   - Would not minimize costs
   - No advantage over deterministic approach

4. **Distribute Evenly**
   - Simple but definitely not optimal
   - Would always be more expensive

## References
- [Greedy Algorithms - Introduction to Algorithms (CLRS)](https://mitpress.mit.edu/books/introduction-algorithms-third-edition)
- [Transportation Problem](https://en.wikipedia.org/wiki/Transportation_theory_(mathematics))


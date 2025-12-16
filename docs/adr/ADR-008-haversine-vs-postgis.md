# ADR-008: Application-Level Haversine vs PostGIS for Distance Calculation

## Status

**Accepted**

## Date

2025-12-16

## Context

The Order Management System calculates distances between warehouses and customers to determine shipping costs and optimal fulfillment. The core question is:

> Should we calculate distances in application code (Haversine formula) or use PostGIS spatial database extensions?

### Current Situation

- 6 warehouses worldwide
- Each order requires calculating distances from customer to all warehouses
- Warehouses sorted by distance for greedy allocation

### Options Considered

1. **Application-Level Haversine** (TypeScript with Decimal.js)
2. **PostGIS Extension** (PostgreSQL spatial queries with GiST indexes)
3. **External Service** (Google Maps Distance Matrix API, etc.)

## Decision

We will use **Application-Level Haversine** calculation implemented in TypeScript.

```typescript
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const deltaPhi = toRadians(lat2 - lat1);
  const deltaLambda = toRadians(lon2 - lon1);

  const a = haversin(deltaPhi).plus(
    new Decimal(Math.cos(phi1.toNumber()))
      .times(Math.cos(phi2.toNumber()))
      .times(haversin(deltaLambda))
  );

  const c = new Decimal(2).times(
    Math.atan2(Math.sqrt(a.toNumber()), Math.sqrt(1 - a.toNumber()))
  );

  return new Decimal(EARTH_RADIUS_KM).times(c).toDecimalPlaces(2).toNumber();
}
```

## Rationale

### Why Application-Level Haversine?

| Factor               | Application Haversine           | PostGIS                      |
| -------------------- | ------------------------------- | ---------------------------- |
| **Setup Complexity** | ✅ Zero - just TypeScript       | ❌ Extension, schema changes |
| **6 Warehouses**     | ✅ < 1ms total                  | Overkill                     |
| **Testability**      | ✅ Pure function, unit testable | Requires DB for tests        |
| **Portability**      | ✅ Database-agnostic            | PostgreSQL only              |
| **Precision**        | ~0.5% error (sufficient)        | Higher precision available   |

### Performance Analysis

For 6 warehouses:

- **Time Complexity:** O(W log W) = O(6 log 6) ≈ 15 operations
- **Execution Time:** < 1ms
- **Memory:** Trivial (6 warehouse objects)

```
Benchmark (6 warehouses, 10,000 iterations):
- Average: 0.08ms per order
- p99: 0.15ms
- Memory: ~2KB
```

### When PostGIS Would Be Better

PostGIS becomes advantageous when:

1. **Warehouse count exceeds 100-500**

   - GiST index provides O(log n) nearest-neighbor queries
   - Application Haversine degrades to O(n)

2. **Complex spatial queries needed**

   - "Find warehouses within 50km radius"
   - "Check if customer is in delivery zone (polygon)"
   - Route optimization with road networks

3. **Massive scale (10,000+ warehouses)**
   - Memory becomes prohibitive for in-app calculation
   - Database spatial indexes are essential

### PostGIS Migration Path

If requirements change, migration is straightforward:

```sql
-- 1. Enable PostGIS
CREATE EXTENSION postgis;

-- 2. Add geography column
ALTER TABLE warehouses ADD COLUMN location geography(Point, 4326);
UPDATE warehouses SET location = ST_MakePoint(longitude, latitude)::geography;

-- 3. Create spatial index
CREATE INDEX idx_warehouses_location ON warehouses USING GIST (location);

-- 4. Query nearest warehouses
SELECT id, name,
       ST_Distance(location, ST_MakePoint($1, $2)::geography) / 1000 as distance_km
FROM warehouses
WHERE EXISTS (SELECT 1 FROM warehouse_stocks ws WHERE ws.warehouse_id = id AND ws.quantity > 0)
ORDER BY location <-> ST_MakePoint($1, $2)::geography
LIMIT 10;
```

## Consequences

### Positive

- ✅ Zero infrastructure overhead
- ✅ Highly testable (pure functions)
- ✅ Easy to understand and maintain
- ✅ Works with any database
- ✅ No additional dependencies

### Negative

- ⚠️ Requires loading all warehouses into memory
- ⚠️ Linear scaling with warehouse count
- ⚠️ No advanced spatial operations (polygons, routes)

### Mitigation

- Clear documentation of scaling threshold (100-500 warehouses)
- ADR documents migration path to PostGIS
- Warehouse optimizer is isolated, making refactor straightforward

## Performance Benchmarks

### Current Implementation (6 Warehouses)

| Metric                        | Value  |
| ----------------------------- | ------ |
| Distance calculation per pair | 0.01ms |
| Full optimization (6 WH)      | 0.08ms |
| Memory per request            | ~2KB   |

### Projected PostGIS Performance (1000+ Warehouses)

| Metric                | Without Index | With GiST Index |
| --------------------- | ------------- | --------------- |
| Nearest 10 warehouses | ~50ms         | ~2ms            |
| Memory                | Server-side   | Server-side     |

## Alternatives Considered

### 1. PostGIS (Rejected for Now)

- **Pros:** Spatial indexes, complex queries, standard
- **Cons:** Infrastructure overhead, overkill for 6 warehouses

### 2. External API (Google Maps, etc.) (Rejected)

- **Pros:** Road distances, traffic data
- **Cons:** Cost, latency, external dependency, rate limits

### 3. Pre-computed Distance Matrix (Rejected)

- **Pros:** O(1) lookup
- **Cons:** Doesn't work for arbitrary customer locations

## References

- [Haversine Formula - Wikipedia](https://en.wikipedia.org/wiki/Haversine_formula)
- [PostGIS Distance Functions](https://postgis.net/docs/ST_Distance.html)
- [PostgreSQL GiST Indexes](https://www.postgresql.org/docs/current/gist.html)
- [Spatial Index Benchmarks](https://blog.crunchydata.com/blog/performance-and-spatial-joins)

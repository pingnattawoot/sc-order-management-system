/**
 * Warehouse Optimizer Tests
 *
 * Tests for the greedy warehouse allocation algorithm.
 */

import { describe, it, expect } from 'vitest';
import { WarehouseOptimizer, WarehouseData } from '../warehouse-optimizer.js';
import { LOCATIONS } from '../../../__tests__/helpers/index.js';

// Standard product weight
const WEIGHT_GRAMS = 365;

// Create test warehouses with UK locations
function createUKWarehouses(): WarehouseData[] {
  return [
    {
      id: 'wh_london',
      name: 'London',
      latitude: 51.5074,
      longitude: -0.1278,
      stock: 100,
      weightGrams: WEIGHT_GRAMS,
    },
    {
      id: 'wh_manchester',
      name: 'Manchester',
      latitude: 53.4808,
      longitude: -2.2426,
      stock: 200,
      weightGrams: WEIGHT_GRAMS,
    },
    {
      id: 'wh_edinburgh',
      name: 'Edinburgh',
      latitude: 55.9533,
      longitude: -3.1883,
      stock: 150,
      weightGrams: WEIGHT_GRAMS,
    },
  ];
}

describe('WarehouseOptimizer', () => {
  let optimizer: WarehouseOptimizer;

  beforeEach(() => {
    optimizer = new WarehouseOptimizer();
  });

  describe('findOptimalShipments', () => {
    describe('single warehouse fulfillment', () => {
      it('should fulfill order from nearest warehouse when it has enough stock', () => {
        const warehouses = createUKWarehouses();
        // Customer in London - London warehouse is nearest
        const result = optimizer.findOptimalShipments(
          LOCATIONS.london.latitude,
          LOCATIONS.london.longitude,
          50, // 50 units
          warehouses
        );

        expect(result.canFulfill).toBe(true);
        expect(result.requestedQuantity).toBe(50);
        expect(result.fulfilledQuantity).toBe(50);
        expect(result.shortageQuantity).toBe(0);
        expect(result.shipments).toHaveLength(1);
        expect(result.shipments[0]!.warehouseId).toBe('wh_london');
        expect(result.shipments[0]!.quantity).toBe(50);
      });

      it('should select nearest warehouse for customer location', () => {
        const warehouses = createUKWarehouses();
        // Customer near Edinburgh
        const result = optimizer.findOptimalShipments(
          55.9, // Near Edinburgh
          -3.2,
          50,
          warehouses
        );

        expect(result.shipments).toHaveLength(1);
        expect(result.shipments[0]!.warehouseId).toBe('wh_edinburgh');
      });
    });

    describe('multi-warehouse split', () => {
      it('should split order across warehouses when nearest has insufficient stock', () => {
        const warehouses = createUKWarehouses();
        // Request more than London's stock (100)
        const result = optimizer.findOptimalShipments(
          LOCATIONS.london.latitude,
          LOCATIONS.london.longitude,
          150, // More than London's 100
          warehouses
        );

        expect(result.canFulfill).toBe(true);
        expect(result.fulfilledQuantity).toBe(150);
        expect(result.shipments.length).toBeGreaterThan(1);

        // First shipment should be from London (all 100)
        expect(result.shipments[0]!.warehouseId).toBe('wh_london');
        expect(result.shipments[0]!.quantity).toBe(100);

        // Second shipment should be from next nearest (Manchester: 50)
        expect(result.shipments[1]!.warehouseId).toBe('wh_manchester');
        expect(result.shipments[1]!.quantity).toBe(50);
      });

      it('should use all warehouses if needed for large order', () => {
        const warehouses = createUKWarehouses();
        // Total stock: 100 + 200 + 150 = 450
        const result = optimizer.findOptimalShipments(
          LOCATIONS.london.latitude,
          LOCATIONS.london.longitude,
          400,
          warehouses
        );

        expect(result.canFulfill).toBe(true);
        expect(result.fulfilledQuantity).toBe(400);
        expect(result.shipments).toHaveLength(3);
      });
    });

    describe('insufficient stock', () => {
      it('should return partial fulfillment when stock is insufficient', () => {
        const warehouses = createUKWarehouses();
        // Total stock: 450, requesting 500
        const result = optimizer.findOptimalShipments(
          LOCATIONS.london.latitude,
          LOCATIONS.london.longitude,
          500,
          warehouses
        );

        expect(result.canFulfill).toBe(false);
        expect(result.requestedQuantity).toBe(500);
        expect(result.fulfilledQuantity).toBe(450);
        expect(result.shortageQuantity).toBe(50);
      });

      it('should handle zero stock warehouses', () => {
        const warehouses: WarehouseData[] = [
          {
            id: 'wh_empty',
            name: 'Empty Warehouse',
            latitude: 51.5074,
            longitude: -0.1278,
            stock: 0,
            weightGrams: WEIGHT_GRAMS,
          },
        ];

        const result = optimizer.findOptimalShipments(51.5, -0.1, 10, warehouses);

        expect(result.canFulfill).toBe(false);
        expect(result.fulfilledQuantity).toBe(0);
        expect(result.shortageQuantity).toBe(10);
        expect(result.shipments).toHaveLength(0);
      });

      it('should handle empty warehouse list', () => {
        const result = optimizer.findOptimalShipments(51.5, -0.1, 10, []);

        expect(result.canFulfill).toBe(false);
        expect(result.fulfilledQuantity).toBe(0);
        expect(result.shipments).toHaveLength(0);
      });
    });

    describe('shipping cost calculation', () => {
      it('should calculate total shipping cost across all shipments', () => {
        const warehouses = createUKWarehouses();
        // Use a customer location that's not exactly at a warehouse
        const result = optimizer.findOptimalShipments(
          51.45, // Brixton, South London (~6km from central London)
          -0.11,
          50,
          warehouses
        );

        // Verify shipping cost is calculated
        expect(result.totalShippingCostCents).toBeGreaterThan(0);

        // Verify individual shipment has shipping cost
        expect(result.shipments[0]!.shippingCostCents).toBeGreaterThan(0);
      });

      it('should sum shipping costs from multiple warehouses', () => {
        const warehouses = createUKWarehouses();
        const result = optimizer.findOptimalShipments(
          LOCATIONS.london.latitude,
          LOCATIONS.london.longitude,
          150, // Will split between London and Manchester
          warehouses
        );

        const sumOfShipments = result.shipments.reduce(
          (sum, s) => sum + s.shippingCostCents,
          0
        );

        expect(result.totalShippingCostCents).toBe(sumOfShipments);
      });
    });

    describe('distance calculation', () => {
      it('should calculate correct distances', () => {
        const warehouses = createUKWarehouses();
        const result = optimizer.findOptimalShipments(
          LOCATIONS.london.latitude,
          LOCATIONS.london.longitude,
          450, // All warehouses
          warehouses
        );

        // London warehouse should have very small distance
        const londonShipment = result.shipments.find(
          (s) => s.warehouseId === 'wh_london'
        );
        expect(londonShipment!.distanceKm).toBeLessThan(5);

        // Manchester should be ~260km from London
        const manchesterShipment = result.shipments.find(
          (s) => s.warehouseId === 'wh_manchester'
        );
        expect(manchesterShipment!.distanceKm).toBeGreaterThan(200);
        expect(manchesterShipment!.distanceKm).toBeLessThan(350);
      });

      it('should calculate weighted average distance', () => {
        const warehouses = createUKWarehouses();
        const result = optimizer.findOptimalShipments(
          LOCATIONS.london.latitude,
          LOCATIONS.london.longitude,
          150,
          warehouses
        );

        // 100 from London (0km) + 50 from Manchester (~260km)
        // Weighted average: (100*0 + 50*260) / 150 ≈ 87km
        expect(result.averageDistanceKm).toBeGreaterThan(50);
        expect(result.averageDistanceKm).toBeLessThan(150);
      });
    });

    describe('nearest-first selection', () => {
      it('should always prefer nearer warehouses', () => {
        const warehouses: WarehouseData[] = [
          {
            id: 'wh_far',
            name: 'Far Warehouse',
            latitude: 0,
            longitude: 0, // Very far from London
            stock: 1000,
            weightGrams: WEIGHT_GRAMS,
          },
          {
            id: 'wh_near',
            name: 'Near Warehouse',
            latitude: 51.5074,
            longitude: -0.1278, // Same as London
            stock: 50,
            weightGrams: WEIGHT_GRAMS,
          },
        ];

        const result = optimizer.findOptimalShipments(
          LOCATIONS.london.latitude,
          LOCATIONS.london.longitude,
          100,
          warehouses
        );

        // Should use near warehouse first (50), then far warehouse (50)
        expect(result.shipments[0]!.warehouseId).toBe('wh_near');
        expect(result.shipments[0]!.quantity).toBe(50);
        expect(result.shipments[1]!.warehouseId).toBe('wh_far');
        expect(result.shipments[1]!.quantity).toBe(50);
      });
    });
  });

  describe('getTotalStock', () => {
    it('should sum stock across all warehouses', () => {
      const warehouses = createUKWarehouses();
      expect(optimizer.getTotalStock(warehouses)).toBe(450);
    });

    it('should return 0 for empty list', () => {
      expect(optimizer.getTotalStock([])).toBe(0);
    });
  });

  describe('canFulfillOrder', () => {
    it('should return true when stock is sufficient', () => {
      const warehouses = createUKWarehouses();
      expect(optimizer.canFulfillOrder(400, warehouses)).toBe(true);
    });

    it('should return true when stock equals quantity', () => {
      const warehouses = createUKWarehouses();
      expect(optimizer.canFulfillOrder(450, warehouses)).toBe(true);
    });

    it('should return false when stock is insufficient', () => {
      const warehouses = createUKWarehouses();
      expect(optimizer.canFulfillOrder(451, warehouses)).toBe(false);
    });
  });
});


/**
 * Warehouse Optimizer
 *
 * Implements a greedy algorithm to select the optimal warehouses for fulfillment.
 * Allocates stock from the nearest warehouse first, then moves to the next nearest.
 *
 * Algorithm:
 * 1. Calculate distance from each warehouse to customer
 * 2. Sort warehouses by distance (ascending)
 * 3. Greedily allocate stock from nearest warehouse first
 * 4. Continue until order is fully fulfilled or stock is exhausted
 */

import { calculateDistanceKm } from '../../lib/haversine.js';
import { calculateShippingCost } from '../pricing/shipping.js';

/**
 * Warehouse data for optimization
 */
export interface WarehouseData {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  stock: number;
  weightGrams: number; // Weight per unit
}

/**
 * Individual shipment allocation from a warehouse
 */
export interface ShipmentAllocation {
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  distanceKm: number;
  shippingCostCents: number;
}

/**
 * Result of warehouse optimization
 */
export interface OptimizationResult {
  /** Whether the order can be fully fulfilled */
  canFulfill: boolean;
  /** Total quantity requested */
  requestedQuantity: number;
  /** Total quantity that can be fulfilled */
  fulfilledQuantity: number;
  /** Shortage if not enough stock */
  shortageQuantity: number;
  /** Shipment allocations from each warehouse */
  shipments: ShipmentAllocation[];
  /** Total shipping cost across all shipments */
  totalShippingCostCents: number;
  /** Weighted average distance */
  averageDistanceKm: number;
}

/**
 * Internal type for warehouse with calculated distance
 */
interface WarehouseWithDistance extends WarehouseData {
  distanceKm: number;
}

/**
 * Warehouse Optimizer using Greedy Algorithm
 *
 * Selects warehouses in order of proximity to minimize shipping costs.
 */
export class WarehouseOptimizer {
  /**
   * Find optimal shipment allocation for an order
   *
   * @param customerLat - Customer latitude
   * @param customerLon - Customer longitude
   * @param quantity - Number of units requested
   * @param warehouses - Available warehouses with stock
   * @returns Optimization result with shipment allocations
   *
   * @example
   * ```ts
   * const optimizer = new WarehouseOptimizer();
   * const result = optimizer.findOptimalShipments(
   *   51.5074, -0.1278, // London customer
   *   100, // 100 units
   *   warehouses
   * );
   * ```
   */
  findOptimalShipments(
    customerLat: number,
    customerLon: number,
    quantity: number,
    warehouses: WarehouseData[]
  ): OptimizationResult {
    // Calculate distance from each warehouse to customer
    const warehousesWithDistance: WarehouseWithDistance[] = warehouses.map((wh) => ({
      ...wh,
      distanceKm: calculateDistanceKm(wh.latitude, wh.longitude, customerLat, customerLon),
    }));

    // Sort by distance (ascending) - nearest first
    const sortedWarehouses = warehousesWithDistance.sort(
      (a, b) => a.distanceKm - b.distanceKm
    );

    // Greedy allocation
    const shipments: ShipmentAllocation[] = [];
    let remainingQuantity = quantity;
    let totalShippingCost = 0;

    for (const warehouse of sortedWarehouses) {
      if (remainingQuantity <= 0) {
        break;
      }

      if (warehouse.stock <= 0) {
        continue;
      }

      // Allocate as much as possible from this warehouse
      const allocatedQuantity = Math.min(warehouse.stock, remainingQuantity);

      // Calculate shipping cost for this shipment
      const shippingResult = calculateShippingCost(
        warehouse.distanceKm,
        warehouse.weightGrams,
        allocatedQuantity
      );

      shipments.push({
        warehouseId: warehouse.id,
        warehouseName: warehouse.name,
        quantity: allocatedQuantity,
        distanceKm: warehouse.distanceKm,
        shippingCostCents: shippingResult.shippingCostCents,
      });

      totalShippingCost += shippingResult.shippingCostCents;
      remainingQuantity -= allocatedQuantity;
    }

    const fulfilledQuantity = quantity - remainingQuantity;
    const shortageQuantity = remainingQuantity;

    // Calculate weighted average distance
    const averageDistanceKm =
      fulfilledQuantity > 0
        ? shipments.reduce((sum, s) => sum + s.distanceKm * s.quantity, 0) / fulfilledQuantity
        : 0;

    return {
      canFulfill: remainingQuantity === 0,
      requestedQuantity: quantity,
      fulfilledQuantity,
      shortageQuantity,
      shipments,
      totalShippingCostCents: totalShippingCost,
      averageDistanceKm: Math.round(averageDistanceKm * 100) / 100, // Round to 2 decimals
    };
  }

  /**
   * Calculate total available stock across all warehouses
   *
   * @param warehouses - List of warehouses
   * @returns Total stock available
   */
  getTotalStock(warehouses: WarehouseData[]): number {
    return warehouses.reduce((sum, wh) => sum + wh.stock, 0);
  }

  /**
   * Check if an order can be fulfilled
   *
   * @param quantity - Requested quantity
   * @param warehouses - Available warehouses
   * @returns True if total stock is sufficient
   */
  canFulfillOrder(quantity: number, warehouses: WarehouseData[]): boolean {
    return this.getTotalStock(warehouses) >= quantity;
  }
}

/**
 * Singleton instance of the optimizer
 */
export const warehouseOptimizer = new WarehouseOptimizer();


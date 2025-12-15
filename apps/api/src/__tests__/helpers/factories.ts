/**
 * Test Factories
 *
 * Factory functions for creating test data with sensible defaults.
 */

import { nanoid } from 'nanoid';

/**
 * Product factory
 */
export interface TestProduct {
  id: string;
  name: string;
  unitPriceCents: number;
  weightGrams: number;
  createdAt: Date;
  updatedAt: Date;
}

export function createTestProduct(overrides: Partial<TestProduct> = {}): TestProduct {
  return {
    id: `prod_${nanoid(10)}`,
    name: 'SCOS P1 Pro Test',
    unitPriceCents: 15000, // $150.00
    weightGrams: 365,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Warehouse factory
 */
export interface TestWarehouse {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

export function createTestWarehouse(overrides: Partial<TestWarehouse> = {}): TestWarehouse {
  return {
    id: `wh_${nanoid(10)}`,
    name: 'Test Warehouse',
    latitude: 51.5074, // London default
    longitude: -0.1278,
    stock: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create multiple warehouses with varied locations
 */
export function createTestWarehouses(): TestWarehouse[] {
  return [
    createTestWarehouse({
      id: 'wh_london',
      name: 'London',
      latitude: 51.5074,
      longitude: -0.1278,
      stock: 100,
    }),
    createTestWarehouse({
      id: 'wh_manchester',
      name: 'Manchester',
      latitude: 53.4808,
      longitude: -2.2426,
      stock: 200,
    }),
    createTestWarehouse({
      id: 'wh_edinburgh',
      name: 'Edinburgh',
      latitude: 55.9533,
      longitude: -3.1883,
      stock: 150,
    }),
  ];
}

/**
 * Coordinate factory
 */
export interface TestCoordinate {
  latitude: number;
  longitude: number;
  name?: string;
}

export function createTestCoordinate(overrides: Partial<TestCoordinate> = {}): TestCoordinate {
  return {
    latitude: 51.5074,
    longitude: -0.1278,
    name: 'London',
    ...overrides,
  };
}

/**
 * Well-known locations for testing
 */
export const LOCATIONS = {
  london: { latitude: 51.5074, longitude: -0.1278, name: 'London' },
  newYork: { latitude: 40.7128, longitude: -74.006, name: 'New York' },
  losAngeles: { latitude: 34.0522, longitude: -118.2437, name: 'Los Angeles' },
  paris: { latitude: 48.8566, longitude: 2.3522, name: 'Paris' },
  hongKong: { latitude: 22.3193, longitude: 114.1694, name: 'Hong Kong' },
  sydney: { latitude: -33.8688, longitude: 151.2093, name: 'Sydney' },
  tokyo: { latitude: 35.6762, longitude: 139.6503, name: 'Tokyo' },
  singapore: { latitude: 1.3521, longitude: 103.8198, name: 'Singapore' },
} as const;

/**
 * Order factory
 */
export interface TestOrderInput {
  quantity: number;
  latitude: number;
  longitude: number;
}

export function createTestOrderInput(overrides: Partial<TestOrderInput> = {}): TestOrderInput {
  return {
    quantity: 10,
    latitude: 51.5074,
    longitude: -0.1278,
    ...overrides,
  };
}


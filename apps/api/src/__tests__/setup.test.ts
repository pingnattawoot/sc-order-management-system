/**
 * Test Setup Verification
 *
 * Simple tests to verify the testing framework is working correctly.
 */

import { describe, it, expect } from 'vitest';
import { createTestProduct, createTestWarehouse, LOCATIONS } from './helpers/index.js';
import { expectCloseTo, expectValidId } from './helpers/index.js';

describe('Test Setup', () => {
  it('should have globals available', () => {
    expect(true).toBe(true);
  });

  it('should support async tests', async () => {
    const result = await Promise.resolve(42);
    expect(result).toBe(42);
  });
});

describe('Test Factories', () => {
  it('should create test product with defaults', () => {
    const product = createTestProduct();

    expect(product.name).toBe('SCOS P1 Pro Test');
    expect(product.unitPriceCents).toBe(15000);
    expect(product.weightGrams).toBe(365);
    expectValidId(product.id, 'prod_');
  });

  it('should create test product with overrides', () => {
    const product = createTestProduct({
      name: 'Custom Product',
      unitPriceCents: 20000,
    });

    expect(product.name).toBe('Custom Product');
    expect(product.unitPriceCents).toBe(20000);
    expect(product.weightGrams).toBe(365); // default preserved
  });

  it('should create test warehouse with defaults', () => {
    const warehouse = createTestWarehouse();

    expect(warehouse.name).toBe('Test Warehouse');
    expect(warehouse.stock).toBe(100);
    expectValidId(warehouse.id, 'wh_');
  });

  it('should have well-known locations', () => {
    expect(LOCATIONS.london.latitude).toBeCloseTo(51.5074, 2);
    expect(LOCATIONS.newYork.latitude).toBeCloseTo(40.7128, 2);
    expect(LOCATIONS.losAngeles.latitude).toBeCloseTo(34.0522, 2);
  });
});

describe('Test Assertions', () => {
  it('should verify closeTo assertion', () => {
    expectCloseTo(3.14159, 3.14, 0.01);
    expectCloseTo(100.005, 100, 0.01);
  });

  it('should verify valid ID assertion', () => {
    expectValidId('prod_abc123', 'prod_');
    expectValidId('wh_xyz789', 'wh_');
  });
});


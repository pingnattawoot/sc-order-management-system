/**
 * Shipping Cost Tests
 *
 * Tests for shipping cost calculation and 15% validity rule.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateShippingCost,
  isShippingCostValid,
  calculateShippingPercentage,
  checkShippingValidity,
  MAX_SHIPPING_PERCENTAGE,
} from '../shipping.js';

describe('Shipping Cost', () => {
  describe('calculateShippingCost', () => {
    it('should calculate shipping for basic case', () => {
      // 100 km, 365g, 10 units
      // Formula: 100 × (365/1000) × 10 × 1 = 365 cents
      const result = calculateShippingCost(100, 365, 10);

      expect(result.shippingCostCents).toBe(365);
      expect(result.distanceKm).toBe(100);
      expect(result.weightGrams).toBe(365);
      expect(result.quantity).toBe(10);
    });

    it('should calculate shipping for longer distance', () => {
      // 500 km, 365g, 50 units
      // Formula: 500 × 0.365 × 50 × 1 = 9125 cents ($91.25)
      const result = calculateShippingCost(500, 365, 50);

      expect(result.shippingCostCents).toBe(9125);
    });

    it('should calculate shipping for single unit', () => {
      // 200 km, 365g, 1 unit
      // Formula: 200 × 0.365 × 1 × 1 = 73 cents
      const result = calculateShippingCost(200, 365, 1);

      expect(result.shippingCostCents).toBe(73);
    });

    it('should handle zero distance', () => {
      const result = calculateShippingCost(0, 365, 10);
      expect(result.shippingCostCents).toBe(0);
    });

    it('should handle different weight', () => {
      // 100 km, 1000g (1kg), 10 units
      // Formula: 100 × 1 × 10 × 1 = 1000 cents
      const result = calculateShippingCost(100, 1000, 10);

      expect(result.shippingCostCents).toBe(1000);
    });

    it('should handle large quantities', () => {
      // 300 km, 365g, 100 units
      // Formula: 300 × 0.365 × 100 × 1 = 10950 cents ($109.50)
      const result = calculateShippingCost(300, 365, 100);

      expect(result.shippingCostCents).toBe(10950);
    });

    it('should round to nearest cent', () => {
      // 333 km, 365g, 17 units
      // Formula: 333 × 0.365 × 17 × 1 = 2066.355 → 2066 cents
      const result = calculateShippingCost(333, 365, 17);

      expect(result.shippingCostCents).toBe(2066);
    });
  });

  describe('isShippingCostValid', () => {
    it('should return true when shipping is under 15%', () => {
      // Shipping: $100 (10000 cents)
      // Order: $1000 (100000 cents)
      // Percentage: 10% → valid
      expect(isShippingCostValid(10000, 100000)).toBe(true);
    });

    it('should return true when shipping is exactly 15%', () => {
      // Shipping: $150 (15000 cents)
      // Order: $1000 (100000 cents)
      // Percentage: 15% → valid (boundary)
      expect(isShippingCostValid(15000, 100000)).toBe(true);
    });

    it('should return false when shipping exceeds 15%', () => {
      // Shipping: $151 (15100 cents)
      // Order: $1000 (100000 cents)
      // Percentage: 15.1% → invalid
      expect(isShippingCostValid(15100, 100000)).toBe(false);
    });

    it('should return false when order amount is zero', () => {
      expect(isShippingCostValid(1000, 0)).toBe(false);
    });

    it('should return false when order amount is negative', () => {
      expect(isShippingCostValid(1000, -1000)).toBe(false);
    });

    it('should handle very small shipping relative to order', () => {
      // Shipping: $1 (100 cents)
      // Order: $10000 (1000000 cents)
      // Percentage: 0.01% → valid
      expect(isShippingCostValid(100, 1000000)).toBe(true);
    });

    it('should handle real-world scenario', () => {
      // 50 units at $150 = $7,500 - 10% = $6,750 (675000 cents)
      // Max shipping: $1,012.50 (101250 cents)
      expect(isShippingCostValid(101250, 675000)).toBe(true);
      expect(isShippingCostValid(101251, 675000)).toBe(false);
    });
  });

  describe('calculateShippingPercentage', () => {
    it('should calculate correct percentage', () => {
      // Shipping: $100, Order: $1000 → 10%
      expect(calculateShippingPercentage(10000, 100000)).toBe(10);
    });

    it('should handle decimal percentages', () => {
      // Shipping: $148, Order: $1000 → 14.8%
      expect(calculateShippingPercentage(14800, 100000)).toBe(14.8);
    });

    it('should return 100 for zero order amount', () => {
      expect(calculateShippingPercentage(1000, 0)).toBe(100);
    });

    it('should handle very small percentages', () => {
      // Shipping: $1, Order: $10000 → 0.01%
      expect(calculateShippingPercentage(100, 1000000)).toBe(0.01);
    });
  });

  describe('checkShippingValidity', () => {
    it('should return valid result with breakdown', () => {
      // Shipping: $100 (10000 cents)
      // Order: $1000 (100000 cents)
      const result = checkShippingValidity(10000, 100000);

      expect(result.isValid).toBe(true);
      expect(result.shippingCostCents).toBe(10000);
      expect(result.orderAmountCents).toBe(100000);
      expect(result.shippingPercentage).toBe(10);
      expect(result.maxAllowedShippingCents).toBe(15000); // 15% of 100000
      expect(result.overLimitCents).toBe(0);
    });

    it('should return invalid result with over-limit amount', () => {
      // Shipping: $200 (20000 cents)
      // Order: $1000 (100000 cents)
      // Over limit by $50 (5000 cents)
      const result = checkShippingValidity(20000, 100000);

      expect(result.isValid).toBe(false);
      expect(result.shippingPercentage).toBe(20);
      expect(result.maxAllowedShippingCents).toBe(15000);
      expect(result.overLimitCents).toBe(5000);
    });

    it('should handle boundary case exactly at 15%', () => {
      const result = checkShippingValidity(15000, 100000);

      expect(result.isValid).toBe(true);
      expect(result.shippingPercentage).toBe(15);
      expect(result.overLimitCents).toBe(0);
    });
  });

  describe('MAX_SHIPPING_PERCENTAGE constant', () => {
    it('should be 15', () => {
      expect(MAX_SHIPPING_PERCENTAGE).toBe(15);
    });
  });
});

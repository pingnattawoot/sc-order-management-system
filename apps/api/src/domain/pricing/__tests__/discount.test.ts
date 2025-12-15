/**
 * Volume Discount Tests
 *
 * Tests for the tiered discount calculation.
 */

import { describe, it, expect } from 'vitest';
import {
  getDiscountPercentage,
  calculateDiscount,
  getDiscountTier,
  DISCOUNT_TIERS,
} from '../discount.js';

const UNIT_PRICE_CENTS = 15000; // $150.00

describe('Volume Discount', () => {
  describe('getDiscountPercentage', () => {
    it('should return 0% for quantities 1-24', () => {
      expect(getDiscountPercentage(1)).toBe(0);
      expect(getDiscountPercentage(10)).toBe(0);
      expect(getDiscountPercentage(24)).toBe(0);
    });

    it('should return 5% for quantities 25-49', () => {
      expect(getDiscountPercentage(25)).toBe(5);
      expect(getDiscountPercentage(35)).toBe(5);
      expect(getDiscountPercentage(49)).toBe(5);
    });

    it('should return 10% for quantities 50-99', () => {
      expect(getDiscountPercentage(50)).toBe(10);
      expect(getDiscountPercentage(75)).toBe(10);
      expect(getDiscountPercentage(99)).toBe(10);
    });

    it('should return 15% for quantities 100-249', () => {
      expect(getDiscountPercentage(100)).toBe(15);
      expect(getDiscountPercentage(175)).toBe(15);
      expect(getDiscountPercentage(249)).toBe(15);
    });

    it('should return 20% for quantities 250+', () => {
      expect(getDiscountPercentage(250)).toBe(20);
      expect(getDiscountPercentage(500)).toBe(20);
      expect(getDiscountPercentage(1000)).toBe(20);
      expect(getDiscountPercentage(10000)).toBe(20);
    });

    it('should return 0% for invalid quantities', () => {
      expect(getDiscountPercentage(0)).toBe(0);
      expect(getDiscountPercentage(-1)).toBe(0);
    });

    describe('boundary conditions', () => {
      it('should transition from 0% to 5% at quantity 25', () => {
        expect(getDiscountPercentage(24)).toBe(0);
        expect(getDiscountPercentage(25)).toBe(5);
      });

      it('should transition from 5% to 10% at quantity 50', () => {
        expect(getDiscountPercentage(49)).toBe(5);
        expect(getDiscountPercentage(50)).toBe(10);
      });

      it('should transition from 10% to 15% at quantity 100', () => {
        expect(getDiscountPercentage(99)).toBe(10);
        expect(getDiscountPercentage(100)).toBe(15);
      });

      it('should transition from 15% to 20% at quantity 250', () => {
        expect(getDiscountPercentage(249)).toBe(15);
        expect(getDiscountPercentage(250)).toBe(20);
      });
    });
  });

  describe('calculateDiscount', () => {
    it('should calculate correct amounts for no discount (1-24)', () => {
      const result = calculateDiscount(10, UNIT_PRICE_CENTS);

      expect(result.originalAmountCents).toBe(150000); // $1,500
      expect(result.discountPercentage).toBe(0);
      expect(result.discountAmountCents).toBe(0);
      expect(result.finalAmountCents).toBe(150000);
    });

    it('should calculate correct amounts for 5% discount (25-49)', () => {
      const result = calculateDiscount(30, UNIT_PRICE_CENTS);

      expect(result.originalAmountCents).toBe(450000); // $4,500
      expect(result.discountPercentage).toBe(5);
      expect(result.discountAmountCents).toBe(22500); // $225
      expect(result.finalAmountCents).toBe(427500); // $4,275
    });

    it('should calculate correct amounts for 10% discount (50-99)', () => {
      const result = calculateDiscount(50, UNIT_PRICE_CENTS);

      expect(result.originalAmountCents).toBe(750000); // $7,500
      expect(result.discountPercentage).toBe(10);
      expect(result.discountAmountCents).toBe(75000); // $750
      expect(result.finalAmountCents).toBe(675000); // $6,750
    });

    it('should calculate correct amounts for 15% discount (100-249)', () => {
      const result = calculateDiscount(100, UNIT_PRICE_CENTS);

      expect(result.originalAmountCents).toBe(1500000); // $15,000
      expect(result.discountPercentage).toBe(15);
      expect(result.discountAmountCents).toBe(225000); // $2,250
      expect(result.finalAmountCents).toBe(1275000); // $12,750
    });

    it('should calculate correct amounts for 20% discount (250+)', () => {
      const result = calculateDiscount(300, UNIT_PRICE_CENTS);

      expect(result.originalAmountCents).toBe(4500000); // $45,000
      expect(result.discountPercentage).toBe(20);
      expect(result.discountAmountCents).toBe(900000); // $9,000
      expect(result.finalAmountCents).toBe(3600000); // $36,000
    });

    it('should handle single unit correctly', () => {
      const result = calculateDiscount(1, UNIT_PRICE_CENTS);

      expect(result.originalAmountCents).toBe(15000);
      expect(result.discountPercentage).toBe(0);
      expect(result.discountAmountCents).toBe(0);
      expect(result.finalAmountCents).toBe(15000);
    });

    it('should handle large quantities correctly', () => {
      const result = calculateDiscount(1000, UNIT_PRICE_CENTS);

      expect(result.originalAmountCents).toBe(15000000); // $150,000
      expect(result.discountPercentage).toBe(20);
      expect(result.discountAmountCents).toBe(3000000); // $30,000
      expect(result.finalAmountCents).toBe(12000000); // $120,000
    });
  });

  describe('getDiscountTier', () => {
    it('should return correct tier for each quantity range', () => {
      expect(getDiscountTier(10)?.percentage).toBe(0);
      expect(getDiscountTier(30)?.percentage).toBe(5);
      expect(getDiscountTier(75)?.percentage).toBe(10);
      expect(getDiscountTier(150)?.percentage).toBe(15);
      expect(getDiscountTier(500)?.percentage).toBe(20);
    });

    it('should return undefined for invalid quantities', () => {
      expect(getDiscountTier(0)).toBeUndefined();
      expect(getDiscountTier(-1)).toBeUndefined();
    });
  });

  describe('DISCOUNT_TIERS constant', () => {
    it('should have 5 tiers', () => {
      expect(DISCOUNT_TIERS.length).toBe(5);
    });

    it('should have contiguous ranges', () => {
      for (let i = 1; i < DISCOUNT_TIERS.length; i++) {
        const prevTier = DISCOUNT_TIERS[i - 1];
        const currTier = DISCOUNT_TIERS[i];
        expect(prevTier!.maxQuantity).toBe(currTier!.minQuantity - 1);
      }
    });

    it('should start at quantity 1', () => {
      expect(DISCOUNT_TIERS[0]!.minQuantity).toBe(1);
    });

    it('should have unlimited max for highest tier', () => {
      const lastTier = DISCOUNT_TIERS[DISCOUNT_TIERS.length - 1];
      expect(lastTier!.maxQuantity).toBeNull();
    });
  });
});


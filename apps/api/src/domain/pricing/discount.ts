/**
 * Volume Discount Calculation
 *
 * Implements tiered discounts based on order quantity.
 * Uses Decimal.js for precise monetary calculations.
 *
 * Discount Tiers:
 * - 1-24 units:    0% discount
 * - 25-49 units:   5% discount
 * - 50-99 units:   10% discount
 * - 100-249 units: 15% discount
 * - 250+ units:    20% discount
 */

import { Decimal } from 'decimal.js';

/**
 * Discount tier definition
 */
export interface DiscountTier {
  minQuantity: number;
  maxQuantity: number | null; // null means unlimited
  percentage: number;
}

/**
 * Volume discount tiers
 */
export const DISCOUNT_TIERS: DiscountTier[] = [
  { minQuantity: 1, maxQuantity: 24, percentage: 0 },
  { minQuantity: 25, maxQuantity: 49, percentage: 5 },
  { minQuantity: 50, maxQuantity: 99, percentage: 10 },
  { minQuantity: 100, maxQuantity: 249, percentage: 15 },
  { minQuantity: 250, maxQuantity: null, percentage: 20 },
];

/**
 * Get the discount percentage for a given quantity
 *
 * @param quantity - Number of units ordered
 * @returns Discount percentage (0-20)
 */
export function getDiscountPercentage(quantity: number): number {
  if (quantity < 1) {
    return 0;
  }

  for (const tier of DISCOUNT_TIERS) {
    if (
      quantity >= tier.minQuantity &&
      (tier.maxQuantity === null || quantity <= tier.maxQuantity)
    ) {
      return tier.percentage;
    }
  }

  // Should never reach here, but return 0 as fallback
  return 0;
}

/**
 * Result of discount calculation
 */
export interface DiscountResult {
  /** Original amount in cents before discount */
  originalAmountCents: number;
  /** Discount percentage applied */
  discountPercentage: number;
  /** Discount amount in cents */
  discountAmountCents: number;
  /** Final amount in cents after discount */
  finalAmountCents: number;
}

/**
 * Calculate the volume discount for an order
 *
 * @param quantity - Number of units ordered
 * @param unitPriceCents - Price per unit in cents
 * @returns Discount calculation result
 *
 * @example
 * ```ts
 * // 50 units at $150 each
 * const result = calculateDiscount(50, 15000);
 * // result.discountPercentage = 10
 * // result.originalAmountCents = 750000 ($7,500)
 * // result.discountAmountCents = 75000 ($750)
 * // result.finalAmountCents = 675000 ($6,750)
 * ```
 */
export function calculateDiscount(quantity: number, unitPriceCents: number): DiscountResult {
  const originalAmount = new Decimal(quantity).times(unitPriceCents);
  const discountPercentage = getDiscountPercentage(quantity);
  const discountAmount = originalAmount.times(discountPercentage).dividedBy(100);
  const finalAmount = originalAmount.minus(discountAmount);

  return {
    originalAmountCents: originalAmount.round().toNumber(),
    discountPercentage,
    discountAmountCents: discountAmount.round().toNumber(),
    finalAmountCents: finalAmount.round().toNumber(),
  };
}

/**
 * Get the discount tier for a given quantity
 *
 * @param quantity - Number of units
 * @returns The applicable discount tier
 */
export function getDiscountTier(quantity: number): DiscountTier | undefined {
  if (quantity < 1) {
    return undefined;
  }

  return DISCOUNT_TIERS.find(
    (tier) =>
      quantity >= tier.minQuantity && (tier.maxQuantity === null || quantity <= tier.maxQuantity)
  );
}

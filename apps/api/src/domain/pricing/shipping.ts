/**
 * Shipping Cost Calculation
 *
 * Calculates shipping costs based on distance, weight, and quantity.
 * Implements the 15% validity rule: shipping cannot exceed 15% of order amount.
 *
 * Formula: distance_km × (weight_grams / 1000) × quantity × $0.01
 */

import { Decimal } from 'decimal.js';

/** Rate per kg per km in cents */
const RATE_CENTS_PER_KG_PER_KM = 1; // $0.01

/** Maximum shipping percentage of order amount (after discount) */
export const MAX_SHIPPING_PERCENTAGE = 15;

/**
 * Result of shipping calculation
 */
export interface ShippingCostResult {
  /** Distance from warehouse to customer in km */
  distanceKm: number;
  /** Weight per unit in grams */
  weightGrams: number;
  /** Number of units */
  quantity: number;
  /** Shipping cost in cents */
  shippingCostCents: number;
}

/**
 * Calculate the shipping cost for a shipment
 *
 * Formula: distance_km × (weight_grams / 1000) × quantity × $0.01
 *
 * @param distanceKm - Distance from warehouse to customer in kilometers
 * @param weightGrams - Weight per unit in grams
 * @param quantity - Number of units
 * @returns Shipping calculation result
 *
 * @example
 * ```ts
 * // 100 km, 365g per unit, 10 units
 * const result = calculateShippingCost(100, 365, 10);
 * // shippingCostCents = 100 × 0.365 × 10 × 1 = 365 cents ($3.65)
 * ```
 */
export function calculateShippingCost(
  distanceKm: number,
  weightGrams: number,
  quantity: number
): ShippingCostResult {
  // Convert grams to kg
  const weightKg = new Decimal(weightGrams).dividedBy(1000);

  // Calculate shipping cost: distance × weight_kg × quantity × rate
  const shippingCost = new Decimal(distanceKm)
    .times(weightKg)
    .times(quantity)
    .times(RATE_CENTS_PER_KG_PER_KM);

  return {
    distanceKm,
    weightGrams,
    quantity,
    shippingCostCents: shippingCost.round().toNumber(),
  };
}

/**
 * Check if the shipping cost is valid (within 15% of order amount)
 *
 * The shipping cost must not exceed 15% of the order amount AFTER discount.
 *
 * @param shippingCostCents - Total shipping cost in cents
 * @param orderAmountAfterDiscountCents - Order amount after discount in cents
 * @returns True if shipping is within 15% limit, false otherwise
 *
 * @example
 * ```ts
 * // Order: $6,750 after discount
 * // Shipping: $1,000
 * const valid = isShippingCostValid(100000, 675000);
 * // 100000 / 675000 = 0.148 (14.8%) → valid (true)
 * ```
 */
export function isShippingCostValid(
  shippingCostCents: number,
  orderAmountAfterDiscountCents: number
): boolean {
  if (orderAmountAfterDiscountCents <= 0) {
    return false;
  }

  const maxAllowedShipping = new Decimal(orderAmountAfterDiscountCents)
    .times(MAX_SHIPPING_PERCENTAGE)
    .dividedBy(100);

  return new Decimal(shippingCostCents).lessThanOrEqualTo(maxAllowedShipping);
}

/**
 * Calculate the shipping percentage of the order amount
 *
 * @param shippingCostCents - Shipping cost in cents
 * @param orderAmountAfterDiscountCents - Order amount after discount in cents
 * @returns Shipping as a percentage of order (e.g., 14.8 for 14.8%)
 */
export function calculateShippingPercentage(
  shippingCostCents: number,
  orderAmountAfterDiscountCents: number
): number {
  if (orderAmountAfterDiscountCents <= 0) {
    return 100;
  }

  return new Decimal(shippingCostCents)
    .times(100)
    .dividedBy(orderAmountAfterDiscountCents)
    .toDecimalPlaces(2)
    .toNumber();
}

/**
 * Validity result with details
 */
export interface ShippingValidityResult {
  /** Whether shipping is within 15% limit */
  isValid: boolean;
  /** Shipping cost in cents */
  shippingCostCents: number;
  /** Order amount after discount in cents */
  orderAmountCents: number;
  /** Shipping as percentage of order */
  shippingPercentage: number;
  /** Maximum allowed shipping in cents */
  maxAllowedShippingCents: number;
  /** Amount over limit (0 if within limit) */
  overLimitCents: number;
}

/**
 * Check shipping validity with detailed breakdown
 *
 * @param shippingCostCents - Shipping cost in cents
 * @param orderAmountAfterDiscountCents - Order amount after discount in cents
 * @returns Detailed validity result
 */
export function checkShippingValidity(
  shippingCostCents: number,
  orderAmountAfterDiscountCents: number
): ShippingValidityResult {
  const maxAllowedShipping = new Decimal(orderAmountAfterDiscountCents)
    .times(MAX_SHIPPING_PERCENTAGE)
    .dividedBy(100)
    .round()
    .toNumber();

  const shippingPercentage = calculateShippingPercentage(
    shippingCostCents,
    orderAmountAfterDiscountCents
  );

  const overLimit = Math.max(0, shippingCostCents - maxAllowedShipping);

  return {
    isValid: shippingCostCents <= maxAllowedShipping,
    shippingCostCents,
    orderAmountCents: orderAmountAfterDiscountCents,
    shippingPercentage,
    maxAllowedShippingCents: maxAllowedShipping,
    overLimitCents: overLimit,
  };
}


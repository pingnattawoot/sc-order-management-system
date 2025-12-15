/**
 * Decimal.js Utilities
 *
 * Provides utility functions for precise decimal calculations.
 * Used for money calculations to avoid floating-point errors.
 */

import { Decimal } from 'decimal.js';

// Configure Decimal.js for financial calculations
Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP,
});

/**
 * Convert cents to dollars as a formatted string
 */
export function centsToDollars(cents: number): string {
  return new Decimal(cents).dividedBy(100).toFixed(2);
}

/**
 * Convert dollars to cents
 */
export function dollarsToCents(dollars: number | string): number {
  return new Decimal(dollars).times(100).round().toNumber();
}

/**
 * Format cents as currency string (e.g., "$150.00")
 */
export function formatCurrency(cents: number): string {
  return `$${centsToDollars(cents)}`;
}

/**
 * Calculate percentage of a value
 */
export function calculatePercentage(value: number, percentage: number): number {
  return new Decimal(value).times(percentage).dividedBy(100).round().toNumber();
}

/**
 * Check if value A is greater than percentage of value B
 */
export function isGreaterThanPercentage(
  valueA: number,
  valueB: number,
  percentage: number
): boolean {
  const threshold = new Decimal(valueB).times(percentage).dividedBy(100);
  return new Decimal(valueA).greaterThan(threshold);
}

export { Decimal };


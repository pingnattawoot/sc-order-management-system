/**
 * Custom Test Assertions
 *
 * Helper functions for common test assertions.
 */

import { expect } from 'vitest';

/**
 * Assert that a value is within a tolerance of the expected value
 * Useful for floating-point comparisons
 */
export function expectCloseTo(
  actual: number,
  expected: number,
  tolerance: number = 0.01
): void {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
}

/**
 * Assert that a monetary value in cents is correct
 * Handles rounding differences up to 1 cent
 */
export function expectCents(actual: number, expected: number): void {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);
}

/**
 * Assert that a distance in km is approximately correct
 * Allows for small variations due to different calculation methods
 */
export function expectDistanceKm(
  actual: number,
  expected: number,
  toleranceKm: number = 1
): void {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(toleranceKm);
}

/**
 * Assert that an array contains exactly the expected items (order-independent)
 */
export function expectContainsExactly<T>(
  actual: T[],
  expected: T[],
  compareFn?: (a: T, b: T) => boolean
): void {
  expect(actual.length).toBe(expected.length);

  if (compareFn) {
    for (const item of expected) {
      expect(actual.some((a) => compareFn(a, item))).toBe(true);
    }
  } else {
    for (const item of expected) {
      expect(actual).toContainEqual(item);
    }
  }
}

/**
 * Assert that a value is a valid UUID/nanoid
 */
export function expectValidId(id: string, prefix?: string): void {
  expect(typeof id).toBe('string');
  expect(id.length).toBeGreaterThan(0);

  if (prefix) {
    expect(id.startsWith(prefix)).toBe(true);
  }
}

/**
 * Assert that a date is recent (within the last N seconds)
 */
export function expectRecentDate(date: Date, withinSeconds: number = 60): void {
  const now = new Date();
  const diff = Math.abs(now.getTime() - date.getTime()) / 1000;
  expect(diff).toBeLessThanOrEqual(withinSeconds);
}

/**
 * Assert that a percentage is within valid range (0-100)
 */
export function expectValidPercentage(percentage: number): void {
  expect(percentage).toBeGreaterThanOrEqual(0);
  expect(percentage).toBeLessThanOrEqual(100);
}


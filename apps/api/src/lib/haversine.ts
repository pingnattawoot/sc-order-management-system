/**
 * Haversine Distance Calculation
 *
 * Calculates the great-circle distance between two points on Earth
 * using the Haversine formula. Uses Decimal.js for precision.
 *
 * @see https://en.wikipedia.org/wiki/Haversine_formula
 */

import { Decimal } from 'decimal.js';

/** Earth's radius in kilometers */
const EARTH_RADIUS_KM = 6371;

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): Decimal {
  return new Decimal(degrees).times(Math.PI).dividedBy(180);
}

/**
 * Calculate the Haversine of an angle
 * haversin(θ) = sin²(θ/2)
 */
function haversin(theta: Decimal): Decimal {
  const halfTheta = theta.dividedBy(2);
  const sinHalf = new Decimal(Math.sin(halfTheta.toNumber()));
  return sinHalf.times(sinHalf);
}

/**
 * Calculate the great-circle distance between two points on Earth.
 *
 * @param lat1 - Latitude of point 1 in degrees
 * @param lon1 - Longitude of point 1 in degrees
 * @param lat2 - Latitude of point 2 in degrees
 * @param lon2 - Longitude of point 2 in degrees
 * @returns Distance in kilometers
 *
 * @example
 * ```ts
 * // Los Angeles to New York
 * const distance = calculateDistanceKm(34.0522, -118.2437, 40.7128, -74.0060);
 * // Returns approximately 3935.75 km
 * ```
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Handle same point case
  if (lat1 === lat2 && lon1 === lon2) {
    return 0;
  }

  // Convert to radians
  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const deltaPhi = toRadians(lat2 - lat1);
  const deltaLambda = toRadians(lon2 - lon1);

  // Haversine formula
  // a = sin²(Δφ/2) + cos(φ1) × cos(φ2) × sin²(Δλ/2)
  const a = haversin(deltaPhi).plus(
    new Decimal(Math.cos(phi1.toNumber()))
      .times(Math.cos(phi2.toNumber()))
      .times(haversin(deltaLambda))
  );

  // c = 2 × atan2(√a, √(1−a))
  const c = new Decimal(2).times(Math.atan2(Math.sqrt(a.toNumber()), Math.sqrt(1 - a.toNumber())));

  // Distance = R × c
  const distance = new Decimal(EARTH_RADIUS_KM).times(c);

  // Round to 2 decimal places
  return distance.toDecimalPlaces(2).toNumber();
}

/**
 * Calculate distance between two coordinate objects
 */
export function calculateDistance(
  point1: { latitude: number; longitude: number },
  point2: { latitude: number; longitude: number }
): number {
  return calculateDistanceKm(point1.latitude, point1.longitude, point2.latitude, point2.longitude);
}

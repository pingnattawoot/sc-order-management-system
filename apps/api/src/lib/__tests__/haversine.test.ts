/**
 * Haversine Distance Tests
 *
 * Tests for the Haversine formula implementation.
 * Reference distances verified using online calculators.
 */

import { describe, it, expect } from 'vitest';
import { calculateDistanceKm, calculateDistance } from '../haversine.js';
import { LOCATIONS } from '../../__tests__/helpers/index.js';
import { expectDistanceKm } from '../../__tests__/helpers/index.js';

describe('Haversine Distance Calculation', () => {
  describe('calculateDistanceKm', () => {
    it('should calculate LA to New York distance (~3935 km)', () => {
      const distance = calculateDistanceKm(
        LOCATIONS.losAngeles.latitude,
        LOCATIONS.losAngeles.longitude,
        LOCATIONS.newYork.latitude,
        LOCATIONS.newYork.longitude
      );

      // Expected: ~3935-3944 km (depends on exact coordinates)
      expectDistanceKm(distance, 3935, 15);
    });

    it('should calculate Paris to Hong Kong distance (~9615 km)', () => {
      const distance = calculateDistanceKm(
        LOCATIONS.paris.latitude,
        LOCATIONS.paris.longitude,
        LOCATIONS.hongKong.latitude,
        LOCATIONS.hongKong.longitude
      );

      // Expected: ~9615 km
      expectDistanceKm(distance, 9615, 20);
    });

    it('should calculate London to New York distance (~5570 km)', () => {
      const distance = calculateDistanceKm(
        LOCATIONS.london.latitude,
        LOCATIONS.london.longitude,
        LOCATIONS.newYork.latitude,
        LOCATIONS.newYork.longitude
      );

      // Expected: ~5570 km
      expectDistanceKm(distance, 5570, 20);
    });

    it('should calculate Sydney to Tokyo distance (~7823 km)', () => {
      const distance = calculateDistanceKm(
        LOCATIONS.sydney.latitude,
        LOCATIONS.sydney.longitude,
        LOCATIONS.tokyo.latitude,
        LOCATIONS.tokyo.longitude
      );

      // Expected: ~7823 km
      expectDistanceKm(distance, 7823, 30);
    });

    it('should return 0 for same point', () => {
      const distance = calculateDistanceKm(
        LOCATIONS.london.latitude,
        LOCATIONS.london.longitude,
        LOCATIONS.london.latitude,
        LOCATIONS.london.longitude
      );

      expect(distance).toBe(0);
    });

    it('should handle negative coordinates (Southern/Western hemispheres)', () => {
      // Sydney is in Southern hemisphere
      const distance = calculateDistanceKm(
        LOCATIONS.sydney.latitude, // -33.8688
        LOCATIONS.sydney.longitude, // 151.2093
        LOCATIONS.singapore.latitude, // 1.3521
        LOCATIONS.singapore.longitude // 103.8198
      );

      // Expected: ~6288 km
      expectDistanceKm(distance, 6288, 30);
    });

    it('should be symmetric (A to B equals B to A)', () => {
      const distanceAB = calculateDistanceKm(
        LOCATIONS.london.latitude,
        LOCATIONS.london.longitude,
        LOCATIONS.paris.latitude,
        LOCATIONS.paris.longitude
      );

      const distanceBA = calculateDistanceKm(
        LOCATIONS.paris.latitude,
        LOCATIONS.paris.longitude,
        LOCATIONS.london.latitude,
        LOCATIONS.london.longitude
      );

      expect(distanceAB).toBe(distanceBA);
    });

    it('should handle short distances accurately', () => {
      // Two points in London, ~15 km apart
      const distance = calculateDistanceKm(
        51.5074, // Central London
        -0.1278,
        51.4545, // Brixton
        -0.1146
      );

      // Should be around 5-6 km
      expect(distance).toBeGreaterThan(4);
      expect(distance).toBeLessThan(10);
    });

    it('should handle antipodal points (~20000 km)', () => {
      // Approximate antipodal points
      const distance = calculateDistanceKm(
        0, // Equator
        0, // Prime meridian
        0, // Equator
        180 // Opposite side
      );

      // Half Earth's circumference ~20015 km
      expectDistanceKm(distance, 20015, 20);
    });
  });

  describe('calculateDistance (object interface)', () => {
    it('should work with coordinate objects', () => {
      const distance = calculateDistance(LOCATIONS.london, LOCATIONS.paris);

      // London to Paris ~343 km
      expectDistanceKm(distance, 343, 10);
    });

    it('should return 0 for same coordinates', () => {
      const point = { latitude: 51.5074, longitude: -0.1278 };
      const distance = calculateDistance(point, point);

      expect(distance).toBe(0);
    });
  });
});

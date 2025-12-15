/**
 * Order Service Tests
 *
 * Tests for order verification and submission.
 * Note: These tests require a database connection.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { orderService, OrderService } from '../order.service.js';
import { prisma, disconnectPrisma } from '../../../lib/prisma.js';
import { LOCATIONS } from '../../../__tests__/helpers/index.js';

// Skip integration tests if no database
const SKIP_DB_TESTS = !process.env.DATABASE_URL;

describe.skipIf(SKIP_DB_TESTS)('OrderService (Integration)', () => {
  let service: OrderService;

  beforeAll(async () => {
    service = new OrderService();
    // Reset database state
    await prisma.orderShipment.deleteMany();
    await prisma.order.deleteMany();
    // Re-seed warehouses to known state
    await prisma.warehouse.updateMany({
      data: { stock: 100 },
    });
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  beforeEach(async () => {
    // Reset orders between tests
    await prisma.orderShipment.deleteMany();
    await prisma.order.deleteMany();
    // Reset warehouse stock
    await prisma.warehouse.updateMany({
      data: { stock: 100 },
    });
  });

  describe('verifyOrder', () => {
    it('should return valid quote for small order', async () => {
      const quote = await service.verifyOrder(10, LOCATIONS.london.latitude, LOCATIONS.london.longitude);

      expect(quote.isValid).toBe(true);
      expect(quote.errorMessage).toBeNull();
      expect(quote.quantity).toBe(10);
      expect(quote.shipments.length).toBeGreaterThan(0);
      expect(quote.grandTotalCents).toBeGreaterThan(0);
    });

    it('should apply correct discount for quantity', async () => {
      // 50 units should get 10% discount
      const quote = await service.verifyOrder(50, LOCATIONS.london.latitude, LOCATIONS.london.longitude);

      expect(quote.discount.discountPercentage).toBe(10);
    });

    it('should return invalid for zero quantity', async () => {
      const quote = await service.verifyOrder(0, LOCATIONS.london.latitude, LOCATIONS.london.longitude);

      expect(quote.isValid).toBe(false);
      expect(quote.errorMessage).toContain('at least 1');
    });

    it('should return invalid for negative quantity', async () => {
      const quote = await service.verifyOrder(-5, LOCATIONS.london.latitude, LOCATIONS.london.longitude);

      expect(quote.isValid).toBe(false);
    });

    it('should return invalid for invalid latitude', async () => {
      const quote = await service.verifyOrder(10, 100, 0);

      expect(quote.isValid).toBe(false);
      expect(quote.errorMessage).toContain('Latitude');
    });

    it('should return invalid for invalid longitude', async () => {
      const quote = await service.verifyOrder(10, 0, 200);

      expect(quote.isValid).toBe(false);
      expect(quote.errorMessage).toContain('Longitude');
    });

    it('should check shipping validity', async () => {
      const quote = await service.verifyOrder(10, LOCATIONS.london.latitude, LOCATIONS.london.longitude);

      expect(quote.shippingValidity).toBeDefined();
      expect(quote.shippingValidity.maxAllowedShippingCents).toBeGreaterThan(0);
    });
  });

  describe('submitOrder', () => {
    it('should create order with shipments', async () => {
      const result = await service.submitOrder(10, LOCATIONS.london.latitude, LOCATIONS.london.longitude);

      expect(result.order).toBeDefined();
      expect(result.order.orderNumber).toMatch(/^ORD-/);
      expect(result.order.quantity).toBe(10);
      expect(result.order.shipments.length).toBeGreaterThan(0);
      expect(result.order.status).toBe('COMPLETED');
    });

    it('should reduce warehouse stock', async () => {
      // Get initial stock
      const warehousesBefore = await prisma.warehouse.findMany();
      const totalBefore = warehousesBefore.reduce((sum, w) => sum + w.stock, 0);

      // Submit order
      await service.submitOrder(10, LOCATIONS.london.latitude, LOCATIONS.london.longitude);

      // Check stock reduced
      const warehousesAfter = await prisma.warehouse.findMany();
      const totalAfter = warehousesAfter.reduce((sum, w) => sum + w.stock, 0);

      expect(totalAfter).toBe(totalBefore - 10);
    });

    it('should throw error for invalid order', async () => {
      await expect(service.submitOrder(0, 0, 0)).rejects.toThrow();
    });

    it('should generate unique order numbers', async () => {
      const result1 = await service.submitOrder(5, LOCATIONS.london.latitude, LOCATIONS.london.longitude);
      const result2 = await service.submitOrder(5, LOCATIONS.london.latitude, LOCATIONS.london.longitude);

      expect(result1.order.orderNumber).not.toBe(result2.order.orderNumber);
    });
  });

  describe('getOrder', () => {
    it('should retrieve order by ID', async () => {
      const { order } = await service.submitOrder(10, LOCATIONS.london.latitude, LOCATIONS.london.longitude);

      const retrieved = await service.getOrder(order.id);

      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(order.id);
      expect(retrieved!.shipments.length).toBeGreaterThan(0);
    });

    it('should return null for non-existent order', async () => {
      const retrieved = await service.getOrder('non-existent-id');
      expect(retrieved).toBeNull();
    });
  });

  describe('getOrderByNumber', () => {
    it('should retrieve order by order number', async () => {
      const { order } = await service.submitOrder(10, LOCATIONS.london.latitude, LOCATIONS.london.longitude);

      const retrieved = await service.getOrderByNumber(order.orderNumber);

      expect(retrieved).toBeDefined();
      expect(retrieved!.orderNumber).toBe(order.orderNumber);
    });
  });

  describe('listOrders', () => {
    it('should list all orders in descending order', async () => {
      await service.submitOrder(5, LOCATIONS.london.latitude, LOCATIONS.london.longitude);
      await service.submitOrder(10, LOCATIONS.london.latitude, LOCATIONS.london.longitude);

      const orders = await service.listOrders();

      expect(orders.length).toBe(2);
      // Most recent first
      expect(orders[0]!.quantity).toBe(10);
      expect(orders[1]!.quantity).toBe(5);
    });
  });
});

// Unit tests that don't require database
describe('OrderService (Unit)', () => {
  it('should export singleton instance', () => {
    expect(orderService).toBeDefined();
    expect(orderService).toBeInstanceOf(OrderService);
  });
});


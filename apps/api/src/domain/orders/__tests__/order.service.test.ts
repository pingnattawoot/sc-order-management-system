/**
 * Order Service Tests
 *
 * INTEGRATION TESTS: These tests require a database connection.
 * Updated for multi-product, multi-item order architecture.
 *
 * SAFETY:
 * - Tests are skipped if no DATABASE_URL/TEST_DATABASE_URL is set
 * - The test setup validates URLs to prevent accidental production access
 * - For maximum safety, use testcontainers (see test-database.ts)
 *
 * @see src/__tests__/helpers/test-database.ts for database safety utilities
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { orderService, OrderService, OrderItemInput } from '../order.service.js';
import { prisma, disconnectPrisma } from '../../../lib/prisma.js';
import { LOCATIONS } from '../../../__tests__/helpers/index.js';

/**
 * Skip integration tests if no database URL is configured.
 * URL validation happens in setup.ts before tests run.
 */
const SKIP_DB_TESTS = !process.env.TEST_DATABASE_URL;

describe.skipIf(SKIP_DB_TESTS)('OrderService (Integration)', () => {
  let service: OrderService;
  let testProductId: string;

  beforeAll(async () => {
    service = new OrderService();

    // Get the first product for testing
    const products = await prisma.product.findMany({ take: 1 });
    if (products.length === 0) {
      throw new Error('No products found. Run seed first.');
    }
    testProductId = products[0]!.id;

    // Reset database state
    await prisma.orderShipment.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();

    // Reset warehouse stock to known state
    await prisma.warehouseStock.updateMany({
      data: { quantity: 100 },
    });
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  beforeEach(async () => {
    // Reset orders between tests
    await prisma.orderShipment.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();

    // Reset warehouse stock
    await prisma.warehouseStock.updateMany({
      data: { quantity: 100 },
    });
  });

  /**
   * Helper to create order items input
   */
  function createItems(quantity: number, productId?: string): OrderItemInput[] {
    return [{ productId: productId ?? testProductId, quantity }];
  }

  describe('verifyOrder', () => {
    it('should return valid quote for small order', async () => {
      const quote = await service.verifyOrder(
        createItems(10),
        LOCATIONS.london.latitude,
        LOCATIONS.london.longitude
      );

      expect(quote.isValid).toBe(true);
      expect(quote.errorMessage).toBeNull();
      expect(quote.items.length).toBe(1);
      expect(quote.items[0]!.quantity).toBe(10);
      expect(quote.items[0]!.shipments.length).toBeGreaterThan(0);
      expect(quote.grandTotalCents).toBeGreaterThan(0);
    });

    it('should apply correct discount for quantity', async () => {
      // 50 units should get 10% discount
      const quote = await service.verifyOrder(
        createItems(50),
        LOCATIONS.london.latitude,
        LOCATIONS.london.longitude
      );

      expect(quote.discount.discountPercentage).toBe(10);
    });

    it('should return invalid for zero quantity', async () => {
      const quote = await service.verifyOrder(
        createItems(0),
        LOCATIONS.london.latitude,
        LOCATIONS.london.longitude
      );

      expect(quote.isValid).toBe(false);
      expect(quote.errorMessage).toContain('at least 1');
    });

    it('should return invalid for negative quantity', async () => {
      const quote = await service.verifyOrder(
        createItems(-5),
        LOCATIONS.london.latitude,
        LOCATIONS.london.longitude
      );

      expect(quote.isValid).toBe(false);
    });

    it('should return invalid for empty items', async () => {
      const quote = await service.verifyOrder(
        [],
        LOCATIONS.london.latitude,
        LOCATIONS.london.longitude
      );

      expect(quote.isValid).toBe(false);
      expect(quote.errorMessage).toContain('At least one item');
    });

    it('should return invalid for invalid latitude', async () => {
      const quote = await service.verifyOrder(createItems(10), 100, 0);

      expect(quote.isValid).toBe(false);
      expect(quote.errorMessage).toContain('Latitude');
    });

    it('should return invalid for invalid longitude', async () => {
      const quote = await service.verifyOrder(createItems(10), 0, 200);

      expect(quote.isValid).toBe(false);
      expect(quote.errorMessage).toContain('Longitude');
    });

    it('should check shipping validity', async () => {
      const quote = await service.verifyOrder(
        createItems(10),
        LOCATIONS.london.latitude,
        LOCATIONS.london.longitude
      );

      expect(quote.shippingValidity).toBeDefined();
      expect(quote.shippingValidity.maxAllowedShippingCents).toBeGreaterThan(0);
    });

    it('should return invalid for non-existent product', async () => {
      const quote = await service.verifyOrder(
        [{ productId: 'non-existent-product', quantity: 10 }],
        LOCATIONS.london.latitude,
        LOCATIONS.london.longitude
      );

      expect(quote.isValid).toBe(false);
      expect(quote.errorMessage).toContain('Product not found');
    });
  });

  describe('submitOrder', () => {
    it('should create order with items and shipments', async () => {
      const result = await service.submitOrder(
        createItems(10),
        LOCATIONS.london.latitude,
        LOCATIONS.london.longitude
      );

      expect(result.order).toBeDefined();
      expect(result.order.orderNumber).toMatch(/^ORD-/);
      expect(result.order.items.length).toBe(1);
      expect(result.order.items[0]!.quantity).toBe(10);
      expect(result.order.items[0]!.shipments.length).toBeGreaterThan(0);
      expect(result.order.status).toBe('COMPLETED');
    });

    it('should reduce warehouse stock', async () => {
      // Get initial stock
      const stocksBefore = await prisma.warehouseStock.findMany({
        where: { productId: testProductId },
      });
      const totalBefore = stocksBefore.reduce((sum, s) => sum + s.quantity, 0);

      // Submit order
      await service.submitOrder(
        createItems(10),
        LOCATIONS.london.latitude,
        LOCATIONS.london.longitude
      );

      // Check stock reduced
      const stocksAfter = await prisma.warehouseStock.findMany({
        where: { productId: testProductId },
      });
      const totalAfter = stocksAfter.reduce((sum, s) => sum + s.quantity, 0);

      expect(totalAfter).toBe(totalBefore - 10);
    });

    it('should throw error for invalid order', async () => {
      await expect(service.submitOrder(createItems(0), 0, 0)).rejects.toThrow();
    });

    it('should generate unique order numbers', async () => {
      const result1 = await service.submitOrder(
        createItems(5),
        LOCATIONS.london.latitude,
        LOCATIONS.london.longitude
      );
      const result2 = await service.submitOrder(
        createItems(5),
        LOCATIONS.london.latitude,
        LOCATIONS.london.longitude
      );

      expect(result1.order.orderNumber).not.toBe(result2.order.orderNumber);
    });
  });

  describe('getOrder', () => {
    it('should retrieve order by ID with items and shipments', async () => {
      const { order } = await service.submitOrder(
        createItems(10),
        LOCATIONS.london.latitude,
        LOCATIONS.london.longitude
      );

      const retrieved = await service.getOrder(order.id);

      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(order.id);
      expect(retrieved!.items.length).toBeGreaterThan(0);
      expect(retrieved!.items[0]!.shipments.length).toBeGreaterThan(0);
    });

    it('should return null for non-existent order', async () => {
      const retrieved = await service.getOrder('non-existent-id');
      expect(retrieved).toBeNull();
    });
  });

  describe('getOrderByNumber', () => {
    it('should retrieve order by order number', async () => {
      const { order } = await service.submitOrder(
        createItems(10),
        LOCATIONS.london.latitude,
        LOCATIONS.london.longitude
      );

      const retrieved = await service.getOrderByNumber(order.orderNumber);

      expect(retrieved).toBeDefined();
      expect(retrieved!.orderNumber).toBe(order.orderNumber);
    });
  });

  describe('listOrders', () => {
    it('should list all orders in descending order', async () => {
      await service.submitOrder(
        createItems(5),
        LOCATIONS.london.latitude,
        LOCATIONS.london.longitude
      );
      await service.submitOrder(
        createItems(10),
        LOCATIONS.london.latitude,
        LOCATIONS.london.longitude
      );

      const orders = await service.listOrders();

      expect(orders.length).toBe(2);
      // Most recent first - check total quantity via items
      const order0Qty = orders[0]!.items.reduce((sum, i) => sum + i.quantity, 0);
      const order1Qty = orders[1]!.items.reduce((sum, i) => sum + i.quantity, 0);
      expect(order0Qty).toBe(10);
      expect(order1Qty).toBe(5);
    });
  });

  describe('multi-item orders', () => {
    it('should handle multiple items in single order', async () => {
      // Get all products
      const products = await prisma.product.findMany({ take: 2 });
      if (products.length < 2) {
        console.log('Skipping multi-product test - not enough products');
        return;
      }

      const items: OrderItemInput[] = [
        { productId: products[0]!.id, quantity: 5 },
        { productId: products[1]!.id, quantity: 3 },
      ];

      const quote = await service.verifyOrder(
        items,
        LOCATIONS.london.latitude,
        LOCATIONS.london.longitude
      );

      expect(quote.isValid).toBe(true);
      expect(quote.items.length).toBe(2);
      expect(quote.items[0]!.quantity).toBe(5);
      expect(quote.items[1]!.quantity).toBe(3);
    });

    it('should submit multi-item order', async () => {
      const products = await prisma.product.findMany({ take: 2 });
      if (products.length < 2) {
        console.log('Skipping multi-product test - not enough products');
        return;
      }

      const items: OrderItemInput[] = [
        { productId: products[0]!.id, quantity: 5 },
        { productId: products[1]!.id, quantity: 3 },
      ];

      const result = await service.submitOrder(
        items,
        LOCATIONS.london.latitude,
        LOCATIONS.london.longitude
      );

      expect(result.order.items.length).toBe(2);
      // Verify stock was reduced for both products
      for (const product of products) {
        const stocks = await prisma.warehouseStock.findMany({
          where: { productId: product.id },
        });
        const total = stocks.reduce((sum, s) => sum + s.quantity, 0);
        // Stock should be less than initial 600 (6 warehouses × 100)
        expect(total).toBeLessThan(600);
      }
    });
  });

  describe('multi-product warehouse stock', () => {
    it('should only reduce stock for ordered product', async () => {
      const products = await prisma.product.findMany({ take: 2 });
      if (products.length < 2) {
        console.log('Skipping multi-product stock test - not enough products');
        return;
      }

      const product1 = products[0]!;
      const product2 = products[1]!;

      // Get initial stock for product2
      const product2StockBefore = await prisma.warehouseStock.findMany({
        where: { productId: product2.id },
      });
      const product2TotalBefore = product2StockBefore.reduce((sum, s) => sum + s.quantity, 0);

      // Order only product1
      await service.submitOrder(
        [{ productId: product1.id, quantity: 10 }],
        LOCATIONS.london.latitude,
        LOCATIONS.london.longitude
      );

      // Product2 stock should be unchanged
      const product2StockAfter = await prisma.warehouseStock.findMany({
        where: { productId: product2.id },
      });
      const product2TotalAfter = product2StockAfter.reduce((sum, s) => sum + s.quantity, 0);

      expect(product2TotalAfter).toBe(product2TotalBefore);
    });

    it('should track stock per product per warehouse independently', async () => {
      const products = await prisma.product.findMany({ take: 2 });
      if (products.length < 2) {
        console.log('Skipping multi-product stock test - not enough products');
        return;
      }

      const product1 = products[0]!;
      const product2 = products[1]!;

      // Order different quantities of each product
      await service.submitOrder(
        [
          { productId: product1.id, quantity: 15 },
          { productId: product2.id, quantity: 8 },
        ],
        LOCATIONS.london.latitude,
        LOCATIONS.london.longitude
      );

      // Check stocks were reduced by correct amounts
      const product1Stock = await prisma.warehouseStock.findMany({
        where: { productId: product1.id },
      });
      const product1Total = product1Stock.reduce((sum, s) => sum + s.quantity, 0);

      const product2Stock = await prisma.warehouseStock.findMany({
        where: { productId: product2.id },
      });
      const product2Total = product2Stock.reduce((sum, s) => sum + s.quantity, 0);

      // Each product started with 600 (6 warehouses × 100)
      expect(product1Total).toBe(600 - 15);
      expect(product2Total).toBe(600 - 8);
    });

    it('should correctly aggregate discount across multiple products', async () => {
      const products = await prisma.product.findMany({ take: 2 });
      if (products.length < 2) {
        console.log('Skipping multi-product discount test - not enough products');
        return;
      }

      // Order total 50 units to get 10% discount tier
      const items: OrderItemInput[] = [
        { productId: products[0]!.id, quantity: 30 },
        { productId: products[1]!.id, quantity: 20 },
      ];

      const quote = await service.verifyOrder(
        items,
        LOCATIONS.london.latitude,
        LOCATIONS.london.longitude
      );

      // 50 units should get 10% discount
      expect(quote.discount.discountPercentage).toBe(10);
    });

    it('should fail if one product has insufficient stock', async () => {
      // Drain stock for the test product
      await prisma.warehouseStock.updateMany({
        where: { productId: testProductId },
        data: { quantity: 5 }, // Only 30 total (6 × 5)
      });

      const quote = await service.verifyOrder(
        [{ productId: testProductId, quantity: 50 }], // More than available
        LOCATIONS.london.latitude,
        LOCATIONS.london.longitude
      );

      expect(quote.isValid).toBe(false);
      expect(quote.items[0]!.canFulfill).toBe(false);
    });

    it('should fulfill from multiple warehouses per product', async () => {
      // Set varied stock levels
      const warehouses = await prisma.warehouse.findMany();
      for (let i = 0; i < warehouses.length; i++) {
        await prisma.warehouseStock.updateMany({
          where: {
            warehouseId: warehouses[i]!.id,
            productId: testProductId,
          },
          data: { quantity: 20 }, // Each warehouse has 20
        });
      }

      // Order 50 units - will need multiple warehouses
      const quote = await service.verifyOrder(
        [{ productId: testProductId, quantity: 50 }],
        LOCATIONS.london.latitude,
        LOCATIONS.london.longitude
      );

      expect(quote.isValid).toBe(true);
      expect(quote.items[0]!.shipments.length).toBeGreaterThan(1);
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

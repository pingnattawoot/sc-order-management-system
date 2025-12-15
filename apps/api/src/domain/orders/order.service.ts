/**
 * Order Service
 *
 * Handles order verification and submission with:
 * - Quote generation without database write (verify)
 * - Order submission with transaction and pessimistic locking (submit)
 * - Automatic stock updates (per product per warehouse)
 * - Multi-item order support
 */

import { nanoid } from 'nanoid';
import { prisma } from '../../lib/prisma.js';
import { WarehouseOptimizer, WarehouseData } from '../logistics/warehouse-optimizer.js';
import {
  calculateDiscount,
  DiscountResult as DomainDiscountResult,
  getDiscountTier,
} from '../pricing/discount.js';
import { checkShippingValidity, ShippingValidityResult } from '../pricing/shipping.js';
import type {
  Order,
  OrderItem,
  OrderShipment,
  OrderStatus,
  Product,
  Warehouse,
  WarehouseStock,
} from '../../generated/prisma/client.js';

// ============================================
// Input Types
// ============================================

/**
 * Single item in an order request
 */
export interface OrderItemInput {
  productId: string;
  quantity: number;
}

// ============================================
// Quote Types (Verification Response)
// ============================================

/**
 * Discount result formatted for GraphQL response
 */
export interface DiscountResult {
  originalAmountCents: number;
  discountAmountCents: number;
  discountedAmountCents: number;
  discountPercentage: number;
  tierName: string;
}

/**
 * Shipment details for a single allocation
 */
export interface ShipmentDetail {
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  distanceKm: number;
  shippingCostCents: number;
}

/**
 * Quote for a single item in the order
 */
export interface OrderItemQuote {
  productId: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  subtotalCents: number;
  shipments: ShipmentDetail[];
  shippingCostCents: number;
  canFulfill: boolean;
  errorMessage: string | null;
}

/**
 * Complete order quote (multi-item)
 */
export interface OrderQuote {
  /** Whether the order can be fulfilled and is valid */
  isValid: boolean;
  /** Validation error message if not valid */
  errorMessage: string | null;
  /** Customer coordinates */
  customerLatitude: number;
  customerLongitude: number;
  /** Item-level quotes */
  items: OrderItemQuote[];
  /** Order subtotal (sum of all item subtotals) */
  subtotalCents: number;
  /** Discount calculation (applied to total order) */
  discount: DiscountResult;
  /** Total shipping cost */
  totalShippingCostCents: number;
  /** Shipping validity check */
  shippingValidity: ShippingValidityResult;
  /** Grand total (subtotal - discount + shipping) */
  grandTotalCents: number;
}

// ============================================
// Result Types
// ============================================

/**
 * Submitted order result
 */
export interface OrderResult {
  order: Order & {
    items: (OrderItem & { shipments: OrderShipment[] })[];
  };
  quote: OrderQuote;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Map domain discount result to GraphQL format
 */
function mapDiscountResult(domain: DomainDiscountResult, totalQuantity: number): DiscountResult {
  const tier = getDiscountTier(totalQuantity);
  const tierName = tier
    ? tier.percentage === 0
      ? 'No Discount'
      : `${tier.percentage}% Volume Discount`
    : 'No Discount';

  return {
    originalAmountCents: domain.originalAmountCents,
    discountAmountCents: domain.discountAmountCents,
    discountedAmountCents: domain.finalAmountCents,
    discountPercentage: domain.discountPercentage,
    tierName,
  };
}

// ============================================
// Order Service Class
// ============================================

/**
 * Order Service
 *
 * Provides methods for verifying and submitting multi-item orders.
 */
export class OrderService {
  private optimizer: WarehouseOptimizer;

  constructor() {
    this.optimizer = new WarehouseOptimizer();
  }

  /**
   * Generate a unique order number
   */
  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = nanoid(6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  /**
   * Get a product by ID
   */
  async getProduct(productId: string): Promise<Product | null> {
    return prisma.product.findUnique({ where: { id: productId } });
  }

  /**
   * Get all products
   */
  async getProducts(): Promise<Product[]> {
    return prisma.product.findMany({ orderBy: { name: 'asc' } });
  }

  /**
   * Get warehouse stock for a specific product
   * Returns warehouses with stock data formatted for the optimizer
   */
  private async getWarehouseDataForProduct(
    productId: string,
    weightGrams: number
  ): Promise<WarehouseData[]> {
    const warehouseStocks = await prisma.warehouseStock.findMany({
      where: { productId },
      include: { warehouse: true },
    });

    return warehouseStocks.map((ws) => ({
      id: ws.warehouse.id,
      name: ws.warehouse.name,
      latitude: ws.warehouse.latitude.toNumber(),
      longitude: ws.warehouse.longitude.toNumber(),
      stock: ws.quantity,
      weightGrams,
    }));
  }

  /**
   * Verify an order without saving to database
   *
   * Use this to get a quote before submitting.
   *
   * @param items - Array of items to order (productId, quantity)
   * @param latitude - Customer latitude
   * @param longitude - Customer longitude
   * @returns Order quote with pricing and validity
   */
  async verifyOrder(
    items: OrderItemInput[],
    latitude: number,
    longitude: number
  ): Promise<OrderQuote> {
    // Validate inputs
    if (!items || items.length === 0) {
      return this.createInvalidQuote(latitude, longitude, 'At least one item is required');
    }

    if (latitude < -90 || latitude > 90) {
      return this.createInvalidQuote(latitude, longitude, 'Latitude must be between -90 and 90');
    }

    if (longitude < -180 || longitude > 180) {
      return this.createInvalidQuote(
        latitude,
        longitude,
        'Longitude must be between -180 and 180'
      );
    }

    // Validate each item
    for (const item of items) {
      if (item.quantity < 1) {
        return this.createInvalidQuote(
          latitude,
          longitude,
          `Quantity must be at least 1 for product ${item.productId}`
        );
      }
    }

    // Process each item
    const itemQuotes: OrderItemQuote[] = [];
    let orderSubtotal = 0;
    let orderShipping = 0;
    let totalQuantity = 0;
    let hasError = false;
    let errorMessage: string | null = null;

    for (const item of items) {
      const product = await this.getProduct(item.productId);

      if (!product) {
        itemQuotes.push({
          productId: item.productId,
          productName: 'Unknown Product',
          quantity: item.quantity,
          unitPriceCents: 0,
          subtotalCents: 0,
          shipments: [],
          shippingCostCents: 0,
          canFulfill: false,
          errorMessage: `Product not found: ${item.productId}`,
        });
        hasError = true;
        errorMessage = `Product not found: ${item.productId}`;
        continue;
      }

      // Get warehouse stock for this product
      const warehouseData = await this.getWarehouseDataForProduct(
        product.id,
        product.weightGrams
      );

      // Find optimal shipments for this item
      const optimization = this.optimizer.findOptimalShipments(
        latitude,
        longitude,
        item.quantity,
        warehouseData
      );

      const itemSubtotal = product.priceInCents * item.quantity;
      const itemShipping = optimization.totalShippingCostCents;

      if (!optimization.canFulfill) {
        itemQuotes.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unitPriceCents: product.priceInCents,
          subtotalCents: itemSubtotal,
          shipments: [],
          shippingCostCents: 0,
          canFulfill: false,
          errorMessage: `Insufficient stock. Requested: ${item.quantity}, Available: ${optimization.fulfilledQuantity}`,
        });
        hasError = true;
        errorMessage = `Insufficient stock for ${product.name}. Requested: ${item.quantity}, Available: ${optimization.fulfilledQuantity}`;
        continue;
      }

      // Build shipment details
      const shipments: ShipmentDetail[] = optimization.shipments.map((s) => ({
        warehouseId: s.warehouseId,
        warehouseName: s.warehouseName,
        quantity: s.quantity,
        distanceKm: s.distanceKm,
        shippingCostCents: s.shippingCostCents,
      }));

      itemQuotes.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPriceCents: product.priceInCents,
        subtotalCents: itemSubtotal,
        shipments,
        shippingCostCents: itemShipping,
        canFulfill: true,
        errorMessage: null,
      });

      orderSubtotal += itemSubtotal;
      orderShipping += itemShipping;
      totalQuantity += item.quantity;
    }

    // If any item failed, return invalid quote
    if (hasError) {
      return {
        isValid: false,
        errorMessage,
        customerLatitude: latitude,
        customerLongitude: longitude,
        items: itemQuotes,
        subtotalCents: orderSubtotal,
        discount: {
          originalAmountCents: orderSubtotal,
          discountAmountCents: 0,
          discountedAmountCents: orderSubtotal,
          discountPercentage: 0,
          tierName: 'No Discount',
        },
        totalShippingCostCents: orderShipping,
        shippingValidity: {
          isValid: false,
          shippingCostCents: orderShipping,
          orderAmountCents: orderSubtotal,
          shippingPercentage: 0,
          maxAllowedShippingCents: 0,
          overLimitCents: 0,
        },
        grandTotalCents: 0,
      };
    }

    // Calculate discount on total order (based on total quantity)
    const domainDiscount = calculateDiscount(totalQuantity, orderSubtotal / totalQuantity);
    // Adjust: we need discount based on subtotal, not unit price
    const discountedSubtotal =
      orderSubtotal - Math.round(orderSubtotal * (domainDiscount.discountPercentage / 100));

    const discount: DiscountResult = {
      originalAmountCents: orderSubtotal,
      discountAmountCents: orderSubtotal - discountedSubtotal,
      discountedAmountCents: discountedSubtotal,
      discountPercentage: domainDiscount.discountPercentage,
      tierName: mapDiscountResult(domainDiscount, totalQuantity).tierName,
    };

    // Check shipping validity (use discountedSubtotal for the 15% rule)
    const shippingValidity = checkShippingValidity(orderShipping, discountedSubtotal);

    // Calculate grand total
    const grandTotalCents = discountedSubtotal + orderShipping;

    return {
      isValid: shippingValidity.isValid,
      errorMessage: shippingValidity.isValid
        ? null
        : `Shipping cost exceeds 15% of order amount. Shipping: ${shippingValidity.shippingPercentage.toFixed(1)}%`,
      customerLatitude: latitude,
      customerLongitude: longitude,
      items: itemQuotes,
      subtotalCents: orderSubtotal,
      discount,
      totalShippingCostCents: orderShipping,
      shippingValidity,
      grandTotalCents,
    };
  }

  /**
   * Create an invalid quote response
   */
  private createInvalidQuote(
    latitude: number,
    longitude: number,
    errorMessage: string
  ): OrderQuote {
    return {
      isValid: false,
      errorMessage,
      customerLatitude: latitude,
      customerLongitude: longitude,
      items: [],
      subtotalCents: 0,
      discount: {
        originalAmountCents: 0,
        discountAmountCents: 0,
        discountedAmountCents: 0,
        discountPercentage: 0,
        tierName: 'No Discount',
      },
      totalShippingCostCents: 0,
      shippingValidity: {
        isValid: false,
        shippingCostCents: 0,
        orderAmountCents: 0,
        shippingPercentage: 0,
        maxAllowedShippingCents: 0,
        overLimitCents: 0,
      },
      grandTotalCents: 0,
    };
  }

  /**
   * Submit an order with transaction and pessimistic locking
   *
   * This method:
   * 1. Re-verifies the order to get fresh stock levels
   * 2. Uses a transaction with SELECT FOR UPDATE to lock warehouse_stocks rows
   * 3. Updates warehouse stock atomically
   * 4. Creates order, order items, and shipment records
   *
   * @param items - Array of items to order
   * @param latitude - Customer latitude
   * @param longitude - Customer longitude
   * @returns Created order with items and shipments
   * @throws Error if order is invalid or cannot be fulfilled
   */
  async submitOrder(
    items: OrderItemInput[],
    latitude: number,
    longitude: number
  ): Promise<OrderResult> {
    // First verify the order
    const quote = await this.verifyOrder(items, latitude, longitude);

    if (!quote.isValid) {
      throw new Error(quote.errorMessage || 'Order is not valid');
    }

    // Execute in a transaction with pessimistic locking
    const order = await prisma.$transaction(async (tx) => {
      // Collect all (warehouseId, productId) pairs we need to lock
      const stocksToLock: Array<{ warehouseId: string; productId: string; quantity: number }> = [];

      for (const itemQuote of quote.items) {
        for (const shipment of itemQuote.shipments) {
          stocksToLock.push({
            warehouseId: shipment.warehouseId,
            productId: itemQuote.productId,
            quantity: shipment.quantity,
          });
        }
      }

      // Lock all relevant warehouse_stocks rows with SELECT FOR UPDATE
      const warehouseIds = [...new Set(stocksToLock.map((s) => s.warehouseId))];
      const productIds = [...new Set(stocksToLock.map((s) => s.productId))];

      const lockedStocks = await tx.$queryRaw<
        Array<{ id: string; warehouseId: string; productId: string; quantity: number }>
      >`
        SELECT id, "warehouseId", "productId", quantity 
        FROM "warehouse_stocks" 
        WHERE "warehouseId" = ANY(${warehouseIds})
        AND "productId" = ANY(${productIds})
        FOR UPDATE
      `;

      // Verify stock is still sufficient for each (warehouse, product) combination
      for (const stockToLock of stocksToLock) {
        const lockedStock = lockedStocks.find(
          (ls) =>
            ls.warehouseId === stockToLock.warehouseId && ls.productId === stockToLock.productId
        );

        if (!lockedStock || lockedStock.quantity < stockToLock.quantity) {
          throw new Error(
            `Insufficient stock at warehouse for product. ` +
              `Requested: ${stockToLock.quantity}, Available: ${lockedStock?.quantity ?? 0}`
          );
        }
      }

      // Create the order
      const orderNumber = this.generateOrderNumber();
      const status: OrderStatus = 'COMPLETED';

      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          status,
          customerLat: quote.customerLatitude,
          customerLong: quote.customerLongitude,
          subtotalCents: quote.discount.originalAmountCents,
          discountCents: quote.discount.discountAmountCents,
          shippingCents: quote.totalShippingCostCents,
          totalCents: quote.grandTotalCents,
          items: {
            create: quote.items.map((itemQuote) => ({
              productId: itemQuote.productId,
              quantity: itemQuote.quantity,
              unitPriceCents: itemQuote.unitPriceCents,
              subtotalCents: itemQuote.subtotalCents,
              shipments: {
                create: itemQuote.shipments.map((s) => ({
                  warehouseId: s.warehouseId,
                  quantity: s.quantity,
                  distanceKm: s.distanceKm,
                  shippingCents: s.shippingCostCents,
                })),
              },
            })),
          },
        },
        include: {
          items: {
            include: {
              shipments: true,
            },
          },
        },
      });

      // Update warehouse stock for each shipment
      for (const stockToLock of stocksToLock) {
        await tx.warehouseStock.update({
          where: {
            warehouseId_productId: {
              warehouseId: stockToLock.warehouseId,
              productId: stockToLock.productId,
            },
          },
          data: {
            quantity: {
              decrement: stockToLock.quantity,
            },
          },
        });
      }

      return createdOrder;
    });

    return { order, quote };
  }

  /**
   * Get an order by ID
   */
  async getOrder(
    id: string
  ): Promise<
    | (Order & {
        items: (OrderItem & {
          product: Product;
          shipments: (OrderShipment & { warehouse: Warehouse })[];
        })[];
      })
    | null
  > {
    return prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
            shipments: {
              include: {
                warehouse: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get an order by order number
   */
  async getOrderByNumber(
    orderNumber: string
  ): Promise<
    | (Order & {
        items: (OrderItem & {
          product: Product;
          shipments: (OrderShipment & { warehouse: Warehouse })[];
        })[];
      })
    | null
  > {
    return prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            product: true,
            shipments: {
              include: {
                warehouse: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * List all orders
   */
  async listOrders(): Promise<
    (Order & {
      items: (OrderItem & {
        product: Product;
        shipments: (OrderShipment & { warehouse: Warehouse })[];
      })[];
    })[]
  > {
    return prisma.order.findMany({
      include: {
        items: {
          include: {
            product: true,
            shipments: {
              include: {
                warehouse: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all warehouses with their stock levels
   */
  async getWarehousesWithStock(): Promise<
    (Warehouse & {
      stocks: (WarehouseStock & { product: Product })[];
    })[]
  > {
    return prisma.warehouse.findMany({
      include: {
        stocks: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }
}

/**
 * Singleton instance of the order service
 */
export const orderService = new OrderService();

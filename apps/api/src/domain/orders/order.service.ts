/**
 * Order Service
 *
 * Handles order verification and submission with:
 * - Quote generation without database write (verify)
 * - Order submission with transaction and pessimistic locking (submit)
 * - Automatic stock updates
 */

import { nanoid } from 'nanoid';
import { Decimal as DecimalJS } from 'decimal.js';
import { prisma } from '../../lib/prisma.js';
import { WarehouseOptimizer, WarehouseData } from '../logistics/warehouse-optimizer.js';
import { calculateDiscount, DiscountResult } from '../pricing/discount.js';
import { checkShippingValidity, ShippingValidityResult } from '../pricing/shipping.js';
import type { Order, OrderShipment, OrderStatus, Product, Warehouse } from '../../generated/prisma/client.js';

/**
 * Convert Prisma Decimal to number
 * Prisma returns Decimal as an object with toString() method
 */
function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object' && 'toString' in value) {
    return new DecimalJS(value.toString()).toNumber();
  }
  return Number(value);
}

/**
 * Shipment details in a quote/order
 */
export interface ShipmentDetail {
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  distanceKm: number;
  shippingCostCents: number;
}

/**
 * Order quote result (verification without DB write)
 */
export interface OrderQuote {
  /** Whether the order can be fulfilled and is valid */
  isValid: boolean;
  /** Validation error message if not valid */
  errorMessage: string | null;
  /** Requested quantity */
  quantity: number;
  /** Customer coordinates */
  customerLatitude: number;
  customerLongitude: number;
  /** Product details */
  product: {
    id: string;
    name: string;
    unitPriceCents: number;
    weightGrams: number;
  };
  /** Discount calculation */
  discount: DiscountResult;
  /** Shipment allocations */
  shipments: ShipmentDetail[];
  /** Total shipping cost */
  totalShippingCostCents: number;
  /** Shipping validity check */
  shippingValidity: ShippingValidityResult;
  /** Grand total (after discount + shipping) */
  grandTotalCents: number;
}

/**
 * Submitted order result
 */
export interface OrderResult {
  /** The created order */
  order: Order & { shipments: OrderShipment[] };
  /** The quote used for this order */
  quote: OrderQuote;
}

/**
 * Order Service class
 *
 * Provides methods for verifying and submitting orders.
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
   * Normalized product type with number types
   */
  private normalizeProduct(product: Product): {
    id: string;
    name: string;
    unitPriceCents: number;
    weightGrams: number;
  } {
    return {
      id: product.id,
      name: product.name,
      unitPriceCents: product.priceInCents,
      weightGrams: product.weightGrams,
    };
  }

  /**
   * Get the product for ordering
   * Currently assumes single product system
   */
  private async getProduct(): Promise<Product> {
    const product = await prisma.product.findFirst();
    if (!product) {
      throw new Error('No product found in database');
    }
    return product;
  }

  /**
   * Get all warehouses with stock
   */
  private async getWarehouses(): Promise<Warehouse[]> {
    return prisma.warehouse.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Convert Prisma warehouses to optimizer format
   */
  private toWarehouseData(warehouses: Warehouse[], weightGrams: number): WarehouseData[] {
    return warehouses.map((wh) => ({
      id: wh.id,
      name: wh.name,
      latitude: toNumber(wh.latitude),
      longitude: toNumber(wh.longitude),
      stock: wh.stock,
      weightGrams,
    }));
  }

  /**
   * Verify an order without saving to database
   *
   * Use this to get a quote before submitting.
   *
   * @param quantity - Number of units to order
   * @param latitude - Customer latitude
   * @param longitude - Customer longitude
   * @returns Order quote with pricing and validity
   */
  async verifyOrder(
    quantity: number,
    latitude: number,
    longitude: number
  ): Promise<OrderQuote> {
    // Validate inputs
    if (quantity < 1) {
      return this.createInvalidQuote(
        quantity,
        latitude,
        longitude,
        'Quantity must be at least 1'
      );
    }

    if (latitude < -90 || latitude > 90) {
      return this.createInvalidQuote(
        quantity,
        latitude,
        longitude,
        'Latitude must be between -90 and 90'
      );
    }

    if (longitude < -180 || longitude > 180) {
      return this.createInvalidQuote(
        quantity,
        latitude,
        longitude,
        'Longitude must be between -180 and 180'
      );
    }

    // Get product and warehouses
    const rawProduct = await this.getProduct();
    const product = this.normalizeProduct(rawProduct);
    const warehouses = await this.getWarehouses();
    const warehouseData = this.toWarehouseData(warehouses, product.weightGrams);

    // Find optimal shipments
    const optimization = this.optimizer.findOptimalShipments(
      latitude,
      longitude,
      quantity,
      warehouseData
    );

    // Check if we can fulfill the order
    if (!optimization.canFulfill) {
      return this.createInvalidQuote(
        quantity,
        latitude,
        longitude,
        `Insufficient stock. Requested: ${quantity}, Available: ${optimization.fulfilledQuantity}`,
        rawProduct
      );
    }

    // Calculate discount
    const discount = calculateDiscount(quantity, product.unitPriceCents);

    // Check shipping validity
    const shippingValidity = checkShippingValidity(
      optimization.totalShippingCostCents,
      discount.finalAmountCents
    );

    // Calculate grand total
    const grandTotalCents = discount.finalAmountCents + optimization.totalShippingCostCents;

    // Build shipment details
    const shipments: ShipmentDetail[] = optimization.shipments.map((s) => ({
      warehouseId: s.warehouseId,
      warehouseName: s.warehouseName,
      quantity: s.quantity,
      distanceKm: s.distanceKm,
      shippingCostCents: s.shippingCostCents,
    }));

    return {
      isValid: shippingValidity.isValid,
      errorMessage: shippingValidity.isValid
        ? null
        : `Shipping cost exceeds 15% of order amount. Shipping: ${shippingValidity.shippingPercentage}%`,
      quantity,
      customerLatitude: latitude,
      customerLongitude: longitude,
      product: {
        id: product.id,
        name: product.name,
        unitPriceCents: product.unitPriceCents,
        weightGrams: product.weightGrams,
      },
      discount,
      shipments,
      totalShippingCostCents: optimization.totalShippingCostCents,
      shippingValidity,
      grandTotalCents,
    };
  }

  /**
   * Create an invalid quote response
   */
  private async createInvalidQuote(
    quantity: number,
    latitude: number,
    longitude: number,
    errorMessage: string,
    rawProduct?: Product
  ): Promise<OrderQuote> {
    const prod = rawProduct || (await this.getProduct().catch(() => null));
    const normalizedProd = prod ? this.normalizeProduct(prod) : null;

    return {
      isValid: false,
      errorMessage,
      quantity,
      customerLatitude: latitude,
      customerLongitude: longitude,
      product: normalizedProd
        ? normalizedProd
        : {
            id: '',
            name: 'Unknown',
            unitPriceCents: 0,
            weightGrams: 0,
          },
      discount: {
        originalAmountCents: 0,
        discountPercentage: 0,
        discountAmountCents: 0,
        finalAmountCents: 0,
      },
      shipments: [],
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
   * 2. Uses a transaction with SELECT FOR UPDATE to lock warehouse rows
   * 3. Updates warehouse stock atomically
   * 4. Creates order and shipment records
   *
   * @param quantity - Number of units to order
   * @param latitude - Customer latitude
   * @param longitude - Customer longitude
   * @returns Created order with shipments
   * @throws Error if order is invalid or cannot be fulfilled
   */
  async submitOrder(
    quantity: number,
    latitude: number,
    longitude: number
  ): Promise<OrderResult> {
    // First verify the order
    const quote = await this.verifyOrder(quantity, latitude, longitude);

    if (!quote.isValid) {
      throw new Error(quote.errorMessage || 'Order is not valid');
    }

    // Execute in a transaction with pessimistic locking
    const order = await prisma.$transaction(async (tx) => {
      // Lock warehouse rows with SELECT FOR UPDATE
      // This prevents race conditions when multiple orders are submitted
      const warehouseIds = quote.shipments.map((s) => s.warehouseId);

      // Get fresh warehouse data with lock
      const lockedWarehouses = await tx.$queryRaw<Warehouse[]>`
        SELECT * FROM "warehouses" 
        WHERE id = ANY(${warehouseIds})
        FOR UPDATE
      `;

      // Verify stock is still sufficient
      for (const shipment of quote.shipments) {
        const warehouse = lockedWarehouses.find((w) => w.id === shipment.warehouseId);
        if (!warehouse || warehouse.stock < shipment.quantity) {
          throw new Error(
            `Insufficient stock at warehouse ${shipment.warehouseName}. ` +
              `Requested: ${shipment.quantity}, Available: ${warehouse?.stock ?? 0}`
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
          quantity: quote.quantity,
          customerLat: quote.customerLatitude,
          customerLong: quote.customerLongitude,
          subtotalCents: quote.discount.originalAmountCents,
          discountCents: quote.discount.discountAmountCents,
          shippingCents: quote.totalShippingCostCents,
          totalCents: quote.grandTotalCents,
          shipments: {
            create: quote.shipments.map((s) => ({
              warehouseId: s.warehouseId,
              quantity: s.quantity,
              distanceKm: s.distanceKm,
              shippingCents: s.shippingCostCents,
            })),
          },
        },
        include: {
          shipments: true,
        },
      });

      // Update warehouse stock
      for (const shipment of quote.shipments) {
        await tx.warehouse.update({
          where: { id: shipment.warehouseId },
          data: {
            stock: {
              decrement: shipment.quantity,
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
  async getOrder(id: string): Promise<(Order & { shipments: OrderShipment[] }) | null> {
    return prisma.order.findUnique({
      where: { id },
      include: { shipments: true },
    });
  }

  /**
   * Get an order by order number
   */
  async getOrderByNumber(
    orderNumber: string
  ): Promise<(Order & { shipments: OrderShipment[] }) | null> {
    return prisma.order.findUnique({
      where: { orderNumber },
      include: { shipments: true },
    });
  }

  /**
   * List all orders
   */
  async listOrders(): Promise<(Order & { shipments: OrderShipment[] })[]> {
    return prisma.order.findMany({
      include: { shipments: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}

/**
 * Singleton instance of the order service
 */
export const orderService = new OrderService();


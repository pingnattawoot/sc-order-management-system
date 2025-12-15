/**
 * Order GraphQL Types
 *
 * Orders contain multiple OrderItems, each with their own shipments.
 */

import { builder } from '../builder.js';
import { OrderShipmentType } from './shipment.js';

/**
 * Order status enum
 */
export const OrderStatusEnum = builder.enumType('OrderStatus', {
  description: 'Status of an order',
  values: {
    PENDING: { value: 'PENDING', description: 'Order is pending processing' },
    COMPLETED: { value: 'COMPLETED', description: 'Order has been completed' },
    CANCELLED: { value: 'CANCELLED', description: 'Order has been cancelled' },
  } as const,
});

/**
 * Product reference in order item
 */
export const OrderItemProductType = builder.objectRef<{
  id: string;
  name: string;
  sku: string;
  priceInCents: number;
}>('OrderItemProduct');

builder.objectType(OrderItemProductType, {
  description: 'Product reference in an order item',
  fields: (t) => ({
    id: t.exposeID('id', { description: 'Product ID' }),
    name: t.exposeString('name', { description: 'Product name' }),
    sku: t.exposeString('sku', { description: 'Product SKU' }),
    priceInCents: t.exposeInt('priceInCents', {
      description: 'Product price in cents',
    }),
  }),
});

/**
 * Order item type - a line item in an order
 */
export const OrderItemType = builder.objectRef<{
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPriceCents: number;
  subtotalCents: number;
  createdAt: Date;
  product?: {
    id: string;
    name: string;
    sku: string;
    priceInCents: number;
  };
  shipments?: Array<{
    id: string;
    orderItemId: string;
    warehouseId: string;
    quantity: number;
    distanceKm: { toString(): string };
    shippingCents: number;
    createdAt: Date;
    warehouse?: {
      id: string;
      name: string;
      latitude?: { toString(): string };
      longitude?: { toString(): string };
    };
  }>;
}>('OrderItem');

builder.objectType(OrderItemType, {
  description: 'A line item in an order',
  fields: (t) => ({
    id: t.exposeID('id', { description: 'Unique order item identifier' }),
    productId: t.exposeID('productId', { description: 'Product ID' }),
    quantity: t.exposeInt('quantity', { description: 'Quantity ordered' }),
    unitPriceCents: t.exposeInt('unitPriceCents', {
      description: 'Unit price at time of order (cents)',
    }),
    subtotalCents: t.exposeInt('subtotalCents', {
      description: 'Item subtotal (unitPrice × quantity)',
    }),
    product: t.field({
      type: OrderItemProductType,
      description: 'Product details',
      nullable: true,
      resolve: (item) => item.product ?? null,
    }),
    shipments: t.field({
      type: [OrderShipmentType],
      description: 'Shipments fulfilling this item',
      resolve: (item) => item.shipments ?? [],
    }),
    createdAt: t.field({
      type: 'DateTime',
      description: 'When the item was created',
      resolve: (item) => item.createdAt.toISOString(),
    }),
  }),
});

/**
 * Order type - now uses items instead of quantity/shipments
 */
export const OrderType = builder.objectRef<{
  id: string;
  orderNumber: string;
  customerLat: { toString(): string };
  customerLong: { toString(): string };
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
  items?: Array<{
    id: string;
    orderId: string;
    productId: string;
    quantity: number;
    unitPriceCents: number;
    subtotalCents: number;
    createdAt: Date;
    product?: {
      id: string;
      name: string;
      sku: string;
      priceInCents: number;
    };
    shipments?: Array<{
      id: string;
      orderItemId: string;
      warehouseId: string;
      quantity: number;
      distanceKm: { toString(): string };
      shippingCents: number;
      createdAt: Date;
      warehouse?: {
        id: string;
        name: string;
        latitude?: { toString(): string };
        longitude?: { toString(): string };
      };
    }>;
  }>;
}>('Order');

builder.objectType(OrderType, {
  description: 'A completed order with multiple items',
  fields: (t) => ({
    id: t.exposeID('id', { description: 'Unique order identifier' }),
    orderNumber: t.exposeString('orderNumber', {
      description: 'Human-readable order number (ORD-XXXXX)',
    }),
    customerLatitude: t.field({
      type: 'Decimal',
      description: 'Customer latitude',
      resolve: (o) => o.customerLat.toString(),
    }),
    customerLongitude: t.field({
      type: 'Decimal',
      description: 'Customer longitude',
      resolve: (o) => o.customerLong.toString(),
    }),
    subtotalCents: t.exposeInt('subtotalCents', {
      description: 'Subtotal before discount in cents',
    }),
    discountCents: t.exposeInt('discountCents', {
      description: 'Discount amount in cents',
    }),
    shippingCents: t.exposeInt('shippingCents', {
      description: 'Total shipping cost in cents',
    }),
    totalCents: t.exposeInt('totalCents', {
      description: 'Grand total in cents',
    }),
    status: t.field({
      type: OrderStatusEnum,
      description: 'Order status',
      resolve: (o) => o.status,
    }),
    items: t.field({
      type: [OrderItemType],
      description: 'Order line items',
      resolve: (o) => o.items ?? [],
    }),
    // Computed: total quantity across all items
    totalQuantity: t.int({
      description: 'Total quantity across all items',
      resolve: (o) => (o.items ?? []).reduce((sum, item) => sum + item.quantity, 0),
    }),
    createdAt: t.field({
      type: 'DateTime',
      description: 'When the order was created',
      resolve: (o) => o.createdAt.toISOString(),
    }),
    updatedAt: t.field({
      type: 'DateTime',
      description: 'When the order was last updated',
      resolve: (o) => o.updatedAt.toISOString(),
    }),
  }),
});

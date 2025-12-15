/**
 * Order GraphQL Types
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
 * Order type
 */
export const OrderType = builder.objectRef<{
  id: string;
  orderNumber: string;
  quantity: number;
  customerLat: { toString(): string };
  customerLong: { toString(): string };
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
  shipments?: Array<{
    id: string;
    orderId: string;
    warehouseId: string;
    quantity: number;
    distanceKm: { toString(): string };
    shippingCents: number;
    createdAt: Date;
    warehouse?: {
      id: string;
      name: string;
    };
  }>;
}>('Order');

builder.objectType(OrderType, {
  description: 'A completed order',
  fields: (t) => ({
    id: t.exposeID('id', { description: 'Unique order identifier' }),
    orderNumber: t.exposeString('orderNumber', {
      description: 'Human-readable order number (ORD-XXXXX)',
    }),
    quantity: t.exposeInt('quantity', {
      description: 'Total quantity ordered',
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
    subtotalFormatted: t.string({
      description: 'Subtotal formatted as currency',
      resolve: (o) => `$${(o.subtotalCents / 100).toFixed(2)}`,
    }),
    discountCents: t.exposeInt('discountCents', {
      description: 'Discount amount in cents',
    }),
    discountFormatted: t.string({
      description: 'Discount formatted as currency',
      resolve: (o) => `$${(o.discountCents / 100).toFixed(2)}`,
    }),
    shippingCents: t.exposeInt('shippingCents', {
      description: 'Total shipping cost in cents',
    }),
    shippingFormatted: t.string({
      description: 'Shipping formatted as currency',
      resolve: (o) => `$${(o.shippingCents / 100).toFixed(2)}`,
    }),
    totalCents: t.exposeInt('totalCents', {
      description: 'Grand total in cents',
    }),
    totalFormatted: t.string({
      description: 'Total formatted as currency',
      resolve: (o) => `$${(o.totalCents / 100).toFixed(2)}`,
    }),
    status: t.field({
      type: OrderStatusEnum,
      description: 'Order status',
      resolve: (o) => o.status,
    }),
    shipments: t.field({
      type: [OrderShipmentType],
      description: 'Shipments for this order',
      resolve: (o) => o.shipments ?? [],
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


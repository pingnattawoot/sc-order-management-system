/**
 * Shipment GraphQL Types
 *
 * Shipments track which warehouses fulfilled order items.
 */

import { builder } from '../builder.js';

/**
 * Shipment detail type (used in quotes - before order is persisted)
 */
export const ShipmentDetailType = builder.objectRef<{
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  distanceKm: number;
  shippingCostCents: number;
}>('ShipmentDetail');

builder.objectType(ShipmentDetailType, {
  description: 'Details of a shipment from a single warehouse',
  fields: (t) => ({
    warehouseId: t.exposeID('warehouseId', {
      description: 'ID of the warehouse',
    }),
    warehouseName: t.exposeString('warehouseName', {
      description: 'Name of the warehouse',
    }),
    quantity: t.exposeInt('quantity', {
      description: 'Number of units shipped from this warehouse',
    }),
    distanceKm: t.float({
      description: 'Distance in kilometers to customer',
      resolve: (s) => s.distanceKm,
    }),
    shippingCostCents: t.exposeInt('shippingCostCents', {
      description: 'Shipping cost in cents for this shipment',
    }),
  }),
});

/**
 * Order shipment type (persisted in database)
 * Now links to OrderItem instead of Order directly
 */
export const OrderShipmentType = builder.objectRef<{
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
}>('OrderShipment');

builder.objectType(OrderShipmentType, {
  description: 'A shipment record for an order item',
  fields: (t) => ({
    id: t.exposeID('id', { description: 'Unique shipment identifier' }),
    orderItemId: t.exposeID('orderItemId', {
      description: 'ID of the order item this shipment fulfills',
    }),
    warehouseId: t.exposeID('warehouseId', {
      description: 'ID of the source warehouse',
    }),
    warehouseName: t.string({
      description: 'Name of the source warehouse',
      nullable: true,
      resolve: (s) => s.warehouse?.name ?? null,
    }),
    warehouseLatitude: t.field({
      type: 'Decimal',
      description: 'Warehouse latitude',
      nullable: true,
      resolve: (s) => s.warehouse?.latitude?.toString() ?? null,
    }),
    warehouseLongitude: t.field({
      type: 'Decimal',
      description: 'Warehouse longitude',
      nullable: true,
      resolve: (s) => s.warehouse?.longitude?.toString() ?? null,
    }),
    quantity: t.exposeInt('quantity', {
      description: 'Number of units in this shipment',
    }),
    distanceKm: t.field({
      type: 'Decimal',
      description: 'Distance in kilometers',
      resolve: (s) => s.distanceKm.toString(),
    }),
    shippingCents: t.exposeInt('shippingCents', {
      description: 'Shipping cost in cents',
    }),
    createdAt: t.field({
      type: 'DateTime',
      description: 'When the shipment was created',
      resolve: (s) => s.createdAt.toISOString(),
    }),
  }),
});

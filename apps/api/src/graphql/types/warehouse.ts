/**
 * Warehouse GraphQL Types
 *
 * Warehouses store products with per-product stock levels via WarehouseStock.
 */

import { builder } from '../builder.js';

/**
 * Product reference type for warehouse stock
 */
export const StockProductType = builder.objectRef<{
  id: string;
  name: string;
  sku: string;
}>('StockProduct');

builder.objectType(StockProductType, {
  description: 'Product reference in warehouse stock',
  fields: (t) => ({
    id: t.exposeID('id', { description: 'Product ID' }),
    name: t.exposeString('name', { description: 'Product name' }),
    sku: t.exposeString('sku', { description: 'Product SKU' }),
  }),
});

/**
 * Warehouse stock type - tracks quantity of a product at a warehouse
 */
export const WarehouseStockType = builder.objectRef<{
  id: string;
  warehouseId: string;
  productId: string;
  quantity: number;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
}>('WarehouseStock');

builder.objectType(WarehouseStockType, {
  description: 'Stock level of a product at a warehouse',
  fields: (t) => ({
    id: t.exposeID('id', { description: 'Unique stock record identifier' }),
    productId: t.exposeID('productId', { description: 'Product ID' }),
    quantity: t.exposeInt('quantity', { description: 'Stock quantity' }),
    product: t.field({
      type: StockProductType,
      description: 'Product details',
      nullable: true,
      resolve: (s) => s.product ?? null,
    }),
  }),
});

/**
 * Warehouse type representing distribution centers
 * Now includes stocks array instead of a single stock field
 */
export const WarehouseType = builder.objectRef<{
  id: string;
  name: string;
  latitude: { toString(): string };
  longitude: { toString(): string };
  createdAt: Date;
  updatedAt: Date;
  stocks?: Array<{
    id: string;
    warehouseId: string;
    productId: string;
    quantity: number;
    product?: {
      id: string;
      name: string;
      sku: string;
    };
  }>;
}>('Warehouse');

builder.objectType(WarehouseType, {
  description: 'A warehouse/distribution center',
  fields: (t) => ({
    id: t.exposeID('id', { description: 'Unique warehouse identifier' }),
    name: t.exposeString('name', { description: 'Warehouse name/location' }),
    latitude: t.field({
      type: 'Decimal',
      description: 'Latitude coordinate',
      resolve: (wh) => wh.latitude.toString(),
    }),
    longitude: t.field({
      type: 'Decimal',
      description: 'Longitude coordinate',
      resolve: (wh) => wh.longitude.toString(),
    }),
    stocks: t.field({
      type: [WarehouseStockType],
      description: 'Stock levels per product at this warehouse',
      resolve: (wh) => wh.stocks ?? [],
    }),
    createdAt: t.field({
      type: 'DateTime',
      description: 'When the warehouse was created',
      resolve: (wh) => wh.createdAt.toISOString(),
    }),
    updatedAt: t.field({
      type: 'DateTime',
      description: 'When the warehouse was last updated',
      resolve: (wh) => wh.updatedAt.toISOString(),
    }),
  }),
});

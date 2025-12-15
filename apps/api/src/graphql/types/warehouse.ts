/**
 * Warehouse GraphQL Type
 */

import { builder } from '../builder.js';

/**
 * Warehouse type representing distribution centers
 */
export const WarehouseType = builder.objectRef<{
  id: string;
  name: string;
  latitude: { toString(): string };
  longitude: { toString(): string };
  stock: number;
  createdAt: Date;
  updatedAt: Date;
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
    stock: t.exposeInt('stock', {
      description: 'Current stock level',
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


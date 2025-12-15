/**
 * Product GraphQL Type
 */

import { builder } from '../builder.js';

/**
 * Product type representing items available for sale
 */
export const ProductType = builder.objectRef<{
  id: string;
  sku: string;
  name: string;
  description: string | null;
  priceInCents: number;
  weightGrams: number;
  createdAt: Date;
  updatedAt: Date;
}>('Product');

builder.objectType(ProductType, {
  description: 'A product available for sale',
  fields: (t) => ({
    id: t.exposeID('id', { description: 'Unique product identifier' }),
    sku: t.exposeString('sku', { description: 'Stock Keeping Unit code' }),
    name: t.exposeString('name', { description: 'Product name' }),
    description: t.exposeString('description', {
      description: 'Product description',
      nullable: true,
    }),
    priceInCents: t.exposeInt('priceInCents', {
      description: 'Price in cents (e.g., 15000 = $150.00).',
    }),
    weightGrams: t.exposeInt('weightGrams', {
      description: 'Weight in grams',
    }),
    createdAt: t.field({
      type: 'DateTime',
      description: 'When the product was created',
      resolve: (product) => product.createdAt.toISOString(),
    }),
    updatedAt: t.field({
      type: 'DateTime',
      description: 'When the product was last updated',
      resolve: (product) => product.updatedAt.toISOString(),
    }),
  }),
});


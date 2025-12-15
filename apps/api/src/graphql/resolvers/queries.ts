/**
 * GraphQL Query Resolvers
 *
 * Implements read operations for products, warehouses, and orders.
 */

import { builder } from '../builder.js';
import { ProductType } from '../types/product.js';
import { WarehouseType } from '../types/warehouse.js';
import { OrderType } from '../types/order.js';
import { prisma } from '../../lib/prisma.js';

/**
 * Product Queries
 */
builder.queryField('products', (t) =>
  t.field({
    type: [ProductType],
    description: 'Get all available products',
    resolve: async () => {
      const products = await prisma.product.findMany({
        orderBy: { name: 'asc' },
      });
      return products;
    },
  })
);

builder.queryField('product', (t) =>
  t.field({
    type: ProductType,
    description: 'Get a single product by ID',
    nullable: true,
    args: {
      id: t.arg.id({ required: true, description: 'Product ID' }),
    },
    resolve: async (_, { id }) => {
      const product = await prisma.product.findUnique({
        where: { id: String(id) },
      });
      return product;
    },
  })
);

/**
 * Warehouse Queries
 */
builder.queryField('warehouses', (t) =>
  t.field({
    type: [WarehouseType],
    description: 'Get all warehouses with current stock levels',
    resolve: async () => {
      const warehouses = await prisma.warehouse.findMany({
        orderBy: { name: 'asc' },
      });
      return warehouses;
    },
  })
);

builder.queryField('warehouse', (t) =>
  t.field({
    type: WarehouseType,
    description: 'Get a single warehouse by ID',
    nullable: true,
    args: {
      id: t.arg.id({ required: true, description: 'Warehouse ID' }),
    },
    resolve: async (_, { id }) => {
      const warehouse = await prisma.warehouse.findUnique({
        where: { id: String(id) },
      });
      return warehouse;
    },
  })
);

builder.queryField('totalStock', (t) =>
  t.int({
    description: 'Get total stock across all warehouses',
    resolve: async () => {
      const result = await prisma.warehouse.aggregate({
        _sum: { stock: true },
      });
      return result._sum.stock ?? 0;
    },
  })
);

/**
 * Order Queries
 */
builder.queryField('orders', (t) =>
  t.field({
    type: [OrderType],
    description: 'Get all orders (newest first)',
    args: {
      limit: t.arg.int({
        required: false,
        description: 'Maximum number of orders to return',
      }),
    },
    resolve: async (_, { limit }) => {
      const orders = await prisma.order.findMany({
        include: {
          shipments: {
            include: {
              warehouse: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit ?? undefined,
      });
      return orders;
    },
  })
);

builder.queryField('order', (t) =>
  t.field({
    type: OrderType,
    description: 'Get a single order by ID',
    nullable: true,
    args: {
      id: t.arg.id({ required: true, description: 'Order ID' }),
    },
    resolve: async (_, { id }) => {
      const order = await prisma.order.findUnique({
        where: { id: String(id) },
        include: {
          shipments: {
            include: {
              warehouse: true,
            },
          },
        },
      });
      return order;
    },
  })
);

builder.queryField('orderByNumber', (t) =>
  t.field({
    type: OrderType,
    description: 'Get a single order by order number',
    nullable: true,
    args: {
      orderNumber: t.arg.string({
        required: true,
        description: 'Order number (ORD-XXXXX)',
      }),
    },
    resolve: async (_, { orderNumber }) => {
      const order = await prisma.order.findUnique({
        where: { orderNumber },
        include: {
          shipments: {
            include: {
              warehouse: true,
            },
          },
        },
      });
      return order;
    },
  })
);


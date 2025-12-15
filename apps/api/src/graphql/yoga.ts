/**
 * GraphQL Yoga Server
 *
 * Creates a GraphQL Yoga instance integrated with Fastify.
 * Provides GraphiQL playground in development.
 */

import { createYoga, YogaServerInstance } from 'graphql-yoga';
import { schema } from './schema.js';
import { Context } from './builder.js';
import { nanoid } from 'nanoid';
import { config } from '../config/index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Create the GraphQL Yoga instance
 */
export function createGraphQLServer(): YogaServerInstance<
  { req: FastifyRequest; reply: FastifyReply },
  Context
> {
  return createYoga<{ req: FastifyRequest; reply: FastifyReply }, Context>({
    schema,
    // Enable GraphiQL in development
    graphiql: config.env.isDev
      ? {
          title: 'ScreenCloud OMS - GraphQL API',
          defaultQuery: `# Welcome to ScreenCloud OMS GraphQL API!
#
# All monetary values are in CENTS. Frontend should format for display.
# Example: 15000 cents = $150.00
#
# Multi-product, multi-item order support!

# Get all products
query GetProducts {
  products {
    id
    sku
    name
    priceInCents
    weightGrams
  }
}

# Get all warehouses with stock per product
query GetWarehouses {
  warehouses {
    id
    name
    latitude
    longitude
    stocks {
      productId
      quantity
      product {
        name
        sku
      }
    }
  }
}

# Verify a multi-item order (returns quote without creating order)
# Replace PRODUCT_ID with actual product IDs from GetProducts query
mutation VerifyOrder {
  verifyOrder(input: {
    items: [
      { productId: "PRODUCT_ID", quantity: 50 }
    ]
    latitude: 51.5074
    longitude: -0.1278
  }) {
    isValid
    errorMessage
    items {
      productId
      productName
      quantity
      unitPriceCents
      subtotalCents
      canFulfill
      shipments {
        warehouseName
        quantity
        distanceKm
        shippingCostCents
      }
      shippingCostCents
    }
    subtotalCents
    discount {
      discountPercentage
      tierName
      originalAmountCents
      discountAmountCents
      discountedAmountCents
    }
    totalShippingCostCents
    shippingValidity {
      isValid
      shippingPercentage
    }
    grandTotalCents
    totalQuantity
  }
}

# Submit an order (creates order and updates stock)
# Replace PRODUCT_ID with actual product IDs from GetProducts query
mutation SubmitOrder {
  submitOrder(input: {
    items: [
      { productId: "PRODUCT_ID", quantity: 10 }
    ]
    latitude: 51.5074
    longitude: -0.1278
  }) {
    id
    orderNumber
    totalQuantity
    subtotalCents
    discountCents
    shippingCents
    totalCents
    status
    items {
      productId
      quantity
      unitPriceCents
      product {
        name
        sku
      }
      shipments {
        warehouseName
        quantity
        shippingCents
      }
    }
    createdAt
  }
}

# Get all orders
query GetOrders {
  orders(limit: 10) {
    orderNumber
    totalQuantity
    totalCents
    status
    items {
      product {
        name
      }
      quantity
    }
    createdAt
  }
}
`,
        }
      : false,
    // Logging
    logging: config.env.isDev,
    // Context factory
    context: async ({ req }): Promise<Context> => {
      // Generate request ID for tracing
      const requestId = (req.headers['x-request-id'] as string) || nanoid();
      return { requestId };
    },
    // Mask errors in production
    maskedErrors: config.env.isProd,
  });
}

/**
 * GraphQL endpoint path
 */
export const GRAPHQL_ENDPOINT = '/graphql';

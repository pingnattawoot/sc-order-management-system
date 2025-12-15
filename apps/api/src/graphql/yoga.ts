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
# Try these queries:

# Get all warehouses
query GetWarehouses {
  warehouses {
    id
    name
    latitude
    longitude
    stock
  }
  totalStock
}

# Verify an order (returns quote without creating order)
mutation VerifyOrder {
  verifyOrder(input: {
    quantity: 10
    latitude: 51.5074
    longitude: -0.1278
  }) {
    isValid
    errorMessage
    quantity
    product {
      name
      unitPriceFormatted
    }
    discount {
      discountPercentage
      tierName
      discountFormatted
    }
    shipments {
      warehouseName
      quantity
      distanceKm
      shippingCostFormatted
    }
    totalShippingFormatted
    shippingValidity {
      isValid
      shippingPercentage
    }
    grandTotalFormatted
  }
}

# Submit an order (creates order and updates stock)
mutation SubmitOrder {
  submitOrder(input: {
    quantity: 10
    latitude: 51.5074
    longitude: -0.1278
  }) {
    id
    orderNumber
    quantity
    subtotalFormatted
    discountFormatted
    shippingFormatted
    totalFormatted
    status
    shipments {
      warehouseName
      quantity
      shippingFormatted
    }
    createdAt
  }
}

# Get all orders
query GetOrders {
  orders(limit: 10) {
    orderNumber
    quantity
    totalFormatted
    status
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


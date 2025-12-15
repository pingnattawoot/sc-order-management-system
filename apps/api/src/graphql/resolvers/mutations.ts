/**
 * GraphQL Mutation Resolvers
 *
 * Implements write operations for order verification and submission.
 */

import { GraphQLError } from 'graphql';
import { builder } from '../builder.js';
import { OrderQuoteType } from '../types/quote.js';
import { OrderType } from '../types/order.js';
import { orderService } from '../../domain/orders/order.service.js';

/**
 * Input type for order operations
 */
const OrderInput = builder.inputType('OrderInput', {
  description: 'Input for creating or verifying an order',
  fields: (t) => ({
    quantity: t.int({
      required: true,
      description: 'Number of units to order (minimum 1)',
    }),
    latitude: t.float({
      required: true,
      description: 'Customer latitude (-90 to 90)',
    }),
    longitude: t.float({
      required: true,
      description: 'Customer longitude (-180 to 180)',
    }),
  }),
});

/**
 * Verify Order Mutation
 *
 * Returns a quote without creating an order.
 * Use this to show the customer what they'll pay before confirming.
 */
builder.mutationField('verifyOrder', (t) =>
  t.field({
    type: OrderQuoteType,
    description:
      'Verify an order and get a quote (does not create the order). Returns pricing breakdown, shipment allocation, and validity status.',
    args: {
      input: t.arg({ type: OrderInput, required: true }),
    },
    resolve: async (_, { input }) => {
      try {
        const quote = await orderService.verifyOrder(
          input.quantity,
          input.latitude,
          input.longitude
        );

        return quote;
      } catch (error) {
        throw new GraphQLError(error instanceof Error ? error.message : 'Failed to verify order', {
          extensions: { code: 'VERIFICATION_ERROR' },
        });
      }
    },
  })
);

/**
 * Submit Order Mutation
 *
 * Creates an order and updates warehouse stock.
 * Uses pessimistic locking to prevent race conditions.
 */
builder.mutationField('submitOrder', (t) =>
  t.field({
    type: OrderType,
    description:
      'Submit an order and create it in the database. Updates warehouse stock with pessimistic locking.',
    args: {
      input: t.arg({ type: OrderInput, required: true }),
    },
    resolve: async (_, { input }) => {
      try {
        const result = await orderService.submitOrder(
          input.quantity,
          input.latitude,
          input.longitude
        );

        // Fetch the order with shipments and warehouse info for the response
        const order = await orderService.getOrder(result.order.id);

        if (!order) {
          throw new GraphQLError('Order created but could not be retrieved', {
            extensions: { code: 'INTERNAL_ERROR' },
          });
        }

        return order;
      } catch (error) {
        // Re-throw GraphQL errors as-is
        if (error instanceof GraphQLError) {
          throw error;
        }

        // Handle specific error types
        if (error instanceof Error) {
          if (error.message.includes('Insufficient stock')) {
            throw new GraphQLError(error.message, {
              extensions: { code: 'INSUFFICIENT_STOCK' },
            });
          }
          if (error.message.includes('Invalid')) {
            throw new GraphQLError(error.message, {
              extensions: { code: 'VALIDATION_ERROR' },
            });
          }
        }

        throw new GraphQLError(error instanceof Error ? error.message : 'Failed to submit order', {
          extensions: { code: 'ORDER_ERROR' },
        });
      }
    },
  })
);

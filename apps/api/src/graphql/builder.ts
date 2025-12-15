/**
 * Pothos GraphQL Schema Builder
 *
 * Central configuration for building the GraphQL schema.
 * Uses Pothos for type-safe schema construction.
 *
 * @see https://pothos-graphql.dev/
 */

import SchemaBuilder from '@pothos/core';
import { GraphQLError } from 'graphql';
import { Decimal } from 'decimal.js';

/**
 * Context type for GraphQL resolvers
 */
export interface Context {
  /** Request ID for tracing */
  requestId: string;
}

/**
 * Initialize the Pothos schema builder
 */
const builder = new SchemaBuilder<{
  Context: Context;
  Scalars: {
    Decimal: {
      Input: string | number;
      Output: string;
    };
    DateTime: {
      Input: Date | string;
      Output: string;
    };
  };
}>({});

/**
 * Decimal Scalar
 *
 * Used for precise monetary values and distances.
 * Input: string or number
 * Output: string (to preserve precision)
 */
builder.scalarType('Decimal', {
  description: 'Decimal scalar for precise numeric values (money, distances)',
  serialize: (value: unknown) => {
    if (typeof value === 'object' && value !== null && 'toString' in value) {
      return (value as { toString(): string }).toString();
    }
    return String(value);
  },
  parseValue: (value: unknown) => {
    if (typeof value !== 'string' && typeof value !== 'number') {
      throw new GraphQLError('Decimal must be a string or number');
    }
    try {
      return new Decimal(value).toString();
    } catch {
      throw new GraphQLError(`Invalid decimal value: ${value}`);
    }
  },
});

/**
 * DateTime Scalar
 *
 * ISO 8601 formatted date strings.
 */
builder.scalarType('DateTime', {
  description: 'DateTime scalar in ISO 8601 format',
  serialize: (value: unknown) => {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return String(value);
  },
  parseValue: (value: unknown) => {
    if (typeof value !== 'string') {
      throw new GraphQLError('DateTime must be a string');
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new GraphQLError(`Invalid date: ${value}`);
    }
    return date.toISOString();
  },
});

/**
 * Query type placeholder
 * Will be extended by type definitions
 */
builder.queryType({});

/**
 * Mutation type placeholder
 * Will be extended by type definitions
 */
builder.mutationType({});

export { builder };


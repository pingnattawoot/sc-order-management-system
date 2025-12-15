/**
 * GraphQL Schema
 *
 * Builds and exports the complete GraphQL schema.
 * All types and resolvers are registered via imports.
 */

import { builder } from './builder.js';

// Import all types (registers them with the builder)
import './types/index.js';

// Import all resolvers (registers them with the builder)
import './resolvers/index.js';

/**
 * Build and export the GraphQL schema
 */
export const schema = builder.toSchema();


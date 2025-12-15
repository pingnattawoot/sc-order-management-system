/**
 * Generate GraphQL Schema File
 *
 * Outputs the schema to a .graphql file for:
 * - Client code generation
 * - Documentation
 * - Schema diffing
 */

import { writeFileSync } from 'fs';
import { printSchema } from 'graphql';
import { schema } from '../src/graphql/schema.js';

const SCHEMA_PATH = 'src/graphql/schema.graphql';

console.log('📝 Generating GraphQL schema...');

const schemaString = printSchema(schema);

writeFileSync(SCHEMA_PATH, schemaString, 'utf-8');

console.log(`✅ Schema written to ${SCHEMA_PATH}`);
console.log(`   ${schemaString.split('\n').length} lines`);


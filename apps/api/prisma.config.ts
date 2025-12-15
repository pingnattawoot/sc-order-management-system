/**
 * Prisma Configuration File (Prisma 7)
 *
 * This file centralizes Prisma configuration for the project.
 * See: https://www.prisma.io/docs/orm/reference/prisma-config-reference
 */

import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  // Path to the Prisma schema file
  schema: 'prisma/schema.prisma',

  // Migrations configuration
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },

  // Datasource configuration
  // Using process.env directly to allow running `prisma generate` without DATABASE_URL
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});

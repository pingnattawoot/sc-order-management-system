/**
 * Prisma Client Singleton
 *
 * Creates a singleton instance of PrismaClient with the pg adapter for Prisma 7.
 * This ensures we don't create multiple database connections.
 */

import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { config } from '../config/index.js';

// Create PostgreSQL connection pool
const pool = new pg.Pool({
  connectionString: config.database.url,
  // Connection pool settings
  max: 20, // Maximum number of connections
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Return error after 2s if connection not available
});

// Create Prisma adapter
const adapter = new PrismaPg(pool);

// Create singleton PrismaClient instance
export const prisma = new PrismaClient({ adapter });

/**
 * Gracefully disconnect from the database
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
  await pool.end();
}

/**
 * Check database connection health
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}


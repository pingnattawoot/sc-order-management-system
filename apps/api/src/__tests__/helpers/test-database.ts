/**
 * Test Database Helper
 *
 * Provides safe, isolated database access for integration tests.
 *
 * SAFETY FEATURES:
 * 1. Uses testcontainers for fully isolated PostgreSQL instances
 * 2. Validates database URLs to prevent accidental production access
 * 3. Requires explicit TEST_DATABASE_URL for non-container tests
 *
 * @module test-database
 */

import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

/**
 * Pattern to detect potentially unsafe database URLs
 * Production URLs typically contain:
 * - Cloud provider hostnames (aws, azure, gcp, heroku, railway, etc.)
 * - Production-related keywords
 */
const UNSAFE_URL_PATTERNS = [
  /\.amazonaws\.com/i,
  /\.azure\.com/i,
  /\.gcp\.com/i,
  /\.heroku\.com/i,
  /\.railway\.app/i,
  /\.supabase\.co/i,
  /\.neon\.tech/i,
  /\.planetscale\.com/i,
  /\.cockroachlabs\.cloud/i,
  /production/i,
  /prod\./i,
  /\.prod/i,
  /live\./i,
  /\.live/i,
];

/**
 * Pattern to detect safe database URLs
 */
const SAFE_URL_PATTERNS = [
  /localhost/i,
  /127\.0\.0\.1/,
  /::1/,
  /host\.docker\.internal/i,
  /test/i,
  /dev/i,
  /local/i,
];

/**
 * Validates a database URL is safe for testing
 * @throws Error if URL appears to be a production database
 */
export function validateTestDatabaseUrl(url: string): void {
  // Check for unsafe patterns
  for (const pattern of UNSAFE_URL_PATTERNS) {
    if (pattern.test(url)) {
      throw new Error(
        `🚨 DANGER: Database URL appears to be a production database!\n` +
          `URL matched unsafe pattern: ${pattern}\n` +
          `Refusing to run tests against this database.\n\n` +
          `To run integration tests safely:\n` +
          `1. Use testcontainers (recommended): pnpm test:integration\n` +
          `2. Use a local test database with TEST_DATABASE_URL`
      );
    }
  }

  // Check for at least one safe pattern
  const isSafe = SAFE_URL_PATTERNS.some((pattern) => pattern.test(url));
  if (!isSafe) {
    throw new Error(
      `⚠️ WARNING: Database URL doesn't match any known safe patterns.\n` +
        `URL: ${url.replace(/:[^:@]+@/, ':****@')}\n` + // Hide password
        `Expected patterns: localhost, 127.0.0.1, or containing 'test', 'dev', 'local'\n\n` +
        `If this is intentional, set ALLOW_UNSAFE_TEST_DB=true`
    );
  }
}

/**
 * Test Database Container
 *
 * Manages a PostgreSQL container for isolated integration testing.
 * Each test run gets a fresh, empty database.
 */
export class TestDatabaseContainer {
  private container: StartedPostgreSqlContainer | null = null;
  private pool: pg.Pool | null = null;
  private prismaClient: PrismaClient | null = null;

  /**
   * Start a new PostgreSQL container
   */
  async start(): Promise<void> {
    console.log('🐳 Starting PostgreSQL test container...');

    this.container = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('test_db')
      .withUsername('test')
      .withPassword('test')
      .start();

    const connectionString = this.container.getConnectionUri();
    console.log(`✅ Test container ready at ${connectionString.replace(/:[^:@]+@/, ':****@')}`);

    // Set up Prisma with the container
    this.pool = new pg.Pool({ connectionString });
    const adapter = new PrismaPg(this.pool);
    this.prismaClient = new PrismaClient({ adapter });
  }

  /**
   * Get the Prisma client connected to the test container
   */
  get prisma(): PrismaClient {
    if (!this.prismaClient) {
      throw new Error('Test container not started. Call start() first.');
    }
    return this.prismaClient;
  }

  /**
   * Get the connection string for migrations
   */
  get connectionString(): string {
    if (!this.container) {
      throw new Error('Test container not started. Call start() first.');
    }
    return this.container.getConnectionUri();
  }

  /**
   * Run Prisma migrations against the test container
   */
  async migrate(): Promise<void> {
    if (!this.container) {
      throw new Error('Test container not started. Call start() first.');
    }

    const { execSync } = await import('child_process');
    execSync('pnpm db:migrate:deploy', {
      env: {
        ...process.env,
        DATABASE_URL: this.connectionString,
      },
      stdio: 'inherit',
    });
  }

  /**
   * Seed the test database
   */
  async seed(): Promise<void> {
    if (!this.container) {
      throw new Error('Test container not started. Call start() first.');
    }

    const { execSync } = await import('child_process');
    execSync('pnpm db:seed', {
      env: {
        ...process.env,
        DATABASE_URL: this.connectionString,
      },
      stdio: 'inherit',
    });
  }

  /**
   * Clean up all data (for resetting between tests)
   */
  async reset(): Promise<void> {
    if (!this.prismaClient) return;

    // Delete in order respecting foreign keys
    await this.prismaClient.orderShipment.deleteMany();
    await this.prismaClient.order.deleteMany();
    await this.prismaClient.warehouse.deleteMany();
    await this.prismaClient.product.deleteMany();
  }

  /**
   * Stop and remove the container
   */
  async stop(): Promise<void> {
    console.log('🛑 Stopping test container...');

    if (this.prismaClient) {
      await this.prismaClient.$disconnect();
      this.prismaClient = null;
    }

    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }

    if (this.container) {
      await this.container.stop();
      this.container = null;
    }

    console.log('✅ Test container stopped');
  }
}

// Global container instance for test reuse
let globalContainer: TestDatabaseContainer | null = null;

/**
 * Get or create a test database container
 * Reuses the same container across test files for performance
 */
export async function getTestContainer(): Promise<TestDatabaseContainer> {
  if (!globalContainer) {
    globalContainer = new TestDatabaseContainer();
    await globalContainer.start();
    await globalContainer.migrate();
    await globalContainer.seed();
  }
  return globalContainer;
}

/**
 * Stop the global test container
 */
export async function stopTestContainer(): Promise<void> {
  if (globalContainer) {
    await globalContainer.stop();
    globalContainer = null;
  }
}


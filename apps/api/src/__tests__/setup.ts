/**
 * Test Setup
 *
 * Global test configuration and setup that runs before each test file.
 *
 * SAFETY FEATURES:
 * - Validates TEST_DATABASE_URL to prevent accidental production access
 * - Requires explicit test database URL (not the default DATABASE_URL)
 * - Blocks execution if URL looks like production
 */

import 'dotenv/config';
import { validateTestDatabaseUrl } from './helpers/test-database.js';

// Set test environment
process.env.NODE_ENV = 'test';

/**
 * Validate test database URL on startup
 *
 * This runs when tests start to catch dangerous configurations early.
 */
function validateEnvironment(): void {
  const testDbUrl = process.env.TEST_DATABASE_URL;
  const dbUrl = process.env.DATABASE_URL;

  // If TEST_DATABASE_URL is set, validate it
  if (testDbUrl) {
    try {
      validateTestDatabaseUrl(testDbUrl);
      // Use TEST_DATABASE_URL for all database operations in tests
      process.env.DATABASE_URL = testDbUrl;
      console.log('✅ Using TEST_DATABASE_URL for tests');
    } catch (error) {
      console.error((error as Error).message);
      process.exit(1);
    }
    return;
  }

  // If only DATABASE_URL is set, validate it's safe
  if (dbUrl) {
    // Skip validation if explicitly allowed (for CI with safe URLs)
    if (process.env.ALLOW_UNSAFE_TEST_DB === 'true') {
      console.warn('⚠️ ALLOW_UNSAFE_TEST_DB=true - Skipping database URL validation');
      return;
    }

    try {
      validateTestDatabaseUrl(dbUrl);
      console.log('✅ DATABASE_URL validated as safe for testing');
    } catch (error) {
      console.error((error as Error).message);
      console.error('\n💡 TIP: Set TEST_DATABASE_URL to a dedicated test database');
      process.exit(1);
    }
  }

  // No database URL - integration tests will be skipped
  // This is fine for unit tests
}

// Run validation
validateEnvironment();

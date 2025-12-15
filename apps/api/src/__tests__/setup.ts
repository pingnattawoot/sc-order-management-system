/**
 * Test Setup
 *
 * Global test configuration and setup that runs before each test file.
 */

import 'dotenv/config';

// Set test environment
process.env.NODE_ENV = 'test';

// Suppress console output during tests unless explicitly needed
// Uncomment the following to silence logs during tests:
// vi.spyOn(console, 'log').mockImplementation(() => {});
// vi.spyOn(console, 'info').mockImplementation(() => {});


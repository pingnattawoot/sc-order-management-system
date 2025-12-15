import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use globals for describe, it, expect without imports
    globals: true,

    // Environment for running tests
    environment: 'node',

    // Include patterns for test files (only *.test.ts files)
    include: ['src/**/*.test.ts'],

    // Exclude patterns
    exclude: ['node_modules', 'dist', 'src/generated'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'src/generated/',
        '**/*.test.ts',
        '**/__tests__/**',
        'vitest.config.ts',
      ],
    },

    // Test timeout (in milliseconds)
    testTimeout: 10000,

    // Setup files to run before each test file
    setupFiles: ['src/__tests__/setup.ts'],

    // Pool options for parallel execution
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true, // Use single fork for database tests
      },
    },
  },
});


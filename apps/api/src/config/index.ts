/**
 * Application Configuration
 *
 * Centralized configuration management using environment variables.
 */

import 'dotenv/config';

export const config = {
  /** Server configuration */
  server: {
    port: parseInt(process.env.PORT ?? '4000', 10),
    host: process.env.HOST ?? '0.0.0.0',
  },

  /** Database configuration */
  database: {
    url: process.env.DATABASE_URL ?? '',
  },

  /** Environment */
  env: {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    isDev: process.env.NODE_ENV !== 'production',
    isProd: process.env.NODE_ENV === 'production',
  },

  /** Logging */
  logging: {
    level: process.env.LOG_LEVEL ?? 'info',
  },
} as const;

export type Config = typeof config;


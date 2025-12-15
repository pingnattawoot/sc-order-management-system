/**
 * Fastify Server Setup
 *
 * Configures and creates the Fastify server instance with:
 * - Logging (pino)
 * - CORS
 * - Health check endpoint
 * - Graceful shutdown
 */

import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { config } from './config/index.js';
import { checkDatabaseHealth, disconnectPrisma } from './lib/prisma.js';

/**
 * Build and configure the Fastify server
 */
export async function buildServer(): Promise<FastifyInstance> {
  const server = Fastify({
    logger: {
      level: config.logging.level,
      transport: config.env.isDev
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
    },
  });

  // Register CORS
  await server.register(cors, {
    origin: config.env.isDev ? true : false, // Allow all origins in dev
    credentials: true,
  });

  // Health check endpoint
  server.get('/health', async (_request, reply) => {
    const dbHealthy = await checkDatabaseHealth();

    const status = {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbHealthy ? 'connected' : 'disconnected',
    };

    if (!dbHealthy) {
      return reply.status(503).send(status);
    }

    return reply.send(status);
  });

  // Root endpoint
  server.get('/', async (_request, reply) => {
    return reply.send({
      name: 'ScreenCloud Order Management System API',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        graphql: '/graphql',
      },
    });
  });

  // Graceful shutdown handler
  const gracefulShutdown = async (signal: string) => {
    server.log.info(`Received ${signal}. Shutting down gracefully...`);

    try {
      await server.close();
      await disconnectPrisma();
      server.log.info('Server shut down successfully');
      process.exit(0);
    } catch (err) {
      server.log.error(err, 'Error during shutdown');
      process.exit(1);
    }
  };

  // Register shutdown handlers
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  return server;
}


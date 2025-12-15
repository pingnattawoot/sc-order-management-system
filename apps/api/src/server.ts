/**
 * Fastify Server Setup
 *
 * Configures and creates the Fastify server instance with:
 * - Logging (pino)
 * - CORS
 * - GraphQL API (via GraphQL Yoga)
 * - Health check endpoint
 * - Graceful shutdown
 */

import cors from '@fastify/cors';
import Fastify, { FastifyInstance } from 'fastify';
import { config } from './config/index.js';
import { createGraphQLServer, GRAPHQL_ENDPOINT } from './graphql/index.js';
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
        graphql: GRAPHQL_ENDPOINT,
        graphiql: config.env.isDev ? GRAPHQL_ENDPOINT : undefined,
      },
    });
  });

  // GraphQL endpoint (via GraphQL Yoga)
  const yoga = createGraphQLServer();

  server.route({
    url: GRAPHQL_ENDPOINT,
    method: ['GET', 'POST', 'OPTIONS'],
    handler: async (request, reply) => {
      // Build a standard Request object from Fastify request
      const url = `${request.protocol}://${request.hostname}${request.url}`;
      const headers = new Headers();
      for (const [key, value] of Object.entries(request.headers)) {
        if (value) {
          headers.set(key, Array.isArray(value) ? value.join(', ') : value);
        }
      }

      const req = new Request(url, {
        method: request.method,
        headers,
        body:
          request.method !== 'GET' && request.method !== 'HEAD'
            ? JSON.stringify(request.body)
            : undefined,
      });

      // Handle the request with Yoga
      const response = await yoga.handle(req, { req: request, reply });

      // Set response headers
      for (const [key, value] of response.headers.entries()) {
        reply.header(key, value);
      }

      reply.status(response.status);

      // Send response body
      const body = await response.text();
      return reply.send(body);
    },
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

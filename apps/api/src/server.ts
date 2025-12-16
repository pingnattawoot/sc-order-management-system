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
import { checkDatabaseHealth, disconnectPrisma, prisma } from './lib/prisma.js';

// Seed data constants
const SEED_DATA = {
  products: [
    {
      sku: 'SCOS-P1-PRO',
      name: 'SCOS Station P1 Pro',
      description: 'ScreenCloud OS Station P1 Pro - A powerful digital signage player',
      priceInCents: 15000,
      weightGrams: 365,
    },
    {
      sku: 'PIXI',
      name: 'Pixi',
      description:
        "ScreenCloud's budget-friendly, plug-and-play digital signage media player, designed to easily turn any screen into a dynamic display, running on Android 14 with ScreenCloud's own OS, offering 4K, 4GB RAM, 64GB storage, and remote management for simple, affordable, enterprise-ready content display in places like education, healthcare, or retail.",
      priceInCents: 9900,
      weightGrams: 200,
    },
  ],
  warehouses: [
    { name: 'Los Angeles', latitude: 33.9425, longitude: -118.408056 },
    { name: 'New York', latitude: 40.639722, longitude: -73.778889 },
    { name: 'São Paulo', latitude: -23.435556, longitude: -46.473056 },
    { name: 'Paris', latitude: 49.009722, longitude: 2.547778 },
    { name: 'Warsaw', latitude: 52.165833, longitude: 20.967222 },
    { name: 'Hong Kong', latitude: 22.308889, longitude: 113.914444 },
  ],
  stockLevels: {
    'Los Angeles': [355, 500],
    'New York': [578, 750],
    'São Paulo': [265, 300],
    Paris: [694, 850],
    Warsaw: [245, 400],
    'Hong Kong': [419, 600],
  } as Record<string, number[]>,
};

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

  // Register CORS - allow all origins for demo purposes
  // In production, you'd restrict this to specific domains
  await server.register(cors, {
    origin: true, // Allow all origins for demo
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
        graphqlPlayground: config.env.isDev ? GRAPHQL_ENDPOINT : undefined,
        resetDemo: '/api/reset-demo',
      },
    });
  });

  // Reset/Seed endpoint for demo purposes
  // Usage: POST /api/reset-demo?productCount=1 (or 2)
  // This resets the database to initial state with seed data
  server.post<{ Querystring: { productCount?: string } }>(
    '/api/reset-demo',
    async (request, reply) => {
      try {
        // Parse productCount from query (default to 1 for single product mode)
        const productCount = Math.min(
          Math.max(parseInt(request.query.productCount || '1') || 1, 1),
          SEED_DATA.products.length
        );

        server.log.info(
          `🔄 Resetting database to demo state (${productCount} product${productCount > 1 ? 's' : ''})...`
        );

        // Delete all existing data (in correct order due to foreign keys)
        await prisma.orderShipment.deleteMany({});
        await prisma.orderItem.deleteMany({});
        await prisma.order.deleteMany({});
        await prisma.warehouseStock.deleteMany({});
        await prisma.warehouse.deleteMany({});
        await prisma.product.deleteMany({});

        server.log.info('   ✓ Cleared existing data');

        // Seed products (only the requested count)
        const products = [];
        const productsToSeed = SEED_DATA.products.slice(0, productCount);
        for (const productData of productsToSeed) {
          const product = await prisma.product.create({ data: productData });
          products.push(product);
        }
        server.log.info(`   ✓ Created ${products.length} products`);

        // Seed warehouses
        const warehouses = [];
        for (const warehouseData of SEED_DATA.warehouses) {
          const warehouse = await prisma.warehouse.create({ data: warehouseData });
          warehouses.push(warehouse);
        }
        server.log.info(`   ✓ Created ${warehouses.length} warehouses`);

        // Seed warehouse stocks
        let stockCount = 0;
        for (const warehouse of warehouses) {
          const stockLevels = SEED_DATA.stockLevels[warehouse.name];
          if (!stockLevels) continue;

          for (let i = 0; i < products.length; i++) {
            const product = products[i];
            if (!product) continue;
            await prisma.warehouseStock.create({
              data: {
                warehouseId: warehouse.id,
                productId: product.id,
                quantity: stockLevels[i] ?? 0,
              },
            });
            stockCount++;
          }
        }
        server.log.info(`   ✓ Created ${stockCount} stock entries`);

        server.log.info('✅ Database reset complete!');

        return reply.send({
          success: true,
          message: 'Database reset to demo state',
          data: {
            products: products.length,
            warehouses: warehouses.length,
            stockEntries: stockCount,
          },
        });
      } catch (error) {
        server.log.error(error, 'Failed to reset database');
        return reply.status(500).send({
          success: false,
          message: 'Failed to reset database',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

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

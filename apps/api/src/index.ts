/**
 * Application Entry Point
 *
 * Starts the Fastify server and handles startup errors.
 */

import { buildServer } from './server.js';
import { config } from './config/index.js';

async function main() {
  try {
    const server = await buildServer();

    await server.listen({
      port: config.server.port,
      host: config.server.host,
    });

    const port = config.server.port;
    console.log(`
╔════════════════════════════════════════════════════════════╗
║  ScreenCloud Order Management System                       ║
╠════════════════════════════════════════════════════════════╣
║  🚀 Server running at http://localhost:${port.toString().padEnd(5)}              ║
║  📊 Health check: http://localhost:${port}/health             ║
║  🔮 GraphQL API:  http://localhost:${port}/graphql            ║
${config.env.isDev ? `║  📝 GraphiQL:    http://localhost:${port}/graphql            ║\n` : ''}╚════════════════════════════════════════════════════════════╝
    `);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

main();


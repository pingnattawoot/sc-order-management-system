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
    console.log('\n📦 ScreenCloud Order Management System\n');
    console.log(`   🚀 Server:     http://localhost:${port}`);
    console.log(`   📊 Health:     http://localhost:${port}/health`);
    console.log(`   🔮 GraphQL:    http://localhost:${port}/graphql`);
    if (config.env.isDev) {
      console.log(`   📝 Playground: http://localhost:${port}/graphql`);
    }
    console.log('');
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

main();


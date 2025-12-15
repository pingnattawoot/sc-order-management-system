/**
 * Prisma Database Seed Script
 *
 * Seeds the database with initial data:
 * - 2 Products: SCOS Station P1 Pro, SCOS Mount Kit
 * - 6 Warehouses worldwide
 * - Stock levels per product per warehouse
 *
 * Run with: pnpm db:seed
 */

import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

// Create PostgreSQL connection pool
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create Prisma adapter and client
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// =============================================
// Seed Data
// =============================================

const PRODUCTS = [
  {
    sku: 'SCOS-P1-PRO',
    name: 'SCOS Station P1 Pro',
    description:
      'ScreenCloud OS Station P1 Pro - A powerful digital signage player for enterprise deployments',
    priceInCents: 15000, // $150.00
    weightGrams: 365, // 365g
  },
  {
    sku: 'SCOS-MOUNT-KIT',
    name: 'SCOS Mount Kit',
    description:
      'Universal VESA mount kit compatible with all SCOS Station devices',
    priceInCents: 2500, // $25.00
    weightGrams: 120, // 120g
  },
];

// Warehouse locations (without stock - stock is now per product)
const WAREHOUSES = [
  {
    name: 'Los Angeles',
    latitude: 33.9425,
    longitude: -118.408056,
  },
  {
    name: 'New York',
    latitude: 40.639722,
    longitude: -73.778889,
  },
  {
    name: 'São Paulo',
    latitude: -23.435556,
    longitude: -46.473056,
  },
  {
    name: 'Paris',
    latitude: 49.009722,
    longitude: 2.547778,
  },
  {
    name: 'Warsaw',
    latitude: 52.165833,
    longitude: 20.967222,
  },
  {
    name: 'Hong Kong',
    latitude: 22.308889,
    longitude: 113.914444,
  },
];

// Stock levels per warehouse per product [P1 Pro, Mount Kit]
const STOCK_LEVELS: Record<string, number[]> = {
  'Los Angeles': [355, 500],
  'New York': [578, 750],
  'São Paulo': [265, 300],
  Paris: [694, 850],
  Warsaw: [245, 400],
  'Hong Kong': [419, 600],
};

// =============================================
// Seed Functions
// =============================================

async function seedProducts() {
  console.log('🌱 Seeding products...');

  const createdProducts = [];

  for (const productData of PRODUCTS) {
    const product = await prisma.product.upsert({
      where: { sku: productData.sku },
      update: productData,
      create: productData,
    });

    createdProducts.push(product);
    console.log(`   ✓ ${product.name} (${product.sku})`);
    console.log(`     Price: $${(product.priceInCents / 100).toFixed(2)}`);
    console.log(`     Weight: ${product.weightGrams}g`);
  }

  return createdProducts;
}

async function seedWarehouses() {
  console.log('🌱 Seeding warehouses...');

  const createdWarehouses = [];

  for (const warehouseData of WAREHOUSES) {
    const warehouse = await prisma.warehouse.upsert({
      where: { name: warehouseData.name },
      update: {
        latitude: warehouseData.latitude,
        longitude: warehouseData.longitude,
      },
      create: warehouseData,
    });

    createdWarehouses.push(warehouse);
    console.log(
      `   ✓ ${warehouse.name} (${warehouse.latitude}, ${warehouse.longitude})`
    );
  }

  return createdWarehouses;
}

async function seedWarehouseStocks(
  products: Array<{ id: string; sku: string; name: string }>,
  warehouses: Array<{ id: string; name: string }>
) {
  console.log('🌱 Seeding warehouse stocks...');

  const stockTotals: Record<string, number> = {};

  for (const warehouse of warehouses) {
    const stockLevels = STOCK_LEVELS[warehouse.name];
    if (!stockLevels) continue;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const quantity = stockLevels[i] ?? 0;

      await prisma.warehouseStock.upsert({
        where: {
          warehouseId_productId: {
            warehouseId: warehouse.id,
            productId: product.id,
          },
        },
        update: { quantity },
        create: {
          warehouseId: warehouse.id,
          productId: product.id,
          quantity,
        },
      });

      // Track totals per product
      stockTotals[product.sku] = (stockTotals[product.sku] ?? 0) + quantity;
    }

    console.log(
      `   ✓ ${warehouse.name}: ${stockLevels.map((s, i) => `${products[i]?.sku}: ${s}`).join(', ')}`
    );
  }

  console.log('');
  console.log('   📦 Global stock totals:');
  for (const [sku, total] of Object.entries(stockTotals)) {
    console.log(`      ${sku}: ${total} units`);
  }
}

// =============================================
// Main
// =============================================

async function main() {
  console.log('');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  ScreenCloud OMS - Database Seeder         ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('');

  const products = await seedProducts();
  console.log('');
  const warehouses = await seedWarehouses();
  console.log('');
  await seedWarehouseStocks(products, warehouses);

  console.log('');
  console.log('✅ Database seeding complete!');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

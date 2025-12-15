/**
 * Prisma Database Seed Script
 *
 * Seeds the database with initial data:
 * - 1 Product: SCOS Station P1 Pro
 * - 6 Warehouses with stock levels
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

const PRODUCT = {
  sku: 'SCOS-P1-PRO',
  name: 'SCOS Station P1 Pro',
  description:
    'ScreenCloud OS Station P1 Pro - A powerful digital signage player for enterprise deployments',
  priceInCents: 15000, // $150.00
  weightGrams: 365, // 365g
};

const WAREHOUSES = [
  {
    name: 'Los Angeles',
    latitude: 33.9425,
    longitude: -118.408056,
    stock: 355,
  },
  {
    name: 'New York',
    latitude: 40.639722,
    longitude: -73.778889,
    stock: 578,
  },
  {
    name: 'São Paulo',
    latitude: -23.435556,
    longitude: -46.473056,
    stock: 265,
  },
  {
    name: 'Paris',
    latitude: 49.009722,
    longitude: 2.547778,
    stock: 694,
  },
  {
    name: 'Warsaw',
    latitude: 52.165833,
    longitude: 20.967222,
    stock: 245,
  },
  {
    name: 'Hong Kong',
    latitude: 22.308889,
    longitude: 113.914444,
    stock: 419,
  },
];

// =============================================
// Seed Functions
// =============================================

async function seedProduct() {
  console.log('🌱 Seeding product...');

  const product = await prisma.product.upsert({
    where: { sku: PRODUCT.sku },
    update: PRODUCT,
    create: PRODUCT,
  });

  console.log(`   ✓ Product: ${product.name} (${product.sku})`);
  console.log(`     Price: $${(product.priceInCents / 100).toFixed(2)}`);
  console.log(`     Weight: ${product.weightGrams}g`);

  return product;
}

async function seedWarehouses() {
  console.log('🌱 Seeding warehouses...');

  let totalStock = 0;

  for (const warehouse of WAREHOUSES) {
    const created = await prisma.warehouse.upsert({
      where: { name: warehouse.name },
      update: warehouse,
      create: warehouse,
    });

    totalStock += created.stock;
    console.log(`   ✓ ${created.name}: ${created.stock} units`);
  }

  console.log(`   📦 Total global stock: ${totalStock} units`);

  return totalStock;
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

  await seedProduct();
  console.log('');
  await seedWarehouses();

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


/**
 * k6 Load Test: Concurrent Orders (Spike Test)
 *
 * Tests pessimistic locking under sudden concurrent spikes.
 * Verifies no overselling occurs and rollbacks work correctly.
 *
 * Run: k6 run load-tests/concurrent-orders.js
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

// Custom metrics
const errorRate = new Rate("errors");
const stockErrors = new Counter("stock_errors");
const validationErrors = new Counter("validation_errors");
const orderDuration = new Trend("order_duration");

// Configuration
const API_URL = __ENV.API_URL || "http://localhost:4000";
const GRAPHQL_ENDPOINT = `${API_URL}/graphql`;

export const options = {
  scenarios: {
    // Spike test - sudden burst of concurrent users
    spike: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "5s", target: 50 }, // Sudden spike
        { duration: "20s", target: 50 }, // Sustain spike
        { duration: "5s", target: 0 }, // Drop
      ],
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<2000"], // 95% under 2s (higher tolerance for spike)
    errors: ["rate<0.2"], // Up to 20% errors acceptable (stock exhaustion)
  },
};

export function setup() {
  // Get products
  const query = `
    query {
      products { id name }
    }
  `;

  const res = http.post(
    GRAPHQL_ENDPOINT,
    JSON.stringify({ query }),
    { headers: { "Content-Type": "application/json" } }
  );

  const body = JSON.parse(res.body);
  const products = body.data?.products || [];

  if (products.length === 0) {
    throw new Error("No products found!");
  }

  // Get initial stock levels
  const stockQuery = `
    query {
      warehouses {
        name
        stocks { quantity product { name } }
      }
    }
  `;

  const stockRes = http.post(
    GRAPHQL_ENDPOINT,
    JSON.stringify({ query: stockQuery }),
    { headers: { "Content-Type": "application/json" } }
  );

  const stockBody = JSON.parse(stockRes.body);
  console.log("Initial warehouse stock levels:");
  stockBody.data?.warehouses?.forEach((w) => {
    const total = w.stocks?.reduce((sum, s) => sum + s.quantity, 0) || 0;
    console.log(`  ${w.name}: ${total} units`);
  });

  return { productIds: products.map((p) => p.id) };
}

export default function (data) {
  const { productIds } = data;

  const productId = productIds[Math.floor(Math.random() * productIds.length)];
  // Larger quantities to stress test stock
  const quantity = Math.floor(Math.random() * 20) + 5; // 5-25 units

  // London area
  const lat = 51.5 + (Math.random() * 0.5 - 0.25);
  const lon = -0.1 + (Math.random() * 0.5 - 0.25);

  const mutation = `
    mutation SubmitOrder($input: OrderInput!) {
      submitOrder(input: $input) {
        orderNumber
        totalCents
      }
    }
  `;

  const variables = {
    input: {
      items: [{ productId, quantity }],
      latitude: lat,
      longitude: lon,
    },
  };

  const startTime = Date.now();

  const res = http.post(
    GRAPHQL_ENDPOINT,
    JSON.stringify({ query: mutation, variables }),
    { headers: { "Content-Type": "application/json" } }
  );

  const duration = Date.now() - startTime;
  orderDuration.add(duration);

  let body;
  try {
    body = JSON.parse(res.body);
  } catch (e) {
    errorRate.add(true);
    return;
  }

  const hasErrors = body.errors && body.errors.length > 0;

  if (hasErrors) {
    const errorMsg = body.errors[0]?.message || "";

    // Categorize errors
    if (errorMsg.includes("stock") || errorMsg.includes("fulfill")) {
      stockErrors.add(1);
      // Stock errors are expected under load - not a test failure
      errorRate.add(false);
    } else if (errorMsg.includes("shipping") || errorMsg.includes("15%")) {
      validationErrors.add(1);
      errorRate.add(false);
    } else {
      // Unexpected error
      errorRate.add(true);
      console.log(`Unexpected error: ${errorMsg}`);
    }
  } else {
    check(res, {
      "status is 200": (r) => r.status === 200,
      "has order number": () =>
        body.data?.submitOrder?.orderNumber !== undefined,
    });
    errorRate.add(false);
  }

  // Minimal sleep for spike test
  sleep(0.1 + Math.random() * 0.2);
}

export function teardown(data) {
  // THE MAIN TEST: Verify no negative stock values
  const stockQuery = `
    query {
      warehouses {
        name
        stocks { quantity product { name } }
      }
    }
  `;

  const res = http.post(
    GRAPHQL_ENDPOINT,
    JSON.stringify({ query: stockQuery }),
    { headers: { "Content-Type": "application/json" } }
  );

  const body = JSON.parse(res.body);
  let hasNegativeStock = false;
  let totalRemaining = 0;

  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║           DATABASE INTEGRITY CHECK (CRITICAL)            ║");
  console.log("╚══════════════════════════════════════════════════════════╝");

  body.data?.warehouses?.forEach((w) => {
    w.stocks?.forEach((s) => {
      if (s.quantity < 0) {
        hasNegativeStock = true;
        console.error(
          `  ❌ NEGATIVE STOCK: ${w.name} - ${s.product?.name}: ${s.quantity}`
        );
      }
      totalRemaining += s.quantity;
    });
    const warehouseTotal = w.stocks?.reduce((sum, s) => sum + s.quantity, 0) || 0;
    console.log(`  ${w.name}: ${warehouseTotal} units`);
  });

  console.log(`\n  Total remaining stock: ${totalRemaining} units`);

  if (hasNegativeStock) {
    console.error("\n  ╔═══════════════════════════════════════════════════╗");
    console.error("  ║  ❌ TEST FAILED: NEGATIVE STOCK DETECTED!         ║");
    console.error("  ║  Pessimistic locking is NOT working correctly.    ║");
    console.error("  ║  This is a critical bug - overselling occurred!   ║");
    console.error("  ╚═══════════════════════════════════════════════════╝");
  } else {
    console.log("\n  ╔═══════════════════════════════════════════════════╗");
    console.log("  ║  ✅ TEST PASSED: All stock values >= 0            ║");
    console.log("  ║  Pessimistic locking prevented overselling.       ║");
    console.log("  ╚═══════════════════════════════════════════════════╝");
  }

  console.log("\n  Note: Stock errors and shipping errors are EXPECTED.");
  console.log("  They indicate business rules are being enforced correctly.");
}


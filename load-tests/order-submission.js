/**
 * k6 Load Test: Order Submission
 *
 * Tests pessimistic locking behavior under concurrent load.
 * Run: k6 run load-tests/order-submission.js
 *
 * Prerequisites:
 * 1. API running locally: pnpm dev:api
 * 2. Database seeded: pnpm --filter api db:seed
 * 3. k6 installed: brew install k6 (or https://k6.io/docs/get-started/installation/)
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

// Custom metrics
const errorRate = new Rate("errors"); // Only unexpected errors
const orderDuration = new Trend("order_duration");
const successfulOrders = new Counter("successful_orders");
const stockErrors = new Counter("stock_errors"); // Expected: insufficient stock
const shippingErrors = new Counter("shipping_errors"); // Expected: 15% rule
const unexpectedErrors = new Counter("unexpected_errors"); // Real problems

// Configuration
const API_URL = __ENV.API_URL || "http://localhost:4000";
const GRAPHQL_ENDPOINT = `${API_URL}/graphql`;

export const options = {
  scenarios: {
    // Scenario 1: Gradual ramp-up (main test)
    ramp_up: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "15s", target: 10 }, // Warm up
        { duration: "30s", target: 25 }, // Normal load
        { duration: "30s", target: 50 }, // Push limits
        { duration: "30s", target: 50 }, // Sustain
        { duration: "15s", target: 0 }, // Cool down
      ],
      gracefulRampDown: "10s",
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<1000"], // 95% under 1s
    errors: ["rate<0.1"], // Error rate under 10%
    order_duration: ["p(99)<2000"], // 99% orders under 2s
  },
};

// Fetch product IDs on setup
export function setup() {
  const query = `
    query {
      products {
        id
        name
      }
    }
  `;

  const res = http.post(GRAPHQL_ENDPOINT, JSON.stringify({ query }), {
    headers: { "Content-Type": "application/json" },
  });

  const body = JSON.parse(res.body);
  const products = body.data?.products || [];

  if (products.length === 0) {
    throw new Error("No products found! Run: pnpm --filter api db:seed");
  }

  console.log(`Found ${products.length} products for testing`);
  return { productIds: products.map((p) => p.id) };
}

export default function (data) {
  const { productIds } = data;

  // Random product and quantity
  const productId = productIds[Math.floor(Math.random() * productIds.length)];
  const quantity = Math.floor(Math.random() * 5) + 1; // 1-5 units

  // Random location (global spread)
  const locations = [
    { lat: 51.5074, lon: -0.1278 }, // London
    { lat: 40.7128, lon: -74.006 }, // New York
    { lat: 35.6762, lon: 139.6503 }, // Tokyo
    { lat: -23.5505, lon: -46.6333 }, // São Paulo
    { lat: 48.8566, lon: 2.3522 }, // Paris
  ];
  const loc = locations[Math.floor(Math.random() * locations.length)];

  const mutation = `
    mutation SubmitOrder($input: OrderInput!) {
      submitOrder(input: $input) {
        orderNumber
        totalCents
        status
      }
    }
  `;

  const variables = {
    input: {
      items: [{ productId, quantity }],
      latitude: loc.lat + (Math.random() * 2 - 1), // Add some variance
      longitude: loc.lon + (Math.random() * 2 - 1),
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
    failedOrders.add(1);
    return;
  }

  // Check HTTP status
  check(res, {
    "status is 200": (r) => r.status === 200,
  });

  // Categorize the result
  if (body.data?.submitOrder?.orderNumber) {
    // Successful order
    successfulOrders.add(1);
    errorRate.add(false);
  } else if (body.errors && body.errors.length > 0) {
    const errorMsg = body.errors[0]?.message || "";

    // Expected business errors (NOT test failures)
    if (
      errorMsg.includes("stock") ||
      errorMsg.includes("fulfill") ||
      errorMsg.includes("Insufficient")
    ) {
      stockErrors.add(1);
      errorRate.add(false); // Expected error, not a failure
    } else if (
      errorMsg.includes("shipping") ||
      errorMsg.includes("15%") ||
      errorMsg.includes("exceeds")
    ) {
      shippingErrors.add(1);
      errorRate.add(false); // Expected error, not a failure
    } else {
      // Unexpected error - this IS a problem
      unexpectedErrors.add(1);
      errorRate.add(true);
      console.log(`❌ Unexpected error: ${errorMsg}`);
    }
  } else {
    // Unknown response
    unexpectedErrors.add(1);
    errorRate.add(true);
  }

  // Random think time 0.5-1.5s
  sleep(0.5 + Math.random());
}

export function teardown(data) {
  // Verify database integrity - check for negative stock
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

  console.log("\n=== Database Integrity Check ===");
  body.data?.warehouses?.forEach((w) => {
    w.stocks?.forEach((s) => {
      if (s.quantity < 0) {
        hasNegativeStock = true;
        console.error(
          `❌ NEGATIVE STOCK: ${w.name} - ${s.product?.name}: ${s.quantity}`
        );
      }
    });
    const total = w.stocks?.reduce((sum, s) => sum + s.quantity, 0) || 0;
    console.log(`  ${w.name}: ${total} units remaining`);
  });

  if (hasNegativeStock) {
    console.error("\n❌ TEST FAILED: Negative stock detected!");
    console.error(
      "This indicates pessimistic locking is NOT working correctly."
    );
  } else {
    console.log("\n✅ DATABASE INTEGRITY: All stock values >= 0");
    console.log("Pessimistic locking is working correctly.");
  }

  console.log("\n=== Expected Errors ===");
  console.log("- Stock errors: Orders rejected due to insufficient inventory");
  console.log("- Shipping errors: Orders rejected due to 15% shipping rule");
  console.log("These are business validation errors, NOT test failures.");
}

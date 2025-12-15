/**
 * GraphQL Queries
 *
 * All read operations for the OMS frontend
 */

import { gql } from '@apollo/client';

/**
 * Fetch all warehouses with their current stock levels
 */
export const GET_WAREHOUSES = gql`
  query GetWarehouses {
    warehouses {
      id
      name
      latitude
      longitude
      currentStock
      createdAt
    }
    totalStock
  }
`;

/**
 * Fetch all products
 */
export const GET_PRODUCTS = gql`
  query GetProducts {
    products {
      id
      sku
      name
      description
      priceInCents
      weightGrams
    }
  }
`;

/**
 * Fetch order history (most recent first)
 */
export const GET_ORDERS = gql`
  query GetOrders($limit: Int) {
    orders(limit: $limit) {
      id
      orderNumber
      quantity
      customerLatitude
      customerLongitude
      subtotalCents
      discountCents
      shippingCents
      totalCents
      status
      createdAt
      shipments {
        id
        warehouseId
        warehouseName
        quantity
        distanceKm
        shippingCents
      }
    }
  }
`;

/**
 * Fetch a single order by ID
 */
export const GET_ORDER = gql`
  query GetOrder($id: ID!) {
    order(id: $id) {
      id
      orderNumber
      quantity
      customerLatitude
      customerLongitude
      subtotalCents
      discountCents
      shippingCents
      totalCents
      status
      createdAt
      shipments {
        id
        warehouseId
        warehouseName
        quantity
        distanceKm
        shippingCents
      }
    }
  }
`;


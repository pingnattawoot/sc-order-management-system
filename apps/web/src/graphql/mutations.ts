/**
 * GraphQL Mutations
 *
 * All write operations for the OMS frontend
 */

import { gql } from '@apollo/client';

/**
 * Verify an order before submission
 * Returns pricing breakdown and validity status
 */
export const VERIFY_ORDER = gql`
  mutation VerifyOrder($input: OrderInput!) {
    verifyOrder(input: $input) {
      isValid
      product {
        id
        name
        unitPriceCents
        quantity
        subtotalCents
      }
      discount {
        originalAmountCents
        discountAmountCents
        discountedAmountCents
        discountPercentage
        tierName
      }
      shipments {
        warehouseId
        warehouseName
        quantity
        distanceKm
        shippingCostCents
      }
      shippingValidity {
        isValid
        actualShippingCents
        maxAllowedCents
        percentage
      }
      totalShippingCents
      grandTotalCents
      subtotalCents
      insufficientStockMessage
    }
  }
`;

/**
 * Submit a confirmed order
 * Creates the order and updates warehouse stock
 */
export const SUBMIT_ORDER = gql`
  mutation SubmitOrder($input: OrderInput!) {
    submitOrder(input: $input) {
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


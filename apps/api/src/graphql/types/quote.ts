/**
 * Quote GraphQL Types
 *
 * Types for order verification/quoting (multi-item support).
 * Note: All monetary values are in cents.
 */

import { builder } from '../builder.js';
import { ShipmentDetailType } from './shipment.js';

/**
 * Discount result type
 */
export const DiscountResultType = builder.objectRef<{
  originalAmountCents: number;
  discountAmountCents: number;
  discountedAmountCents: number;
  discountPercentage: number;
  tierName: string;
}>('DiscountResult');

builder.objectType(DiscountResultType, {
  description: 'Volume discount calculation result',
  fields: (t) => ({
    originalAmountCents: t.exposeInt('originalAmountCents', {
      description: 'Original amount before discount in cents',
    }),
    discountAmountCents: t.exposeInt('discountAmountCents', {
      description: 'Discount amount in cents',
    }),
    discountedAmountCents: t.exposeInt('discountedAmountCents', {
      description: 'Amount after discount in cents',
    }),
    discountPercentage: t.exposeInt('discountPercentage', {
      description: 'Discount percentage applied (0, 5, 10, 15, or 20)',
    }),
    tierName: t.exposeString('tierName', {
      description: 'Name of the discount tier applied',
    }),
  }),
});

/**
 * Shipping validity result type
 */
export const ShippingValidityType = builder.objectRef<{
  isValid: boolean;
  shippingCostCents: number;
  orderAmountCents: number;
  shippingPercentage: number;
  maxAllowedShippingCents: number;
  overLimitCents: number;
}>('ShippingValidity');

builder.objectType(ShippingValidityType, {
  description: 'Shipping cost validity check result (15% rule)',
  fields: (t) => ({
    isValid: t.exposeBoolean('isValid', {
      description: 'Whether shipping cost is within 15% of discounted subtotal',
    }),
    shippingCostCents: t.exposeInt('shippingCostCents', {
      description: 'Actual shipping cost in cents',
    }),
    orderAmountCents: t.exposeInt('orderAmountCents', {
      description: 'Order amount after discount in cents',
    }),
    shippingPercentage: t.float({
      description: 'Actual shipping as percentage of discounted subtotal',
      resolve: (s) => s.shippingPercentage,
    }),
    maxAllowedShippingCents: t.exposeInt('maxAllowedShippingCents', {
      description: 'Maximum allowed shipping (15% of discounted subtotal)',
    }),
    overLimitCents: t.exposeInt('overLimitCents', {
      description: 'Amount over limit in cents (0 if within limit)',
    }),
  }),
});

/**
 * Quote for a single item in the order
 */
export const OrderItemQuoteType = builder.objectRef<{
  productId: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  subtotalCents: number;
  shipments: Array<{
    warehouseId: string;
    warehouseName: string;
    quantity: number;
    distanceKm: number;
    shippingCostCents: number;
  }>;
  shippingCostCents: number;
  canFulfill: boolean;
  errorMessage: string | null;
}>('OrderItemQuote');

builder.objectType(OrderItemQuoteType, {
  description: 'Quote for a single item in the order',
  fields: (t) => ({
    productId: t.exposeID('productId', { description: 'Product ID' }),
    productName: t.exposeString('productName', { description: 'Product name' }),
    quantity: t.exposeInt('quantity', { description: 'Quantity requested' }),
    unitPriceCents: t.exposeInt('unitPriceCents', { description: 'Unit price in cents' }),
    subtotalCents: t.exposeInt('subtotalCents', {
      description: 'Item subtotal (unitPrice × quantity)',
    }),
    shipments: t.field({
      type: [ShipmentDetailType],
      description: 'Shipment allocations for this item',
      resolve: (q) => q.shipments,
    }),
    shippingCostCents: t.exposeInt('shippingCostCents', {
      description: 'Shipping cost for this item',
    }),
    canFulfill: t.exposeBoolean('canFulfill', {
      description: 'Whether this item can be fulfilled',
    }),
    errorMessage: t.exposeString('errorMessage', {
      description: 'Error message if item cannot be fulfilled',
      nullable: true,
    }),
  }),
});

/**
 * Complete order quote (multi-item)
 */
export const OrderQuoteType = builder.objectRef<{
  isValid: boolean;
  errorMessage: string | null;
  customerLatitude: number;
  customerLongitude: number;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPriceCents: number;
    subtotalCents: number;
    shipments: Array<{
      warehouseId: string;
      warehouseName: string;
      quantity: number;
      distanceKm: number;
      shippingCostCents: number;
    }>;
    shippingCostCents: number;
    canFulfill: boolean;
    errorMessage: string | null;
  }>;
  subtotalCents: number;
  discount: {
    originalAmountCents: number;
    discountAmountCents: number;
    discountedAmountCents: number;
    discountPercentage: number;
    tierName: string;
  };
  totalShippingCostCents: number;
  shippingValidity: {
    isValid: boolean;
    shippingCostCents: number;
    orderAmountCents: number;
    shippingPercentage: number;
    maxAllowedShippingCents: number;
    overLimitCents: number;
  };
  grandTotalCents: number;
}>('OrderQuote');

builder.objectType(OrderQuoteType, {
  description: 'Order verification/quote result (multi-item)',
  fields: (t) => ({
    isValid: t.exposeBoolean('isValid', {
      description: 'Whether the entire order can be fulfilled',
    }),
    errorMessage: t.exposeString('errorMessage', {
      description: 'Error message if not valid',
      nullable: true,
    }),
    customerLatitude: t.float({
      description: 'Customer latitude',
      resolve: (q) => q.customerLatitude,
    }),
    customerLongitude: t.float({
      description: 'Customer longitude',
      resolve: (q) => q.customerLongitude,
    }),
    items: t.field({
      type: [OrderItemQuoteType],
      description: 'Quotes for each item in the order',
      resolve: (q) => q.items,
    }),
    subtotalCents: t.exposeInt('subtotalCents', {
      description: 'Order subtotal before discount',
    }),
    discount: t.field({
      type: DiscountResultType,
      description: 'Discount calculation (applied to total order)',
      resolve: (q) => q.discount,
    }),
    totalShippingCostCents: t.exposeInt('totalShippingCostCents', {
      description: 'Total shipping cost in cents',
    }),
    shippingValidity: t.field({
      type: ShippingValidityType,
      description: 'Shipping cost validity (15% rule)',
      resolve: (q) => q.shippingValidity,
    }),
    grandTotalCents: t.exposeInt('grandTotalCents', {
      description: 'Grand total in cents (discounted subtotal + shipping)',
    }),
    // Computed: total quantity across all items
    totalQuantity: t.int({
      description: 'Total quantity across all items',
      resolve: (q) => q.items.reduce((sum, item) => sum + item.quantity, 0),
    }),
  }),
});

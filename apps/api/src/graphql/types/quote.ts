/**
 * Quote GraphQL Types
 *
 * Types for order verification/quoting.
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
 * Matches domain ShippingValidityResult from pricing/shipping.ts
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
 * Product summary in quote
 */
export const QuoteProductType = builder.objectRef<{
  id: string;
  name: string;
  unitPriceCents: number;
  weightGrams: number;
}>('QuoteProduct');

builder.objectType(QuoteProductType, {
  description: 'Product information in a quote',
  fields: (t) => ({
    id: t.exposeID('id', { description: 'Product ID' }),
    name: t.exposeString('name', { description: 'Product name' }),
    unitPriceCents: t.exposeInt('unitPriceCents', {
      description: 'Unit price in cents',
    }),
    weightGrams: t.exposeInt('weightGrams', {
      description: 'Weight in grams',
    }),
  }),
});

/**
 * Order quote type
 */
export const OrderQuoteType = builder.objectRef<{
  isValid: boolean;
  errorMessage: string | null;
  quantity: number;
  customerLatitude: number;
  customerLongitude: number;
  product: {
    id: string;
    name: string;
    unitPriceCents: number;
    weightGrams: number;
  };
  discount: {
    originalAmountCents: number;
    discountAmountCents: number;
    discountedAmountCents: number;
    discountPercentage: number;
    tierName: string;
  };
  shipments: Array<{
    warehouseId: string;
    warehouseName: string;
    quantity: number;
    distanceKm: number;
    shippingCostCents: number;
  }>;
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
  description: 'Order verification/quote result',
  fields: (t) => ({
    isValid: t.exposeBoolean('isValid', {
      description: 'Whether the order can be fulfilled',
    }),
    errorMessage: t.exposeString('errorMessage', {
      description: 'Error message if not valid',
      nullable: true,
    }),
    quantity: t.exposeInt('quantity', {
      description: 'Requested quantity',
    }),
    customerLatitude: t.float({
      description: 'Customer latitude',
      resolve: (q) => q.customerLatitude,
    }),
    customerLongitude: t.float({
      description: 'Customer longitude',
      resolve: (q) => q.customerLongitude,
    }),
    product: t.field({
      type: QuoteProductType,
      description: 'Product being ordered',
      resolve: (q) => q.product,
    }),
    discount: t.field({
      type: DiscountResultType,
      description: 'Discount calculation',
      resolve: (q) => q.discount,
    }),
    shipments: t.field({
      type: [ShipmentDetailType],
      description: 'Shipment allocations from warehouses',
      resolve: (q) => q.shipments,
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
    subtotalCents: t.int({
      description: 'Subtotal before discount in cents (alias for discount.originalAmountCents)',
      resolve: (q) => q.discount.originalAmountCents,
    }),
  }),
});

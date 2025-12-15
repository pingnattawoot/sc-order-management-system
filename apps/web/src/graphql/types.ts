/**
 * TypeScript types for GraphQL responses
 *
 * These match the GraphQL schema defined in the API
 */

export interface Warehouse {
  id: string;
  name: string;
  latitude: string;
  longitude: string;
  currentStock: number;
  createdAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  priceInCents: number;
  weightGrams: number;
}

export interface OrderShipment {
  id: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  distanceKm: number;
  shippingCents: number;
}

export type OrderStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface Order {
  id: string;
  orderNumber: string;
  quantity: number;
  customerLatitude: string;
  customerLongitude: string;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  status: OrderStatus;
  createdAt: string;
  shipments: OrderShipment[];
}

export interface QuoteProduct {
  id: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
  subtotalCents: number;
}

export interface DiscountResult {
  originalAmountCents: number;
  discountAmountCents: number;
  discountedAmountCents: number;
  discountPercentage: number;
  tierName: string;
}

export interface ShipmentDetail {
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  distanceKm: number;
  shippingCostCents: number;
}

export interface ShippingValidity {
  isValid: boolean;
  actualShippingCents: number;
  maxAllowedCents: number;
  percentage: number;
}

export interface OrderQuote {
  isValid: boolean;
  product: QuoteProduct;
  discount: DiscountResult;
  shipments: ShipmentDetail[];
  shippingValidity: ShippingValidity;
  totalShippingCents: number;
  grandTotalCents: number;
  subtotalCents: number;
  insufficientStockMessage: string | null;
}

// Query response types
export interface GetWarehousesResponse {
  warehouses: Warehouse[];
  totalStock: number;
}

export interface GetProductsResponse {
  products: Product[];
}

export interface GetOrdersResponse {
  orders: Order[];
}

export interface GetOrderResponse {
  order: Order | null;
}

// Mutation response types
export interface VerifyOrderResponse {
  verifyOrder: OrderQuote;
}

export interface SubmitOrderResponse {
  submitOrder: Order;
}

// Input types
export interface OrderInput {
  quantity: number;
  latitude: number;
  longitude: number;
}


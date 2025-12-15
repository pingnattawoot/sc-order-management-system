/**
 * New Order Tab
 *
 * Interactive map for placing multi-item orders:
 * 1. Click map to select delivery location
 * 2. Add items (product + quantity) in sheet
 * 3. Verify order to see pricing and warehouse allocation
 * 4. Submit if valid
 */

import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { WarehouseMap } from '@/components/map';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useGetWarehousesQuery,
  useGetProductsQuery,
  useVerifyOrderMutation,
  useSubmitOrderMutation,
  type VerifyOrderMutation,
  type Warehouse,
  type Product,
  type ShipmentDetail,
} from '@/graphql';

type OrderQuote = NonNullable<VerifyOrderMutation['verifyOrder']>;

// Order item being built
interface OrderItemDraft {
  productId: string;
  quantity: number;
}

// Helper to format cents as currency with comma separators
const formatCurrency = (cents: number | null | undefined) => {
  if (cents == null) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
};

// Helper to format numbers with comma separators
const formatNumber = (num: number | null | undefined) => {
  if (num == null) return '0';
  return new Intl.NumberFormat('en-US').format(num);
};

// Extend Warehouse type to include computed total stock
type WarehouseWithTotalStock = Warehouse & { totalStock?: number };

export function NewOrderTab() {
  // State
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItemDraft[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [quote, setQuote] = useState<OrderQuote | null>(null);

  // Queries & Mutations
  const { data: warehouseData, loading: warehousesLoading, refetch: refetchWarehouses } = useGetWarehousesQuery();
  const { data: productData, loading: productsLoading } = useGetProductsQuery();
  const [verifyOrder, { loading: verifying }] = useVerifyOrderMutation();
  const [submitOrder, { loading: submitting }] = useSubmitOrderMutation();

  const products = useMemo(() => (productData?.products ?? []) as Product[], [productData?.products]);

  // Transform warehouses to include computed total stock for map display
  const warehouses: WarehouseWithTotalStock[] = useMemo(() => {
    return (warehouseData?.warehouses ?? []).map((w) => ({
      ...w,
      totalStock: (w.stocks ?? []).reduce((sum, s) => sum + (s.quantity ?? 0), 0),
    }));
  }, [warehouseData?.warehouses]);

  const totalStock = warehouseData?.totalStock ?? 0;

  // Add a new item to the order
  const handleAddItem = () => {
    if (products.length > 0 && products[0].id) {
      setOrderItems([...orderItems, { productId: products[0].id, quantity: 1 }]);
    }
  };

  // Update an item
  const handleUpdateItem = (index: number, updates: Partial<OrderItemDraft>) => {
    setOrderItems(orderItems.map((item, i) => 
      i === index ? { ...item, ...updates } : item
    ));
  };

  // Remove an item
  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  // Handle map click
  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setSelectedLocation([lat, lng]);
    setQuote(null);
    setIsSheetOpen(true);
    // Add default item if none exist
    if (orderItems.length === 0 && products.length > 0 && products[0].id) {
      setOrderItems([{ productId: products[0].id, quantity: 1 }]);
    }
  }, [orderItems.length, products]);

  // Handle verify
  const handleVerify = async () => {
    if (!selectedLocation || orderItems.length === 0) return;

    try {
      const result = await verifyOrder({
        variables: {
          input: {
            items: orderItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
            latitude: selectedLocation[0],
            longitude: selectedLocation[1],
          },
        },
      });

      if (result.data?.verifyOrder) {
        setQuote(result.data.verifyOrder);
        if (!result.data.verifyOrder.isValid) {
          toast.error(result.data.verifyOrder.errorMessage || 'Order cannot be fulfilled');
        }
      }
    } catch (error) {
      toast.error('Failed to verify order');
      console.error(error);
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!selectedLocation || !quote?.isValid || orderItems.length === 0) return;

    try {
      const result = await submitOrder({
        variables: {
          input: {
            items: orderItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
            latitude: selectedLocation[0],
            longitude: selectedLocation[1],
          },
        },
      });

      if (result.data?.submitOrder) {
        toast.success(`Order ${result.data.submitOrder.orderNumber} placed successfully!`);
        setIsSheetOpen(false);
        setSelectedLocation(null);
        setQuote(null);
        setOrderItems([]);
        refetchWarehouses();
      }
    } catch (error) {
      toast.error('Failed to submit order');
      console.error(error);
    }
  };

  // Reset form
  const handleClose = () => {
    setIsSheetOpen(false);
    setQuote(null);
  };

  // Get all shipment details for map highlighting (flatten from all items)
  const quoteItems = quote?.items;
  const activeShipments: ShipmentDetail[] = useMemo(() => {
    if (!quoteItems) return [];
    return quoteItems.flatMap((item) => item?.shipments ?? []);
  }, [quoteItems]);

  // Get product by ID helper
  const getProduct = (productId: string) => products.find((p) => p.id === productId);

  // Calculate total quantity across all items
  const totalOrderQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Place New Order</h2>
          <p className="text-muted-foreground">
            Click anywhere on the map to select delivery location
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {formatNumber(totalStock)} units available
        </Badge>
      </div>

      {/* Map */}
      {warehousesLoading || productsLoading ? (
        <div className="h-[500px] flex items-center justify-center bg-muted rounded-lg">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <WarehouseMap
          warehouses={warehouses}
          customerLocation={selectedLocation}
          activeShipments={activeShipments}
          onLocationSelect={handleLocationSelect}
          onCustomerMarkerClick={() => setIsSheetOpen(true)}
          isOrderValid={quote?.isValid ?? true}
          height="500px"
        />
      )}

      {/* Order Sheet - transparent overlay to see map */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent transparentOverlay className="overflow-y-auto w-[400px] sm:w-[540px]">
          <SheetHeader className="p-0">
            <SheetTitle>Order Details</SheetTitle>
            <SheetDescription>
              Add items and verify your order before submitting
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 mt-4">
            {/* Location Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Delivery Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Latitude:</span>
                    <span className="ml-2 font-mono">{selectedLocation?.[0].toFixed(4)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Longitude:</span>
                    <span className="ml-2 font-mono">{selectedLocation?.[1].toFixed(4)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Order Items</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleAddItem}>
                    + Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {orderItems.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    No items added yet. Click "Add Item" to start.
                  </p>
                ) : (
                  orderItems.map((item, index) => {
                    const product = getProduct(item.productId);
                    return (
                      <div key={index} className="p-3 border rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground">Product</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveItem(index)}
                          >
                            ×
                          </Button>
                        </div>
                        <Select
                          value={item.productId}
                          onValueChange={(value: string) => handleUpdateItem(index, { productId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((p) => (
                              <SelectItem key={p.id} value={p.id!}>
                                {p.name} ({formatCurrency(p.priceInCents)})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Quantity</Label>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleUpdateItem(index, { quantity: Math.max(1, item.quantity - 10) })}
                              disabled={item.quantity <= 1}
                            >
                              -10
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleUpdateItem(index, { quantity: Math.max(1, item.quantity - 1) })}
                              disabled={item.quantity <= 1}
                            >
                              -
                            </Button>
                            <Input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => handleUpdateItem(index, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                              className="w-20 text-center h-8"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleUpdateItem(index, { quantity: item.quantity + 1 })}
                            >
                              +
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleUpdateItem(index, { quantity: item.quantity + 10 })}
                            >
                              +10
                            </Button>
                          </div>
                        </div>
                        {product && (
                          <div className="text-xs text-muted-foreground">
                            Subtotal: {formatCurrency((product.priceInCents ?? 0) * item.quantity)}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                {orderItems.length > 0 && (
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-sm font-medium">Total Items:</span>
                    <span className="text-sm">{formatNumber(totalOrderQuantity)} units</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Verify Button */}
            <Button
              onClick={handleVerify}
              disabled={verifying || orderItems.length === 0}
              className="w-full"
              variant="secondary"
            >
              {verifying ? 'Verifying...' : 'Verify Order'}
            </Button>

            {/* Quote Results */}
            {quote && (
              <>
                <Separator />

                {/* Validity Status */}
                <div className="flex items-center gap-2">
                  {quote.isValid ? (
                    <Badge className="bg-green-500">✓ Valid Order</Badge>
                  ) : (
                    <Badge variant="destructive">✗ Invalid Order</Badge>
                  )}
                  {!quote.isValid && quote.errorMessage && (
                    <span className="text-sm text-destructive">{quote.errorMessage}</span>
                  )}
                </div>

                {/* Item-level Results */}
                {quote.items && quote.items.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Item Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {quote.items.map((item, i) => (
                        <div key={i} className="p-2 bg-muted rounded text-sm">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{item?.productName}</span>
                            {item?.canFulfill ? (
                              <Badge variant="outline" className="text-green-600">✓</Badge>
                            ) : (
                              <Badge variant="destructive">✗</Badge>
                            )}
                          </div>
                          <div className="text-muted-foreground text-xs mt-1">
                            {formatNumber(item?.quantity)} × {formatCurrency(item?.unitPriceCents)} = {formatCurrency(item?.subtotalCents)}
                          </div>
                          {item?.errorMessage && (
                            <div className="text-destructive text-xs mt-1">{item.errorMessage}</div>
                          )}
                          {item?.shipments && item.shipments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {item.shipments.map((s, si) => (
                                <div key={si} className="text-xs flex justify-between text-muted-foreground">
                                  <span>{s?.warehouseName} ({formatNumber(Math.round(s?.distanceKm ?? 0))}km)</span>
                                  <span>{formatNumber(s?.quantity)} units</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Pricing Breakdown */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Pricing Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal ({formatNumber(quote.totalQuantity)} items)</span>
                      <span>{formatCurrency(quote.subtotalCents)}</span>
                    </div>
                    {(quote.discount?.discountPercentage ?? 0) > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount ({quote.discount?.tierName})</span>
                        <span>-{formatCurrency(quote.discount?.discountAmountCents)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span className={!quote.shippingValidity?.isValid ? 'text-destructive' : ''}>
                        {formatCurrency(quote.totalShippingCostCents)}
                        {!quote.shippingValidity?.isValid && (
                          <span className="ml-1 text-xs">
                            (exceeds {quote.shippingValidity?.shippingPercentage?.toFixed(1)}% limit)
                          </span>
                        )}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-base">
                      <span>Total</span>
                      <span>{formatCurrency(quote.grandTotalCents)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Submit Button */}
                {quote.isValid && (
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full"
                    size="lg"
                  >
                    {submitting ? 'Submitting...' : 'Confirm & Place Order'}
                  </Button>
                )}
              </>
            )}

            {/* Cancel Button */}
            <Button variant="ghost" onClick={handleClose} className="w-full">
              Cancel
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

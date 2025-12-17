/**
 * New Order Tab
 *
 * Interactive map for placing multi-item orders:
 * 1. Click map to select delivery location
 * 2. Add items (product + quantity) in sheet
 * 3. Verify order to see pricing and warehouse allocation
 * 4. Submit if valid
 */

import { WarehouseMap } from "@/components/map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  useGetProductsQuery,
  useGetWarehousesQuery,
  useSubmitOrderMutation,
  useVerifyOrderMutation,
  type Product,
  type ShipmentDetail,
  type VerifyOrderMutation,
  type Warehouse,
} from "@/graphql";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type OrderQuote = NonNullable<VerifyOrderMutation["verifyOrder"]>;

/** Custom hook for debouncing a callback */
function useDebouncedCallback<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedFn = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedFn;
}

interface OrderItemDraft {
  productId: string;
  quantity: number;
}

// Extend Warehouse type to include computed total stock
type WarehouseWithTotalStock = Warehouse & { totalStock?: number };

export function NewOrderTab() {
  // State
  const [selectedLocation, setSelectedLocation] = useState<
    [number, number] | null
  >(null);
  const [orderItems, setOrderItems] = useState<OrderItemDraft[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [quote, setQuote] = useState<OrderQuote | null>(null);

  // Queries & Mutations
  const {
    data: warehouseData,
    loading: warehousesLoading,
    refetch: refetchWarehouses,
  } = useGetWarehousesQuery();
  const { data: productData, loading: productsLoading } = useGetProductsQuery();
  const [verifyOrder, { loading: verifying }] = useVerifyOrderMutation();
  const [submitOrder, { loading: submitting }] = useSubmitOrderMutation();

  const products = useMemo(
    () => (productData?.products ?? []) as Product[],
    [productData?.products]
  );

  // Transform warehouses to include computed total stock for map display
  const warehouses: WarehouseWithTotalStock[] = useMemo(() => {
    return (warehouseData?.warehouses ?? []).map((w) => ({
      ...w,
      totalStock: (w.stocks ?? []).reduce(
        (sum, s) => sum + (s.quantity ?? 0),
        0
      ),
    }));
  }, [warehouseData?.warehouses]);

  const totalStock = warehouseData?.totalStock ?? 0;

  // Add a new item to the order
  const handleAddItem = () => {
    if (products.length > 0 && products[0].id) {
      setOrderItems([
        ...orderItems,
        { productId: products[0].id, quantity: 1 },
      ]);
    }
  };

  // Update an item
  const handleUpdateItem = (
    index: number,
    updates: Partial<OrderItemDraft>
  ) => {
    setOrderItems(
      orderItems.map((item, i) =>
        i === index ? { ...item, ...updates } : item
      )
    );
  };

  // Remove an item
  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  // Handle map click
  const handleLocationSelect = useCallback(
    (lat: number, lng: number) => {
      setSelectedLocation([lat, lng]);
      setQuote(null);
      setIsSheetOpen(true);
      // Add default item if none exist
      if (orderItems.length === 0 && products.length > 0 && products[0].id) {
        setOrderItems([{ productId: products[0].id, quantity: 1 }]);
      }
    },
    [orderItems.length, products]
  );

  // Handle verify
  const handleVerify = useCallback(async () => {
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
          toast.error(
            result.data.verifyOrder.errorMessage || "Order cannot be fulfilled"
          );
        }
      }
    } catch (error) {
      toast.error("Failed to verify order");
      console.error(error);
    }
  }, [selectedLocation, orderItems, verifyOrder]);

  // Debounced auto-verify (300ms delay)
  const debouncedVerify = useDebouncedCallback(handleVerify, 300);

  // Check if all order items have valid quantities (> 0)
  const hasValidQuantities = useMemo(
    () =>
      orderItems.length > 0 && orderItems.every((item) => item.quantity > 0),
    [orderItems]
  );

  // Auto-verify when order items change (only if location is selected and quantities are valid)
  useEffect(() => {
    if (selectedLocation && hasValidQuantities) {
      debouncedVerify();
    }
  }, [orderItems, selectedLocation, hasValidQuantities, debouncedVerify]);

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
        toast.success(
          `Order ${result.data.submitOrder.orderNumber} placed successfully!`
        );
        setIsSheetOpen(false);
        setSelectedLocation(null);
        setQuote(null);
        setOrderItems([]);
        refetchWarehouses();
      }
    } catch (error) {
      toast.error("Failed to submit order");
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
  const getProduct = (productId: string) =>
    products.find((p) => p.id === productId);

  // Calculate total quantity across all items
  const totalOrderQuantity = orderItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Place New Order</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Click anywhere on the map to select delivery location
          </p>
        </div>
        <Badge variant="outline" className="text-sm sm:text-lg px-3 sm:px-4 py-1 sm:py-2 w-fit">
          {formatNumber(totalStock)} units available
        </Badge>
      </div>

      {/* Map */}
      {warehousesLoading || productsLoading ? (
        <div className="h-[300px] sm:h-[400px] md:h-[500px] flex items-center justify-center bg-muted rounded-lg">
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
          height="clamp(300px, 50vh, 500px)"
        />
      )}

      {/* Order Sheet - transparent overlay to see map */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent
          transparentOverlay
          className="overflow-y-auto w-full sm:w-[400px] md:w-[540px] max-w-full"
        >
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
                    <span className="ml-2 font-mono">
                      {selectedLocation?.[0].toFixed(4)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Longitude:</span>
                    <span className="ml-2 font-mono">
                      {selectedLocation?.[1].toFixed(4)}
                    </span>
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
                      <div
                        key={index}
                        className="p-3 border rounded-lg space-y-3"
                      >
                        {/* Product */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <Label className="text-xs text-muted-foreground mb-1 block">
                              Product
                            </Label>
                            <Select
                              value={item.productId}
                              onValueChange={(value: string) =>
                                handleUpdateItem(index, { productId: value })
                              }
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
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive mt-5"
                            onClick={() => handleRemoveItem(index)}
                          >
                            ×
                          </Button>
                        </div>

                        {/* Quantity */}
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">
                            Quantity
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            value={item.quantity || ""}
                            onChange={(e) =>
                              handleUpdateItem(index, {
                                quantity: parseInt(e.target.value) || 0,
                              })
                            }
                            placeholder="Enter quantity"
                          />
                        </div>

                        {/* Subtotal */}
                        {product && item.quantity > 0 && (
                          <div className="text-sm text-muted-foreground pt-1 border-t">
                            {formatNumber(item.quantity)} ×{" "}
                            {formatCurrency(product.priceInCents)} ={" "}
                            <span className="font-medium text-foreground">
                              {formatCurrency(
                                (product.priceInCents ?? 0) * item.quantity
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                {orderItems.length > 0 && (
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-sm font-medium">Total Items:</span>
                    <span className="text-sm">
                      {formatNumber(totalOrderQuantity)} units
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Auto-verify indicator */}
            {verifying && hasValidQuantities && (
              <div className="flex items-center justify-center gap-2 py-2 text-muted-foreground text-sm">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span>Calculating...</span>
              </div>
            )}

            {/* Quote Results - only show when all quantities are valid */}
            {quote && !verifying && hasValidQuantities && (
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
                    <span className="text-sm text-destructive">
                      {quote.errorMessage}
                    </span>
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
                            <span className="font-medium">
                              {item?.productName}
                            </span>
                            {item?.canFulfill ? (
                              <Badge
                                variant="outline"
                                className="text-green-600"
                              >
                                ✓
                              </Badge>
                            ) : (
                              <Badge variant="destructive">✗</Badge>
                            )}
                          </div>
                          <div className="text-muted-foreground text-xs mt-1">
                            {formatNumber(item?.quantity)} ×{" "}
                            {formatCurrency(item?.unitPriceCents)} ={" "}
                            {formatCurrency(item?.subtotalCents)}
                          </div>
                          {item?.errorMessage && (
                            <div className="text-destructive text-xs mt-1">
                              {item.errorMessage}
                            </div>
                          )}
                          {item?.shipments && item.shipments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {item.shipments.map((s, si) => (
                                <div
                                  key={si}
                                  className="text-xs flex justify-between text-muted-foreground"
                                >
                                  <span>
                                    {s?.warehouseName} (
                                    {formatNumber(
                                      Math.round(s?.distanceKm ?? 0)
                                    )}
                                    km)
                                  </span>
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
                      <span>
                        Subtotal ({formatNumber(quote.totalQuantity)} items)
                      </span>
                      <span>{formatCurrency(quote.subtotalCents)}</span>
                    </div>
                    {(quote.discount?.discountPercentage ?? 0) > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount ({quote.discount?.tierName})</span>
                        <span>
                          -{formatCurrency(quote.discount?.discountAmountCents)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span
                        className={
                          !quote.shippingValidity?.isValid
                            ? "text-destructive"
                            : ""
                        }
                      >
                        {formatCurrency(quote.totalShippingCostCents)}
                        {!quote.shippingValidity?.isValid && (
                          <span className="ml-1 text-xs">
                            (exceeds{" "}
                            {quote.shippingValidity?.shippingPercentage?.toFixed(
                              1
                            )}
                            % limit)
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
                    {submitting ? "Submitting..." : "Confirm & Place Order"}
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

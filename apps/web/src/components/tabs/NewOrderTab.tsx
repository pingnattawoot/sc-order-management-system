/**
 * New Order Tab
 *
 * Interactive map for placing orders:
 * 1. Click map to select delivery location
 * 2. Enter quantity in sheet
 * 3. Verify order to see pricing and warehouse allocation
 * 4. Submit if valid
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { WarehouseMap } from '@/components/map';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  useGetWarehousesQuery,
  useVerifyOrderMutation,
  useSubmitOrderMutation,
  type VerifyOrderMutation,
  type Warehouse,
} from '@/graphql';

type OrderQuote = NonNullable<VerifyOrderMutation['verifyOrder']>;

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

export function NewOrderTab() {
  // State
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [quote, setQuote] = useState<OrderQuote | null>(null);

  // Queries & Mutations
  const { data: warehouseData, loading: warehousesLoading, refetch: refetchWarehouses } = useGetWarehousesQuery();
  const [verifyOrder, { loading: verifying }] = useVerifyOrderMutation();
  const [submitOrder, { loading: submitting }] = useSubmitOrderMutation();

  const warehouses = (warehouseData?.warehouses ?? []) as Warehouse[];
  const totalStock = warehouseData?.totalStock ?? 0;

  // Handle map click
  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setSelectedLocation([lat, lng]);
    setQuote(null);
    setIsSheetOpen(true);
  }, []);

  // Handle verify
  const handleVerify = async () => {
    if (!selectedLocation) return;

    try {
      const result = await verifyOrder({
        variables: {
          input: {
            quantity,
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
    if (!selectedLocation || !quote?.isValid) return;

    try {
      const result = await submitOrder({
        variables: {
          input: {
            quantity,
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
        setQuantity(1);
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

  // Get shipment details for map highlighting
  const activeShipments = quote?.shipments ?? [];

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
      {warehousesLoading ? (
        <div className="h-[500px] flex items-center justify-center bg-muted rounded-lg">
          <p className="text-muted-foreground">Loading warehouses...</p>
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
        <SheetContent transparentOverlay className="overflow-y-auto">
          <SheetHeader className="p-0">
            <SheetTitle>Order Details</SheetTitle>
            <SheetDescription>
              Configure and verify your order before submitting
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4">
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

            {/* Quantity Input */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 10))}
                  disabled={quantity <= 1}
                >
                  -10
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  max={totalStock}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24 text-center"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 10)}
                >
                  +10
                </Button>
              </div>
            </div>

            {/* Verify Button */}
            <Button
              onClick={handleVerify}
              disabled={verifying}
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

                {/* Pricing Breakdown */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Pricing Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal ({formatNumber(quote.quantity)} × {formatCurrency(quote.product?.unitPriceCents)})</span>
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

                {/* Shipment Allocation */}
                {quote.shipments && quote.shipments.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Warehouse Allocation</CardTitle>
                      <CardDescription>
                        Units will be shipped from {quote.shipments.length} warehouse(s)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {quote.shipments.map((shipment, i) => (
                          <div key={i} className="flex justify-between items-center text-sm p-2 bg-muted rounded">
                            <div>
                              <span className="font-medium">{shipment?.warehouseName}</span>
                              <span className="text-muted-foreground ml-2">
                                ({formatNumber(Math.round(shipment?.distanceKm ?? 0))} km)
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-medium">{formatNumber(shipment?.quantity)} units</span>
                              <span className="text-muted-foreground ml-2">
                                {formatCurrency(shipment?.shippingCostCents)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

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


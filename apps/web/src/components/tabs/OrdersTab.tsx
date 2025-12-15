/**
 * Orders History Tab
 *
 * Lists all orders with details and map view
 * Updated for multi-item orders
 */

import { useState, useMemo } from 'react';
import { WarehouseMap } from '@/components/map';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  useGetOrdersQuery,
  useGetWarehousesQuery,
  type Order,
  type Warehouse,
  type ShipmentDetail,
} from '@/graphql';

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

// Helper to format date
const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Status badge colors
const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500',
  COMPLETED: 'bg-green-500',
  CANCELLED: 'bg-red-500',
};

export function OrdersTab() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Queries
  const { data: ordersData, loading: ordersLoading } = useGetOrdersQuery({
    variables: { limit: 50 },
  });
  const { data: warehouseData } = useGetWarehousesQuery();

  const orders = (ordersData?.orders ?? []) as Order[];
  const warehouses = (warehouseData?.warehouses ?? []) as Warehouse[];

  // Convert order shipments from all items to ShipmentDetail format for map
  const selectedOrderItems = selectedOrder?.items;
  const activeShipments: ShipmentDetail[] = useMemo(() => {
    if (!selectedOrderItems) return [];
    
    // Flatten shipments from all items and convert to ShipmentDetail format
    return selectedOrderItems.flatMap((item) =>
      (item?.shipments ?? []).map((s) => ({
        __typename: 'ShipmentDetail' as const,
        warehouseId: s?.warehouseId ?? null,
        warehouseName: s?.warehouseName ?? null,
        quantity: s?.quantity ?? null,
        distanceKm: s?.distanceKm ? parseFloat(s.distanceKm) : null,
        shippingCostCents: s?.shippingCents ?? null,
      }))
    );
  }, [selectedOrderItems]);

  // Customer location for selected order
  const customerLocation: [number, number] | null = selectedOrder
    ? [parseFloat(selectedOrder.customerLatitude ?? '0'), parseFloat(selectedOrder.customerLongitude ?? '0')]
    : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Order History</h2>
        <p className="text-muted-foreground">
          View all orders and their fulfillment details
        </p>
      </div>

      {/* Loading State */}
      {ordersLoading ? (
        <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No orders found. Place your first order!</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                  <TableHead className="text-right">Shipping</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono font-medium">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">{order.items?.length ?? 0}</TableCell>
                    <TableCell className="text-right">{formatNumber(order.totalQuantity)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(order.subtotalCents)}</TableCell>
                    <TableCell className="text-right text-green-600">
                      {(order.discountCents ?? 0) > 0 ? `-${formatCurrency(order.discountCents)}` : '-'}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(order.shippingCents)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(order.totalCents)}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[order.status ?? 'PENDING']}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedOrder(order)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>
      )}

      {/* Order Detail Sheet */}
      <Sheet open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <SheetContent className="w-[500px] sm:w-[700px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-mono">{selectedOrder?.orderNumber}</SheetTitle>
            <SheetDescription>
              {formatDate(selectedOrder?.createdAt)}
            </SheetDescription>
          </SheetHeader>

          {selectedOrder && (
            <div className="mt-6 space-y-6">
              {/* Map - fit to customer and active warehouses */}
              <WarehouseMap
                warehouses={warehouses}
                customerLocation={customerLocation}
                activeShipments={activeShipments}
                height="300px"
                interactive={false}
                fitToShipments={true}
              />

              {/* Order Items */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Order Items</CardTitle>
                  <CardDescription>
                    {selectedOrder.items?.length ?? 0} item(s), {formatNumber(selectedOrder.totalQuantity)} units total
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item, i) => (
                      <div key={i} className="p-3 bg-muted rounded">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{item?.product?.name ?? 'Unknown Product'}</span>
                          <span className="font-medium">{formatCurrency(item?.subtotalCents)}</span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {formatNumber(item?.quantity)} × {formatCurrency(item?.unitPriceCents)}
                        </div>
                        {item?.shipments && item.shipments.length > 0 && (
                          <div className="mt-2 pt-2 border-t space-y-1">
                            <div className="text-xs font-medium text-muted-foreground">Shipped from:</div>
                            {item.shipments.map((s, si) => (
                              <div key={si} className="flex justify-between text-xs text-muted-foreground">
                                <span>
                                  {s?.warehouseName} ({formatNumber(Math.round(parseFloat(s?.distanceKm ?? '0')))} km)
                                </span>
                                <span>
                                  {formatNumber(s?.quantity)} units • {formatCurrency(s?.shippingCents)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(selectedOrder.subtotalCents)}</span>
                  </div>
                  {(selectedOrder.discountCents ?? 0) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{formatCurrency(selectedOrder.discountCents)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{formatCurrency(selectedOrder.shippingCents)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span>{formatCurrency(selectedOrder.totalCents)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Location */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Delivery Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Latitude:</span>
                      <span className="ml-2 font-mono">
                        {parseFloat(selectedOrder.customerLatitude ?? '0').toFixed(4)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Longitude:</span>
                      <span className="ml-2 font-mono">
                        {parseFloat(selectedOrder.customerLongitude ?? '0').toFixed(4)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

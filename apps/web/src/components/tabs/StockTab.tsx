/**
 * Stock Management Tab
 *
 * Displays warehouse inventory levels
 */

import { WarehouseMap } from '@/components/map';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useGetWarehousesQuery, type Warehouse } from '@/graphql';

// Helper to format numbers with comma separators
const formatNumber = (num: number | null | undefined) => {
  if (num == null) return '0';
  return new Intl.NumberFormat('en-US').format(num);
};

// Stock level indicator
const getStockLevel = (stock: number) => {
  if (stock >= 400) return { label: 'High', color: 'bg-green-500' };
  if (stock >= 200) return { label: 'Medium', color: 'bg-yellow-500' };
  return { label: 'Low', color: 'bg-red-500' };
};

// Progress bar component
function StockBar({ stock, maxStock }: { stock: number; maxStock: number }) {
  const percentage = Math.min((stock / maxStock) * 100, 100);
  const level = getStockLevel(stock);

  return (
    <div className="w-32">
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${level.color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function StockTab() {
  const { data, loading } = useGetWarehousesQuery();

  const warehouses = (data?.warehouses ?? []) as Warehouse[];
  const totalStock = data?.totalStock ?? 0;
  const maxStock = Math.max(...warehouses.map((w) => w.stock ?? 0), 1);

  // Calculate stats
  const avgStock = warehouses.length > 0
    ? Math.round(totalStock / warehouses.length)
    : 0;
  const lowStockWarehouses = warehouses.filter((w) => (w.stock ?? 0) < 200).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Stock Management</h2>
        <p className="text-muted-foreground">
          Monitor inventory levels across all warehouses
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Global Stock</CardDescription>
            <CardTitle className="text-3xl">{formatNumber(totalStock)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">units available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Warehouses</CardDescription>
            <CardTitle className="text-3xl">{warehouses.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">distribution centers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average Stock</CardDescription>
            <CardTitle className="text-3xl">{formatNumber(avgStock)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">units per warehouse</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Low Stock Alerts</CardDescription>
            <CardTitle className="text-3xl">
              {lowStockWarehouses > 0 ? (
                <span className="text-red-500">{lowStockWarehouses}</span>
              ) : (
                <span className="text-green-500">0</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">warehouses below 200 units</p>
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      {loading ? (
        <div className="h-[400px] flex items-center justify-center bg-muted rounded-lg">
          <p className="text-muted-foreground">Loading warehouses...</p>
        </div>
      ) : (
        <WarehouseMap
          warehouses={warehouses}
          height="400px"
          interactive={true}
        />
      )}

      {/* Warehouse Table */}
      <Card>
        <CardHeader>
          <CardTitle>Warehouse Inventory</CardTitle>
          <CardDescription>
            Current stock levels by location
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground py-8 text-center">Loading...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Current Stock</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Capacity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warehouses.map((warehouse) => {
                  const level = getStockLevel(warehouse.stock ?? 0);
                  return (
                    <TableRow key={warehouse.id}>
                      <TableCell className="font-medium">{warehouse.name}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-sm">
                        {parseFloat(warehouse.latitude ?? '0').toFixed(2)}°,{' '}
                        {parseFloat(warehouse.longitude ?? '0').toFixed(2)}°
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatNumber(warehouse.stock)}
                      </TableCell>
                      <TableCell>
                        <Badge className={level.color}>{level.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <StockBar stock={warehouse.stock ?? 0} maxStock={maxStock} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


/**
 * Stock Management Tab
 *
 * Displays warehouse inventory levels per product
 */

import { useState, useMemo } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGetWarehousesQuery, useGetProductsQuery, type Warehouse, type Product } from '@/graphql';

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

// Helper to compute total stock for a warehouse (optionally filtered by product)
const getWarehouseStock = (warehouse: Warehouse, productId?: string | null): number => {
  if (!warehouse.stocks) return 0;
  if (productId) {
    const stock = warehouse.stocks.find((s) => s?.productId === productId);
    return stock?.quantity ?? 0;
  }
  return warehouse.stocks.reduce((sum, s) => sum + (s?.quantity ?? 0), 0);
};

export function StockTab() {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const { data: warehouseData, loading: warehousesLoading } = useGetWarehousesQuery();
  const { data: productData, loading: productsLoading } = useGetProductsQuery();

  const warehouses = useMemo(() => (warehouseData?.warehouses ?? []) as Warehouse[], [warehouseData?.warehouses]);
  const products = useMemo(() => (productData?.products ?? []) as Product[], [productData?.products]);
  const loading = warehousesLoading || productsLoading;

  // Calculate stats based on selected product filter
  const stats = useMemo(() => {
    const stockValues = warehouses.map((w) => getWarehouseStock(w, selectedProductId));
    const totalStock = stockValues.reduce((sum, s) => sum + s, 0);
    const avgStock = warehouses.length > 0 ? Math.round(totalStock / warehouses.length) : 0;
    const lowStockWarehouses = stockValues.filter((s) => s < 200).length;
    const maxStock = Math.max(...stockValues, 1);

    return { totalStock, avgStock, lowStockWarehouses, maxStock };
  }, [warehouses, selectedProductId]);

  // Get stock for each warehouse based on filter
  const warehouseStocks = useMemo(() => {
    return warehouses.map((w) => ({
      warehouse: w,
      stock: getWarehouseStock(w, selectedProductId),
    }));
  }, [warehouses, selectedProductId]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Stock Management</h2>
          <p className="text-muted-foreground">
            Monitor inventory levels across all warehouses
          </p>
        </div>
        {/* Product Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filter by:</span>
          <Select
            value={selectedProductId ?? 'all'}
            onValueChange={(value) => setSelectedProductId(value === 'all' ? null : value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Products" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id!}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {selectedProduct ? `${selectedProduct.name} Stock` : 'Total Global Stock'}
            </CardDescription>
            <CardTitle className="text-3xl">{formatNumber(stats.totalStock)}</CardTitle>
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
            <CardTitle className="text-3xl">{formatNumber(stats.avgStock)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">units per warehouse</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Low Stock Alerts</CardDescription>
            <CardTitle className="text-3xl">
              {stats.lowStockWarehouses > 0 ? (
                <span className="text-red-500">{stats.lowStockWarehouses}</span>
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
            {selectedProduct 
              ? `Stock levels for ${selectedProduct.name}` 
              : 'Current stock levels by location (all products)'}
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
                  {!selectedProductId && <TableHead>Products</TableHead>}
                  <TableHead className="text-right">Current Stock</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Capacity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warehouseStocks.map(({ warehouse, stock }) => {
                  const level = getStockLevel(stock);
                  return (
                    <TableRow key={warehouse.id}>
                      <TableCell className="font-medium">{warehouse.name}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-sm">
                        {parseFloat(warehouse.latitude ?? '0').toFixed(2)}°,{' '}
                        {parseFloat(warehouse.longitude ?? '0').toFixed(2)}°
                      </TableCell>
                      {!selectedProductId && (
                        <TableCell className="text-muted-foreground text-sm">
                          {warehouse.stocks?.map((s) => (
                            <div key={s?.productId}>
                              {s?.product?.name}: {formatNumber(s?.quantity)}
                            </div>
                          ))}
                        </TableCell>
                      )}
                      <TableCell className="text-right font-bold">
                        {formatNumber(stock)}
                      </TableCell>
                      <TableCell>
                        <Badge className={level.color}>{level.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <StockBar stock={stock} maxStock={stats.maxStock} />
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

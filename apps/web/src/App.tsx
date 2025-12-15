/**
 * ScreenCloud Order Management System
 *
 * Main application with tab-based navigation:
 * - New Order: Place orders with interactive map
 * - Orders: View order history
 * - Stock: Monitor warehouse inventory
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NewOrderTab, OrdersTab, StockTab } from '@/components/tabs';

function App() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">SC</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">ScreenCloud OMS</h1>
                <p className="text-sm text-muted-foreground">Order Management System</p>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Multi-Product Ordering
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="new-order" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="new-order" className="flex items-center gap-2">
              <span>🛒</span>
              <span>New Order</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <span>📋</span>
              <span>Orders</span>
            </TabsTrigger>
            <TabsTrigger value="stock" className="flex items-center gap-2">
              <span>📦</span>
              <span>Stock</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new-order">
            <NewOrderTab />
          </TabsContent>

          <TabsContent value="orders">
            <OrdersTab />
          </TabsContent>

          <TabsContent value="stock">
            <StockTab />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-4">
          <p className="text-sm text-muted-foreground text-center">
            ScreenCloud Order Management System • Technical Assessment
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;

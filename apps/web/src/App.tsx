/**
 * ScreenCloud Order Management System
 *
 * Main application with tab-based navigation:
 * - New Order: Place orders with interactive map
 * - Orders: View order history
 * - Stock: Monitor warehouse inventory
 */

import { NewOrderTab, OrdersTab, StockTab } from "@/components/tabs";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

// Get API base URL (without /graphql suffix)
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:4000/graphql"
).replace("/graphql", "");

function App() {
  const [isResetting, setIsResetting] = useState(false);

  const handleResetDemo = async () => {
    if (
      !confirm(
        "⚠️ This will reset the database to its initial demo state.\n\nAll orders will be deleted and stock levels will be restored.\n\nContinue?"
      )
    ) {
      return;
    }

    setIsResetting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/reset-demo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (data.success) {
        alert(
          "✅ Database reset successful!\n\nProducts, warehouses, and stock levels have been restored.\n\nPage will reload."
        );
        // Reload the page to refresh all data
        window.location.reload();
      } else {
        alert(`❌ Reset failed: ${data.message}`);
      }
    } catch (error) {
      alert(
        `❌ Reset failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">
                  SC
                </span>
              </div>
              <div>
                <h1 className="text-xl font-bold">ScreenCloud OMS</h1>
                <p className="text-sm text-muted-foreground">
                  Order Management System
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                📦
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetDemo}
                disabled={isResetting}
                className="text-orange-600 border-orange-300 hover:bg-orange-50"
              >
                {isResetting ? "🔄 Resetting..." : "🔄 Reset Stock"}
              </Button>
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

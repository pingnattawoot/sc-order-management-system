/**
 * Custom marker for warehouse locations
 *
 * Shows warehouse name, stock level, and optional distance/shipping cost
 */

import type { ShipmentDetail, Warehouse } from "@/generated/graphql";
import { formatCurrency } from "@/lib/utils";
import L from "leaflet";
import { Marker, Popup } from "react-leaflet";

// Compute total stock across all products in a warehouse
const getTotalStock = (warehouse: Warehouse): number => {
  if (!warehouse.stocks) return 0;
  return warehouse.stocks.reduce((sum, s) => sum + (s?.quantity ?? 0), 0);
};

// Custom warehouse icon (blue for normal, green for selected/active)
const createWarehouseIcon = (
  isActive: boolean = false,
  stockLevel: "high" | "medium" | "low" = "high"
) => {
  const colors = {
    high: isActive ? "#22c55e" : "#3b82f6", // green when active, blue normally
    medium: isActive ? "#22c55e" : "#f59e0b", // amber for medium stock
    low: isActive ? "#22c55e" : "#ef4444", // red for low stock
  };

  return L.divIcon({
    className: "custom-warehouse-marker",
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: ${colors[stockLevel]};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        transform: ${isActive ? "scale(1.2)" : "scale(1)"};
        transition: transform 0.2s ease;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
          <path d="M3 21V8l9-6 9 6v13H3z"/>
          <path d="M9 21V12h6v9"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const getStockLevel = (stock: number): "high" | "medium" | "low" => {
  if (stock >= 400) return "high";
  if (stock >= 200) return "medium";
  return "low";
};

interface WarehouseMarkerProps {
  warehouse: Warehouse;
  isActive?: boolean;
  /** Shipments from this warehouse (can be multiple for multi-product orders) */
  shipments?: ShipmentDetail[];
}

export function WarehouseMarker({
  warehouse,
  isActive = false,
  shipments = [],
}: WarehouseMarkerProps) {
  // Calculate aggregated values from shipments
  const totalQuantity = shipments.reduce(
    (sum, s) => sum + (s.quantity ?? 0),
    0
  );
  const totalShippingCents = shipments.reduce(
    (sum, s) => sum + (s.shippingCostCents ?? 0),
    0
  );
  // Use distance from first shipment (all shipments from same warehouse have same distance)
  const distance = shipments.length > 0 ? shipments[0].distanceKm : undefined;
  const stock = getTotalStock(warehouse);
  const stockLevel = getStockLevel(stock);
  const icon = createWarehouseIcon(isActive, stockLevel);
  const position: [number, number] = [
    parseFloat(warehouse.latitude ?? "0"),
    parseFloat(warehouse.longitude ?? "0"),
  ];

  return (
    <Marker position={position} icon={icon}>
      <Popup>
        <div style={{ minWidth: 180, fontSize: 14, lineHeight: 1.4 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
            {warehouse.name}
          </div>
          <div style={{ color: "#666", marginBottom: 2 }}>
            Total Stock:{" "}
            <span
              style={{
                fontWeight: 500,
                color:
                  stockLevel === "low"
                    ? "#ef4444"
                    : stockLevel === "medium"
                    ? "#f59e0b"
                    : "#22c55e",
              }}
            >
              {stock} units
            </span>
          </div>
          {warehouse.stocks && warehouse.stocks.length > 0 && (
            <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>
              {warehouse.stocks.map((s, i) => (
                <div key={i}>
                  {s?.product?.name}: {s?.quantity ?? 0}
                </div>
              ))}
            </div>
          )}
          {distance !== undefined && distance !== null && (
            <div style={{ color: "#666" }}>
              Distance:{" "}
              <span style={{ fontWeight: 500 }}>{distance.toFixed(1)} km</span>
            </div>
          )}
          {shipments.length > 0 && isActive && (
            <div
              style={{
                borderTop: "1px solid #e5e7eb",
                marginTop: 8,
                paddingTop: 8,
              }}
            >
              <div
                style={{ color: "#16a34a", fontWeight: 600, marginBottom: 4 }}
              >
                ✓ Fulfilling Order:
              </div>
              {shipments.map((s, i) => (
                <div
                  key={i}
                  style={{ color: "#666", fontSize: 12, marginLeft: 8 }}
                >
                  • {s.quantity} units
                  {s.shippingCostCents !== undefined &&
                    s.shippingCostCents !== null && (
                      <span style={{ color: "#888" }}>
                        {" "}
                        ({formatCurrency(s.shippingCostCents)})
                      </span>
                    )}
                </div>
              ))}
              {shipments.length > 1 && (
                <div
                  style={{
                    marginTop: 6,
                    paddingTop: 4,
                    borderTop: "1px dashed #e5e7eb",
                  }}
                >
                  <div
                    style={{ color: "#16a34a", fontWeight: 500, fontSize: 13 }}
                  >
                    Total: {totalQuantity} units
                  </div>
                  <div style={{ color: "#666", fontSize: 12 }}>
                    Shipping:{" "}
                    <span style={{ fontWeight: 500, color: "#3b82f6" }}>
                      {formatCurrency(totalShippingCents)}
                    </span>
                  </div>
                </div>
              )}
              {shipments.length === 1 && totalShippingCents > 0 && (
                <div style={{ color: "#666", marginTop: 4, fontSize: 12 }}>
                  Shipping:{" "}
                  <span style={{ fontWeight: 500, color: "#3b82f6" }}>
                    {formatCurrency(totalShippingCents)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

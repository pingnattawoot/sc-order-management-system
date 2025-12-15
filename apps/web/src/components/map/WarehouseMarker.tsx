/**
 * Custom marker for warehouse locations
 *
 * Shows warehouse name, stock level, and optional distance
 */

import type { Warehouse } from "@/generated/graphql";
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
  quantity?: number;
  distance?: number;
}

export function WarehouseMarker({
  warehouse,
  isActive = false,
  quantity,
  distance,
}: WarehouseMarkerProps) {
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
        <div className="min-w-[180px]">
          <h3 className="font-bold text-base mb-2">{warehouse.name}</h3>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Total Stock:</span>{" "}
              <span
                className={`font-medium ${
                  stockLevel === "low"
                    ? "text-red-500"
                    : stockLevel === "medium"
                    ? "text-amber-500"
                    : "text-green-500"
                }`}
              >
                {stock} units
              </span>
            </p>
            {warehouse.stocks && warehouse.stocks.length > 0 && (
              <div className="text-xs text-muted-foreground">
                {warehouse.stocks.map((s, i) => (
                  <div key={i}>
                    {s?.product?.name}: {s?.quantity ?? 0}
                  </div>
                ))}
              </div>
            )}
            {distance !== undefined && (
              <p>
                <span className="text-muted-foreground">Distance:</span>{" "}
                <span className="font-medium">{distance.toFixed(1)} km</span>
              </p>
            )}
            {quantity !== undefined && isActive && (
              <p className="pt-1 border-t">
                <span className="text-green-600 font-medium">
                  Fulfilling: {quantity} units
                </span>
              </p>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

/**
 * Custom marker for warehouse locations
 *
 * Shows warehouse name, stock level, and optional distance/shipping cost
 */

import type { ShipmentDetail, Warehouse } from "@/generated/graphql";
import { formatCurrency, formatNumber } from "@/lib/utils";
import L from "leaflet";
import { Marker, Popup } from "react-leaflet";

// Compute total stock across all products in a warehouse
const getTotalStock = (warehouse: Warehouse): number => {
  if (!warehouse.stocks) return 0;
  return warehouse.stocks.reduce((sum, s) => sum + (s?.quantity ?? 0), 0);
};

// Custom warehouse icon (blue for normal, green for active, yellow ring for selected)
const createWarehouseIcon = (
  isActive: boolean = false,
  isSelected: boolean = false,
  stockLevel: "high" | "medium" | "low" = "high"
) => {
  const colors = {
    high: isActive ? "#22c55e" : "#3b82f6", // green when active, blue normally
    medium: isActive ? "#22c55e" : "#f59e0b", // amber for medium stock
    low: isActive ? "#22c55e" : "#ef4444", // red for low stock
  };

  const scale = isActive || isSelected ? 1.2 : 1;
  const ringColor = isSelected ? "#ffcf03" : "white"; // Yellow ring when selected
  const ringWidth = isSelected ? 4 : 3;
  const shadowIntensity = isSelected
    ? "0 0 12px 4px rgba(255,207,3,0.5)"
    : "0 2px 8px rgba(0,0,0,0.3)";

  return L.divIcon({
    className: "custom-warehouse-marker",
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: ${colors[stockLevel]};
        border: ${ringWidth}px solid ${ringColor};
        border-radius: 50%;
        box-shadow: ${shadowIntensity};
        display: flex;
        align-items: center;
        justify-content: center;
        transform: scale(${scale});
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        cursor: pointer;
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
  isSelected?: boolean;
  /** Shipments from this warehouse (can be multiple for multi-product orders) */
  shipments?: ShipmentDetail[];
  /** Called when marker is clicked */
  onSelect?: (warehouseId: string | null) => void;
}

export function WarehouseMarker({
  warehouse,
  isActive = false,
  isSelected = false,
  shipments = [],
  onSelect,
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
  const icon = createWarehouseIcon(isActive, isSelected, stockLevel);
  const position: [number, number] = [
    parseFloat(warehouse.latitude ?? "0"),
    parseFloat(warehouse.longitude ?? "0"),
  ];

  const handleClick = () => {
    if (onSelect && warehouse.id) {
      // Toggle selection: if already selected, deselect; otherwise select
      onSelect(isSelected ? null : warehouse.id);
    }
  };

  return (
    <Marker
      position={position}
      icon={icon}
      eventHandlers={{
        click: handleClick,
      }}
    >
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
              {formatNumber(stock)} units
            </span>
          </div>
          {warehouse.stocks && warehouse.stocks.length > 0 && (
            <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>
              {warehouse.stocks.map((s, i) => (
                <div key={i}>
                  {s?.product?.name}: {formatNumber(s?.quantity ?? 0)}
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
                  • {formatNumber(s.quantity)} units
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
                    Total: {formatNumber(totalQuantity)} units
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

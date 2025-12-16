/**
 * Interactive warehouse map component
 *
 * Displays all warehouses and allows users to click to select a delivery location.
 * Uses Leaflet with OpenStreetMap tiles.
 */

import { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
  Polyline,
} from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

import type { Warehouse, ShipmentDetail } from "@/generated/graphql";
import { WarehouseMarker } from "./WarehouseMarker";
import { CustomerMarker } from "./CustomerMarker";

// Component to fit map bounds to warehouses and optionally customer location
function FitBounds({
  warehouses,
  customerLocation,
  activeWarehouseIds,
}: {
  warehouses: Warehouse[];
  customerLocation?: [number, number] | null;
  activeWarehouseIds?: Set<string>;
}) {
  const map = useMap();

  useEffect(() => {
    // If we have active warehouses and customer, fit to those specifically
    if (customerLocation && activeWarehouseIds && activeWarehouseIds.size > 0) {
      const activeWarehouses = warehouses.filter(
        (w) => w.id && activeWarehouseIds.has(w.id)
      );
      const bounds: [number, number][] = [
        customerLocation,
        ...activeWarehouses.map(
          (w) =>
            [parseFloat(w.latitude ?? "0"), parseFloat(w.longitude ?? "0")] as [
              number,
              number
            ]
        ),
      ];
      map.fitBounds(bounds as LatLngBoundsExpression, {
        padding: [80, 80],
        maxZoom: 10,
      });
      return;
    }

    // Otherwise fit to all warehouses
    if (warehouses.length === 0) return;

    const bounds: LatLngBoundsExpression = warehouses.map((w) => [
      parseFloat(w.latitude ?? "0"),
      parseFloat(w.longitude ?? "0"),
    ]);

    map.fitBounds(bounds, { padding: [50, 50] });
  }, [map, warehouses, customerLocation, activeWarehouseIds]);

  return null;
}

// Component to handle map click events
function MapClickHandler({
  onLocationSelect,
}: {
  onLocationSelect?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      if (onLocationSelect) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  return null;
}

interface WarehouseMapProps {
  warehouses: Warehouse[];
  customerLocation?: [number, number] | null;
  activeShipments?: ShipmentDetail[];
  onLocationSelect?: (lat: number, lng: number) => void;
  onCustomerMarkerClick?: () => void;
  height?: string;
  interactive?: boolean;
  isOrderValid?: boolean; // Controls line color: green for valid, red for invalid
  fitToShipments?: boolean; // When true, fit bounds to customer + active warehouses only
}

export function WarehouseMap({
  warehouses,
  customerLocation,
  activeShipments = [],
  onLocationSelect,
  onCustomerMarkerClick,
  height = "500px",
  interactive = true,
  isOrderValid = true,
  fitToShipments = false,
}: WarehouseMapProps) {
  // Get active warehouse IDs for highlighting
  const activeWarehouseIds = useMemo(() => {
    return new Set(
      activeShipments.map((s) => s.warehouseId).filter(Boolean) as string[]
    );
  }, [activeShipments]);

  // Create shipment quantity map
  const shipmentQuantityMap = useMemo(() => {
    const map = new Map<string, number>();
    activeShipments.forEach((s) => {
      if (s.warehouseId && s.quantity != null) {
        map.set(s.warehouseId, s.quantity);
      }
    });
    return map;
  }, [activeShipments]);

  // Create shipment distance map
  const shipmentDistanceMap = useMemo(() => {
    const map = new Map<string, number>();
    activeShipments.forEach((s) => {
      if (s.warehouseId && s.distanceKm != null) {
        map.set(s.warehouseId, s.distanceKm);
      }
    });
    return map;
  }, [activeShipments]);

  // Create shipment shipping cost map
  const shipmentShippingCostMap = useMemo(() => {
    const map = new Map<string, number>();
    activeShipments.forEach((s) => {
      if (s.warehouseId && s.shippingCostCents != null) {
        map.set(s.warehouseId, s.shippingCostCents);
      }
    });
    return map;
  }, [activeShipments]);

  // Draw lines from active warehouses to customer
  const shipmentLines = useMemo(() => {
    if (!customerLocation || activeShipments.length === 0) return [];

    return activeShipments
      .map((shipment) => {
        const warehouse = warehouses.find((w) => w.id === shipment.warehouseId);
        if (!warehouse || !shipment.warehouseId) return null;

        const warehousePos: [number, number] = [
          parseFloat(warehouse.latitude ?? "0"),
          parseFloat(warehouse.longitude ?? "0"),
        ];

        return {
          id: shipment.warehouseId,
          positions: [warehousePos, customerLocation] as [number, number][],
        };
      })
      .filter(Boolean);
  }, [customerLocation, activeShipments, warehouses]);

  // Line color based on order validity
  const lineColor = isOrderValid ? "#22c55e" : "#ef4444"; // green-500 or red-500

  return (
    <div
      style={{ height }}
      className={`w-full rounded-lg overflow-hidden border ${
        interactive ? "cursor-crosshair" : ""
      }`}
    >
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={interactive}
        dragging={interactive}
        doubleClickZoom={interactive}
        zoomControl={interactive}
        className={interactive ? "[&_.leaflet-container]:cursor-crosshair" : ""}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds
          warehouses={warehouses}
          customerLocation={fitToShipments ? customerLocation : undefined}
          activeWarehouseIds={fitToShipments ? activeWarehouseIds : undefined}
        />

        {interactive && <MapClickHandler onLocationSelect={onLocationSelect} />}

        {/* Shipment lines */}
        {shipmentLines.map(
          (line) =>
            line && (
              <Polyline
                key={line.id}
                positions={line.positions}
                pathOptions={{
                  color: lineColor,
                  weight: 3,
                  opacity: 0.7,
                  dashArray: "10, 5",
                }}
              />
            )
        )}

        {/* Warehouse markers */}
        {warehouses.map(
          (warehouse) =>
            warehouse.id && (
              <WarehouseMarker
                key={warehouse.id}
                warehouse={warehouse}
                isActive={activeWarehouseIds.has(warehouse.id)}
                quantity={shipmentQuantityMap.get(warehouse.id)}
                distance={shipmentDistanceMap.get(warehouse.id)}
                shippingCostCents={shipmentShippingCostMap.get(warehouse.id)}
              />
            )
        )}

        {/* Customer location marker */}
        {customerLocation && (
          <CustomerMarker
            position={customerLocation}
            onClick={onCustomerMarkerClick}
          />
        )}
      </MapContainer>
    </div>
  );
}

/**
 * Interactive warehouse map component
 *
 * Displays all warehouses and allows users to click to select a delivery location.
 * Uses Leaflet with OpenStreetMap tiles.
 */

import type { LatLngBounds, LatLngBoundsExpression } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import {
  MapContainer,
  Polyline,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

// World bounds to prevent panning outside the map
const WORLD_BOUNDS: LatLngBounds = L.latLngBounds(
  L.latLng(-85, -180), // Southwest corner
  L.latLng(85, 180) // Northeast corner
);

const MIN_ZOOM = 2;
const MAX_ZOOM = 18;

import type { ShipmentDetail, Warehouse } from "@/generated/graphql";
import { CustomerMarker } from "./CustomerMarker";
import { WarehouseMarker } from "./WarehouseMarker";

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

// Component to fly to a selected warehouse
function FlyToWarehouse({
  warehouses,
  selectedWarehouseId,
}: {
  warehouses: Warehouse[];
  selectedWarehouseId?: string | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!selectedWarehouseId) return;

    const warehouse = warehouses.find((w) => w.id === selectedWarehouseId);
    if (!warehouse) return;

    const lat = parseFloat(warehouse.latitude ?? "0");
    const lng = parseFloat(warehouse.longitude ?? "0");

    map.flyTo([lat, lng], 4, {
      duration: 0.8,
    });
  }, [map, warehouses, selectedWarehouseId]);

  return null;
}

interface WarehouseMapProps {
  warehouses: Warehouse[];
  customerLocation?: [number, number] | null;
  activeShipments?: ShipmentDetail[];
  onLocationSelect?: (lat: number, lng: number) => void;
  onCustomerMarkerClick?: () => void;
  onWarehouseSelect?: (warehouseId: string | null) => void;
  selectedWarehouseId?: string | null;
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
  onWarehouseSelect,
  selectedWarehouseId,
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

  // Group shipments by warehouse (a warehouse can fulfill multiple products)
  const warehouseShipmentsMap = useMemo(() => {
    const map = new Map<string, ShipmentDetail[]>();
    activeShipments.forEach((s) => {
      if (s.warehouseId) {
        const existing = map.get(s.warehouseId) ?? [];
        map.set(s.warehouseId, [...existing, s]);
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
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        maxBounds={WORLD_BOUNDS}
        maxBoundsViscosity={1.0}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={interactive}
        dragging={interactive}
        doubleClickZoom={interactive}
        zoomControl={interactive}
        className={interactive ? "[&_.leaflet-container]:cursor-crosshair" : ""}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
        />

        <FitBounds
          warehouses={warehouses}
          customerLocation={fitToShipments ? customerLocation : undefined}
          activeWarehouseIds={fitToShipments ? activeWarehouseIds : undefined}
        />

        <FlyToWarehouse
          warehouses={warehouses}
          selectedWarehouseId={selectedWarehouseId}
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
                isSelected={selectedWarehouseId === warehouse.id}
                shipments={warehouseShipmentsMap.get(warehouse.id)}
                onSelect={onWarehouseSelect}
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

/**
 * Custom marker for customer delivery location
 *
 * Shows a pin icon at the selected destination
 */

import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Custom customer location icon (red pin)
const customerIcon = L.divIcon({
  className: 'custom-customer-marker',
  html: `
    <div style="
      width: 36px;
      height: 36px;
      position: relative;
    ">
      <div style="
        width: 24px;
        height: 24px;
        background: #ef4444;
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        position: absolute;
        top: 0;
        left: 6px;
      ">
        <div style="
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 5px;
          left: 5px;
        "></div>
      </div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

interface CustomerMarkerProps {
  position: [number, number];
  onClick?: () => void;
}

export function CustomerMarker({ position }: CustomerMarkerProps) {
  return (
    <Marker position={position} icon={customerIcon}>
      <Popup>
        <div className="min-w-[150px]">
          <h3 className="font-bold text-base mb-2">📍 Delivery Location</h3>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Lat:</span>{' '}
              <span className="font-mono">{position[0].toFixed(4)}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Lng:</span>{' '}
              <span className="font-mono">{position[1].toFixed(4)}</span>
            </p>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}


import React, { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Clock, ShieldCheck, MapPin } from 'lucide-react';

// Custom Leaflet DivIcons conforming to 60-30-10 design system (Abyss Teal & Taxi Volt)
const createCustomIcon = (color, label, bg = '#0D2C2E') => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background: ${bg};
        border: 1.5px solid ${color};
        color: #F4F0E8;
        border-radius: 8px;
        padding: 3px 8px;
        font-family: 'IBM Plex Mono', monospace;
        font-size: 11px;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 6px;
        box-shadow: 0 4px 14px rgba(0,0,0,0.6);
        white-space: nowrap;
      ">
        <span style="width: 7px; height: 7px; border-radius: 9999px; background: ${color}; display: inline-block;"></span>
        <span>${label}</span>
      </div>
    `,
    iconSize: [84, 28],
    iconAnchor: [42, 14],
  });
};

function ChangeMapView({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [bounds, map]);
  return null;
}

export default function DeliveryRouteMap({
  route,
  originName = 'Supplier Hub',
  destName = 'Destination Hospital',
  className = '',
  height = '320px',
}) {
  const [liveRouteData, setLiveRouteData] = useState(null);

  // If route is an ID pair or missing coordinates, dynamically fetch live OSRM road geometry
  useEffect(() => {
    const originId = route?.originId || (typeof route === 'string' ? route : null);
    const destId = route?.destId || 'H004';
    const hasCoordinates =
      Array.isArray(route?.geojson?.coordinates) ||
      Array.isArray(route?.geometry?.coordinates) ||
      Array.isArray(route?.coordinates);

    if (!hasCoordinates && originId && destId) {
      const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000') + '/api';
      axios
        .get(`${API_BASE_URL}/route/${originId}/${destId}`)
        .then((res) => {
          if (res.data?.success && res.data.route) {
            setLiveRouteData(res.data.route);
          }
        })
        .catch((err) => {
          console.warn('[DeliveryRouteMap] Road route fetch note:', err.message);
        });
    }
  }, [route?.originId, route?.destId]);

  const activeRoute = liveRouteData || route;

  // Origin Coordinates fallback
  const originCoords = useMemo(() => {
    if (Array.isArray(activeRoute?.originCoords) && activeRoute.originCoords.length === 2) {
      return [activeRoute.originCoords[1], activeRoute.originCoords[0]];
    }
    if (activeRoute?.originCoords?.lat && activeRoute?.originCoords?.lng) {
      return [activeRoute.originCoords.lat, activeRoute.originCoords.lng];
    }
    return [23.2300, 77.4500]; // V1001 Bhopal default
  }, [activeRoute]);

  // Destination Coordinates fallback
  const destCoords = useMemo(() => {
    if (Array.isArray(activeRoute?.destCoords) && activeRoute.destCoords.length === 2) {
      return [activeRoute.destCoords[1], activeRoute.destCoords[0]];
    }
    if (activeRoute?.destCoords?.lat && activeRoute?.destCoords?.lng) {
      return [activeRoute.destCoords.lat, activeRoute.destCoords.lng];
    }
    return [23.2450, 77.3910]; // H004 Bhopal default
  }, [activeRoute]);

  // Polyline coordinates from OSRM turn-by-turn road geometry
  const polylinePositions = useMemo(() => {
    let rawCoords = null;
    if (Array.isArray(activeRoute?.geojson?.coordinates)) {
      rawCoords = activeRoute.geojson.coordinates;
    } else if (Array.isArray(activeRoute?.geometry?.coordinates)) {
      rawCoords = activeRoute.geometry.coordinates;
    } else if (Array.isArray(activeRoute?.geometry)) {
      rawCoords = activeRoute.geometry;
    } else if (Array.isArray(activeRoute?.coordinates)) {
      rawCoords = activeRoute.coordinates;
    }

    if (rawCoords && rawCoords.length > 0) {
      // OSRM returns [lon, lat], Leaflet requires [lat, lon]
      return rawCoords.map((pt) => {
        if (Array.isArray(pt)) {
          return [pt[1], pt[0]];
        }
        return [pt.lat, pt.lng];
      });
    }
    return [originCoords, destCoords];
  }, [activeRoute, originCoords, destCoords]);

  const bounds = useMemo(() => {
    if (polylinePositions && polylinePositions.length > 1) {
      return polylinePositions;
    }
    return [originCoords, destCoords];
  }, [polylinePositions, originCoords, destCoords]);

  const distanceKm = activeRoute?.distanceKm || 0;
  const durationHours = activeRoute?.durationHours || 0;
  const maxAllowedLeadDays = activeRoute?.maxAllowedLeadDays || Math.ceil(durationHours / 24) + 1;
  const mode = activeRoute?.source === 'HAVERSINE_FALLBACK' ? 'GEODESIC_ROAD' : 'OSRM_LIVE';

  return (
    <div className={`relative rounded-xl overflow-hidden border border-sand-border bg-abyss-card shadow-sm ${className}`}>
      {/* Top Header Badge Overlay */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto px-3 py-1.5 rounded-lg bg-abyss-card/95 border border-sand-border text-xs font-mono flex items-center gap-2 shadow-md">
          <Navigation className="w-3.5 h-3.5 text-volt" />
          <span className="font-bold text-abyss-text">
            {mode === 'OSRM_LIVE' ? 'OSRM Live Road Route' : 'Geodesic Route'}
          </span>
          <span className="text-[10px] text-volt font-bold bg-abyss-elevated px-1.5 py-0.5 rounded border border-sand-border">
            {distanceKm} km
          </span>
        </div>

        <div className="pointer-events-auto px-3 py-1.5 rounded-lg bg-abyss-card/95 border border-sand-border text-xs font-mono flex items-center gap-2 shadow-md">
          <Clock className="w-3.5 h-3.5 text-volt" />
          <span className="text-abyss-muted">
            Travel: <strong className="text-abyss-text">{durationHours}h</strong>
          </span>
          <span className="text-[10px] text-volt-text font-bold bg-volt px-1.5 py-0.5 rounded shadow-xs">
            Max {maxAllowedLeadDays}d (+1 Day Rule)
          </span>
        </div>
      </div>

      {/* React-Leaflet Map Container */}
      <MapContainer
        center={originCoords}
        zoom={8}
        scrollWheelZoom={false}
        style={{
          height,
          width: '100%',
          background: typeof document !== 'undefined' && document.documentElement.classList.contains('light') ? '#F1ECE2' : '#081F20',
        }}
      >
        <ChangeMapView bounds={bounds} />

        {/* High-Performance, Zero-Key CartoDB Voyager / Dark-Matter Tiles (Zero watermarks, enterprise design) */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url={
            typeof document !== 'undefined' && document.documentElement.classList.contains('light')
              ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
              : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          }
          subdomains="abcd"
          maxZoom={19}
        />

        {/* Origin Marker */}
        <Marker
          position={originCoords}
          icon={createCustomIcon('#10B981', route?.originId || 'ORIGIN', '#081F20')}
        >
          <Popup>
            <div className="text-xs p-1 font-mono text-[#081F20]">
              <strong>Origin:</strong> {originName} ({route?.originId})
            </div>
          </Popup>
        </Marker>

        {/* Destination Marker */}
        <Marker
          position={destCoords}
          icon={createCustomIcon('#FFD400', route?.destId || 'DEST', '#081F20')}
        >
          <Popup>
            <div className="text-xs p-1 font-mono text-[#081F20]">
              <strong>Destination:</strong> {destName} ({route?.destId})
            </div>
          </Popup>
        </Marker>

        {/* Route Polyline (Taxi Volt for OSRM Live Road Transit) */}
        <Polyline
          positions={polylinePositions}
          pathOptions={{
            color: '#FFD400',
            weight: 4,
            opacity: 0.95,
            dashArray: mode === 'OSRM_LIVE' ? null : '6, 8',
          }}
        />
      </MapContainer>

      {/* Bottom Summary Bar */}
      <div className="p-3 bg-abyss-elevated border-t border-sand-border flex flex-wrap items-center justify-between text-xs font-mono gap-2 text-abyss-text">
        <div className="flex items-center space-x-2 text-abyss-muted">
          <MapPin className="w-3.5 h-3.5 text-volt" />
          <span>{originName}</span>
          <span className="text-volt">➔</span>
          <span className="text-abyss-text font-bold">{destName}</span>
        </div>
        <div className="flex items-center space-x-3 text-[11px]">
          <span className="text-volt flex items-center gap-1 font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Road Velocity Guardrail Active</span>
          </span>
        </div>
      </div>
    </div>
  );
}

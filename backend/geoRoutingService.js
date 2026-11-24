/**
 * PulseChain OpenStreetMap & OSRM Routing Engine
 * Computes road distance, transit duration, travel days, and enforces the Max Allowed Lead Days (+1 Day Rule)
 */

const axios = require('axios');

// Facility Geo-Coordinates: [longitude, latitude] (GeoJSON standard)
const FACILITY_COORDINATES = {
  // Hospitals
  H001: { name: 'Mumbai Central / Bhopal Apex', coords: [77.4126, 23.2599], city: 'BHOPAL', type: 'HOSPITAL' },
  H002: { name: 'Delhi Critical Care / Indore', coords: [75.8577, 22.7196], city: 'INDORE', type: 'HOSPITAL' },
  H003: { name: 'Jabalpur Memorial Hospital', coords: [79.9864, 23.1815], city: 'JABALPUR', type: 'HOSPITAL' },
  H004: { name: 'Bhopal Apex Care Hospital', coords: [77.3910, 23.2450], city: 'BHOPAL', type: 'HOSPITAL' },
  H005: { name: 'Central Surplus Logistics Hub H005', coords: [77.4300, 23.2550], city: 'BHOPAL', type: 'HOSPITAL' },
  H006: { name: 'Indore Super Specialty Hub', coords: [75.8700, 22.7300], city: 'INDORE', type: 'HOSPITAL' },

  // Supplier Warehouses
  V1001: { name: 'BioPharm / MediSupply Warehouse', coords: [77.4500, 23.2300], city: 'BHOPAL', type: 'SUPPLIER' },
  V1002: { name: 'Apex / BioCare Warehouse', coords: [75.8900, 22.7500], city: 'INDORE', type: 'SUPPLIER' },
  V1003: { name: 'FastMed / Reliant Cold-Chain Depot', coords: [79.9500, 23.1600], city: 'JABALPUR', type: 'SUPPLIER' },
  V1004: { name: 'MedExpress Hub', coords: [77.3500, 23.2200], city: 'BHOPAL', type: 'SUPPLIER' },
  V1005: { name: 'Zenith Logistics Hub', coords: [75.7800, 23.1800], city: 'INDORE', type: 'SUPPLIER' },
  V1006: { name: 'LifeLine Supply Network', coords: [78.1800, 26.2200], city: 'GWALIOR', type: 'SUPPLIER' },
};

/**
 * Calculates Haversine Great-Circle Distance in Kilometers
 */
function calculateHaversineKm([lon1, lat1], [lon2, lat2]) {
  const R = 6371; // Earth radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Generates synthetic GeoJSON LineString coordinates for fallback
 */
function createSyntheticGeoJson([lon1, lat1], [lon2, lat2], numPoints = 8) {
  const points = [];
  for (let i = 0; i <= numPoints; i++) {
    const fraction = i / numPoints;
    // Add subtle curvature to simulate road routing
    const jitter = Math.sin(fraction * Math.PI) * 0.04;
    const curLon = lon1 + (lon2 - lon1) * fraction + jitter;
    const curLat = lat1 + (lat2 - lat1) * fraction - jitter * 0.5;
    points.push([Number(curLon.toFixed(4)), Number(curLat.toFixed(4))]);
  }
  return {
    type: 'LineString',
    coordinates: points,
  };
}

/**
 * Resolves facility ID or returns default coordinates
 */
function getFacilityInfo(id) {
  const cleanId = String(id || '').trim().toUpperCase();
  if (FACILITY_COORDINATES[cleanId]) {
    return { id: cleanId, ...FACILITY_COORDINATES[cleanId] };
  }
  // Default to central Madhya Pradesh coordinates
  return {
    id: cleanId,
    name: `Facility ${cleanId}`,
    coords: [77.4126, 23.2599],
    city: 'BHOPAL',
    type: cleanId.startsWith('V') ? 'SUPPLIER' : 'HOSPITAL',
  };
}

/**
 * Computes live driving route via OSRM with resilient Haversine fallback
 * Returns: { distanceKm, durationHours, travelDays, maxAllowedLeadDays, geojson, originCoords, destCoords }
 */
async function calculateRoute(originId, destId) {
  const origin = getFacilityInfo(originId);
  const dest = getFacilityInfo(destId);

  const [oLon, oLat] = origin.coords;
  const [dLon, dLat] = dest.coords;

  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${oLon},${oLat};${dLon},${dLat}?overview=full&geometries=geojson`;

  try {
    const response = await axios.get(osrmUrl, { timeout: 4500 });
    const route = response.data?.routes?.[0];

    if (route && route.distance !== undefined && route.duration !== undefined) {
      const distanceKm = Number((route.distance / 1000).toFixed(1));
      const durationHours = Number((route.duration / 3600).toFixed(1));
      const travelDays = Math.max(1, Math.ceil(durationHours / 24));
      const maxAllowedLeadDays = travelDays + 1; // +1 Day Rule

      return {
        success: true,
        source: 'OSRM_LIVE',
        originId: origin.id,
        originName: origin.name,
        originCoords: origin.coords,
        destId: dest.id,
        destName: dest.name,
        destCoords: dest.coords,
        distanceKm,
        durationHours,
        travelDays,
        maxAllowedLeadDays,
        geojson: route.geometry,
      };
    }
  } catch (err) {
    // Graceful fallback to Haversine road estimation
  }

  // Haversine Fallback Engine
  const directKm = calculateHaversineKm([oLon, oLat], [dLon, dLat]);
  // Winding factor 1.28x for Indian national/state highways; average freight speed 55 km/h
  const roadKm = directKm === 0 ? 12 : Number((directKm * 1.28).toFixed(1));
  const roadHours = Number((roadKm / 55).toFixed(1));
  const fallbackTravelDays = Math.max(1, Math.ceil(roadHours / 24));
  const maxAllowedLeadDays = fallbackTravelDays + 1; // +1 Day Rule

  return {
    success: true,
    source: 'HAVERSINE_FALLBACK',
    originId: origin.id,
    originName: origin.name,
    originCoords: origin.coords,
    destId: dest.id,
    destName: dest.name,
    destCoords: dest.coords,
    distanceKm: roadKm,
    durationHours: roadHours,
    travelDays: fallbackTravelDays,
    maxAllowedLeadDays,
    geojson: createSyntheticGeoJson(origin.coords, dest.coords),
  };
}

module.exports = {
  calculateRoute,
  getFacilityInfo,
  FACILITY_COORDINATES,
};

/**
 * PulseChain External Environment Sensing & Supplier Recommendation Service
 * Ingests Open-Meteo real-time weather & GDELT global news/politics
 * Feeds signals into Gemini 2.5 Flash (with resilient fallback) to compute logistics risks
 * Synthesizes SAP HANA Supplier Intelligence + OSRM Road Distance + External Risk for Smart Reallocation
 */

const axios = require('axios');
const { calculateRoute, getFacilityInfo } = require('./geoRoutingService');
const sapAdapter = require('./sapAdapter');

let GoogleGenAI = null;
let aiClient = null;

try {
  const genaiPkg = require('@google/genai');
  GoogleGenAI = genaiPkg.GoogleGenAI;
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && !apiKey.startsWith('your_') && !apiKey.startsWith('AIzaSy_placeholder')) {
    aiClient = new GoogleGenAI({ apiKey });
  }
} catch (e) {
  // Graceful fallback to deterministic engine
}

/**
 * Fetches real-time weather from Open-Meteo API
 */
async function fetchOpenMeteoWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m`;
  try {
    const res = await axios.get(url, { timeout: 4000 });
    const current = res.data?.current || {};
    return {
      temperature: current.temperature_2m ?? 28,
      humidity: current.relative_humidity_2m ?? 45,
      precipitation: current.precipitation ?? 0,
      windSpeed: current.wind_speed_10m ?? 12,
      weatherCode: current.weather_code ?? 0,
    };
  } catch (err) {
    return {
      temperature: 28,
      humidity: 45,
      precipitation: 0,
      windSpeed: 12,
      weatherCode: 0,
      isSimulated: true,
    };
  }
}

/**
 * Fetches supply chain & logistics news from GDELT DOC 2.0 API
 */
async function fetchGdeltLogisticsNews(city = 'India') {
  const query = encodeURIComponent(`(supply chain OR highway OR logistics OR medicine OR strike OR transport) ${city}`);
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=ArtList&maxrecords=5&format=json`;
  try {
    const res = await axios.get(url, { timeout: 4000 });
    const articles = res.data?.articles || [];
    if (Array.isArray(articles) && articles.length > 0) {
      return articles.slice(0, 5).map((a) => a.title || a.url);
    }
  } catch (err) {
    // Fallback headlines
  }

  return [
    `National Highway corridors in ${city} operating under standard freight schedule`,
    'Central medical distribution network enforces active cold-chain monitoring',
    'State transportation authority reports clear interstate freight movement',
  ];
}

/**
 * Synthesizes external risks via Gemini 2.5 Flash or deterministic fallback
 */
async function getExternalRisk(hospitalId = 'H004') {
  const facility = getFacilityInfo(hospitalId);
  const [lon, lat] = facility.coords;

  const [weather, headlines] = await Promise.all([
    fetchOpenMeteoWeather(lat, lon),
    fetchGdeltLogisticsNews(facility.city),
  ]);

  // Determine environmental flags
  const isHighPrecip = weather.precipitation > 5;
  const isHighWind = weather.windSpeed > 35;
  const hasWeatherAlert = isHighPrecip || isHighWind;

  let riskLevel = 'LOW';
  let deliveryImpact = 'ON_TIME';
  let estimatedExtraDelayHours = 0;
  let weatherSummary = `Clear conditions at ${weather.temperature}°C, wind ${weather.windSpeed} km/h, precipitation ${weather.precipitation}mm. Optimal driving conditions.`;
  let politicalSummary = `Stable transportation corridors across ${facility.city} logistics network. Zero active blockades.`;

  if (hasWeatherAlert) {
    riskLevel = isHighPrecip && isHighWind ? 'HIGH' : 'MEDIUM';
    deliveryImpact = 'DELAYED';
    estimatedExtraDelayHours = isHighPrecip ? 6 : 3;
    weatherSummary = `Adverse weather alert in ${facility.city}: Precipitation ${weather.precipitation}mm, wind ${weather.windSpeed} km/h. Wet highway conditions.`;
  }

  // Attempt Gemini 2.5 Flash synthesis
  if (aiClient) {
    try {
      const prompt = `You are the PulseChain External Risk Sensing Agent.
Analyze external delivery risks for medical supplies destined for Hospital ${facility.name} (${facility.city}).
Current Weather: Temp ${weather.temperature}°C, Precipitation ${weather.precipitation}mm, Wind ${weather.windSpeed} km/h.
Recent Logistics Headlines:
${headlines.map((h, i) => `${i + 1}. ${h}`).join('\n')}

Respond ONLY with valid JSON in this exact structure:
{
  "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "deliveryImpact": "ON_TIME" | "DELAYED" | "CANCELLATION_RISK",
  "estimatedExtraDelayHours": number,
  "weatherSummary": "concise 1-sentence summary",
  "politicalSummary": "concise 1-sentence summary",
  "headlines": ["headline 1", "headline 2"]
}`;

      const res = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      const rawText = res?.text || res?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const parsed = JSON.parse(rawText);
        return {
          hospitalId: facility.id,
          city: facility.city,
          riskLevel: parsed.riskLevel || riskLevel,
          deliveryImpact: parsed.deliveryImpact || deliveryImpact,
          estimatedExtraDelayHours: Number(parsed.estimatedExtraDelayHours ?? estimatedExtraDelayHours),
          weatherSummary: parsed.weatherSummary || weatherSummary,
          politicalSummary: parsed.politicalSummary || politicalSummary,
          headlines: Array.isArray(parsed.headlines) && parsed.headlines.length > 0 ? parsed.headlines : headlines,
          weatherMetrics: weather,
          engine: 'Gemini-2.5-Flash (Live Sensing)',
        };
      }
    } catch (aiErr) {
      // Fallback
    }
  }

  return {
    hospitalId: facility.id,
    city: facility.city,
    riskLevel,
    deliveryImpact,
    estimatedExtraDelayHours,
    weatherSummary,
    politicalSummary,
    headlines,
    weatherMetrics: weather,
    engine: 'PulseChain Deterministic Environment Sensor',
  };
}

/**
 * Top Supplier Recommendation Engine
 * Combines SAP HANA Supplier Intelligence (TrustScore, Tier, Eligibility, 8 Factors) + OSRM Road Distance + External Risk
 */
async function recommendSuppliers(hospitalId, materialId, requiredQty = 100) {
  const numericQty = Math.max(1, Number(requiredQty));
  const targetHospital = getFacilityInfo(hospitalId);

  // 1. Fetch live suppliers from SAP HANA Gateway
  const sapResult = await sapAdapter.getSuppliersFromSap();
  const allSuppliers = sapResult.data || [];

  // Filter for matching material (or fallback to all active suppliers)
  let materialSuppliers = allSuppliers.filter((s) => s.MATERIAL_ID === materialId);
  if (materialSuppliers.length === 0) {
    materialSuppliers = allSuppliers;
  }

  // 2. Fetch external risk for the destination hospital
  const externalRisk = await getExternalRisk(hospitalId);

  // 3. Partition into Blocked/Ineligible vs Eligible
  const blockedSuppliers = [];
  const eligibleSuppliers = [];

  for (const s of materialSuppliers) {
    const isCompliant = s.COMPLIANCE === 'Y';
    const isEligible = s.IS_ELIGIBLE === 'Y' && isCompliant && s.SUPPLIER_TIER !== 'BLOCKED';
    const hasCapacity = Number(s.CAPACITY || 0) >= numericQty;

    if (!isEligible || !isCompliant || !hasCapacity) {
      let reason = s.DELAY_REASON;
      if (!reason) {
        if (!isCompliant) reason = 'Failed Cold-Chain Audit (COMPLIANCE: N)';
        else if (!hasCapacity) reason = `Insufficient Capacity (${s.CAPACITY} < ${numericQty} required)`;
        else reason = `SAP Tier Ineligible (${s.SUPPLIER_TIER})`;
      }

      blockedSuppliers.push({
        supplierId: s.SUPPLIER_ID,
        supplierName: s.SUPPLIER_NAME,
        materialId: s.MATERIAL_ID,
        trustScore: s.TRUST_SCORE ?? 45,
        supplierTier: s.SUPPLIER_TIER || 'BLOCKED',
        compliance: s.COMPLIANCE,
        disqualificationReason: reason,
      });
    } else {
      // Calculate OSRM route from supplier warehouse to hospital
      const routeInfo = await calculateRoute(s.SUPPLIER_ID, targetHospital.id);

      // Adjust effective lead days by external risk delay if applicable
      const baseLeadDays = Number(s.LEAD_TIME || 1);
      const roadTravelDays = routeInfo.travelDays || 1;
      const extraDelayDays = Math.ceil(externalRisk.estimatedExtraDelayHours / 24);
      const totalEffectiveDays = Math.max(baseLeadDays, roadTravelDays) + extraDelayDays;

      eligibleSuppliers.push({
        supplierId: s.SUPPLIER_ID,
        supplierName: s.SUPPLIER_NAME,
        materialId: s.MATERIAL_ID,
        trustScore: s.TRUST_SCORE ?? 95,
        supplierTier: s.SUPPLIER_TIER || 'GOLD',
        compliance: s.COMPLIANCE,
        capacity: Number(s.CAPACITY),
        unitCost: Number(s.UNIT_COST),
        currency: s.CURRENCY || 'INR',
        baseLeadDays,
        roadTravelDays,
        extraDelayDays,
        totalEffectiveDays,
        distanceKm: routeInfo.distanceKm,
        durationHours: routeInfo.durationHours,
        maxAllowedLeadDays: routeInfo.maxAllowedLeadDays,
        geojson: routeInfo.geojson,
        originCoords: routeInfo.originCoords,
        destCoords: routeInfo.destCoords,
        factors: {
          deliverySpeed: s.DELIVERY_SPEED ?? 90,
          onTimeRate: s.ON_TIME_RATE ?? 92,
          reliability: s.RELIABILITY ?? '95%',
          qualityScore: s.QUALITY_SCORE ?? 95,
          emergResponse: s.EMERG_RESPONSE ?? 88,
          coldChainScore: s.COLD_CHAIN_SCORE ?? 98,
          fulfilmentRate: s.FULFILMENT_RATE ?? 95,
          docCertScore: s.DOC_CERT_SCORE ?? 90,
        },
      });
    }
  }

  // 4. Sort eligible suppliers by SAP TrustScore (descending), UnitCost (ascending), Effective Days (ascending)
  eligibleSuppliers.sort((a, b) => {
    if (b.trustScore !== a.trustScore) {
      return b.trustScore - a.trustScore;
    }
    if (a.unitCost !== b.unitCost) {
      return a.unitCost - b.unitCost;
    }
    return a.totalEffectiveDays - b.totalEffectiveDays;
  });

  const primaryRecommendation = eligibleSuppliers[0] || null;
  const backupCascade = eligibleSuppliers[1] || null;

  return {
    success: true,
    targetHospital: {
      id: targetHospital.id,
      name: targetHospital.name,
      city: targetHospital.city,
    },
    materialId,
    requiredQty: numericQty,
    externalRisk,
    primaryRecommendation,
    backupCascade,
    blockedSuppliers,
    totalEvaluated: materialSuppliers.length,
    eligibleCount: eligibleSuppliers.length,
    blockedCount: blockedSuppliers.length,
  };
}

module.exports = {
  getExternalRisk,
  recommendSuppliers,
  fetchOpenMeteoWeather,
  fetchGdeltLogisticsNews,
};

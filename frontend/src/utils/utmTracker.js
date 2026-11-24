/**
 * PulseChain UTM Parameter Tracker
 * Captures UTM query parameters from entry URL, persists in sessionStorage,
 * and provides clean audit/analytics context.
 */

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
const STORAGE_KEY = 'pulsechain_utm_params';

export function captureUtmParams() {
  if (typeof window === 'undefined') return {};
  try {
    const params = new URLSearchParams(window.location.search);
    const captured = {};
    let hasUtm = false;

    for (const key of UTM_KEYS) {
      const val = params.get(key);
      if (val) {
        captured[key] = val.trim();
        hasUtm = true;
      }
    }

    if (hasUtm) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(captured));
      return captured;
    }

    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (err) {
    console.warn('[UTM Tracker] Error capturing params:', err);
    return {};
  }
}

export function getUtmParams() {
  if (typeof window === 'undefined') return {};
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

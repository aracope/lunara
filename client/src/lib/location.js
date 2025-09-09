/**
 * formatLocation(loc)
 *
 * Purpose:
 *  - Human-friendly formatter for location objects returned by the Moon API.
 *  - Prioritizes city/state/country if present; falls back to lat/lon coords.
 *
 * Behavior:
 *  - If loc is falsy → returns "—".
 *  - If loc.city / loc.state / loc.country exist:
 *      returns them joined with commas (skips missing parts).
 *      Example: { city: "Boise", state: "ID", country: "USA" }
 *               → "Boise, ID, USA"
 *  - If no city/state/country, but numeric lat/lon:
 *      returns coordinates to 2 decimals.
 *      Example: { lat: 43.6123, lon: -116.2146 }
 *               → "43.61, -116.21"
 *  - Otherwise → returns "—".
 *
 * Usage:
 *   import { formatLocation } from "./location";
 *   const label = formatLocation(moonData.location);
 */

export function formatLocation(loc) {
  if (!loc) return "—";
  const parts = [loc.city, loc.state, loc.country].filter(Boolean);
  if (parts.length) return parts.join(", ");
  if (typeof loc.lat === "number" && typeof loc.lon === "number") {
    return `${loc.lat.toFixed(2)}, ${loc.lon.toFixed(2)}`;
  }
  return "—";
}

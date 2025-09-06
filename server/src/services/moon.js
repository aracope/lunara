import { pool } from "../db.js";
import { MOON_API_KEY, MOON_API_URL } from "../config.js";

/** Join "YYYY-MM-DD" + "HH:MM" into a SQL-friendly timestamp string.
 *  Returns null when hhmm is missing/invalid.
 */
function combineDateTime(dateYmd, hhmm) {
  if (!hhmm || typeof hhmm !== "string") return null;
  if (!/^\d{1,2}:\d{2}$/.test(hhmm.trim())) return null; // "H:MM" or "HH:MM"
  return `${dateYmd} ${hhmm.trim()}:00`;
}

/** Round to 2 decimals to stabilize cache keys for lat/lon. */
function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

/** Coerce to YYYY-MM-DD (UTC) */
function toYMD(d) {
  if (typeof d === "string") return d;
  const iso = new Date(d).toISOString();
  return iso.slice(0, 10);
}

/**
 * Fetch from IPGeolocation Astronomy API.
 * You may provide one of:
 *  - { lat, lon } numbers
 *  - { location } string (e.g., "Boise, ID" or "Paris, FR")
 *  - { ip } string (IPv4/IPv6)
 *
 * Always include dateYmd.
 *
 * Returns normalized:
 *  {
 *   phase: string | null,
 *   moonrise: "HH:MM" | null,
 *   moonset: "HH:MM" | null,
 *   zodiacSign: string | null,
 *   location: {
 *     lat: number | null,
 *     lon: number | null,
 *     city: string | null,
 *     state: string | null,
 *     country: string | null,
 *     locality: string | null,
 *     elevation: number | null
 *   }
 * }
 *
 * Errors:
 *  - 400: No location provided
 *  - 500: Missing MOON_API_KEY
 *  - 502: Network/HTTP error contacting upstream
 */
async function fetchMoonFromApi({ dateYmd, lat, lon, location, ip }) {
  if (!MOON_API_KEY) {
    throw Object.assign(new Error("Missing MOON_API_KEY"), { status: 500 });
  }

  // e.g. "https://api.ipgeolocation.io/astronomy"
  const url = new URL(MOON_API_URL);
  url.searchParams.set("apiKey", MOON_API_KEY);
  url.searchParams.set("date", dateYmd);

  // NOTE: API expects "long" (not "lon")
  if (typeof lat === "number" && typeof lon === "number") {
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("long", String(lon)); // NOTE: "long" (not "lon")
  } else if (location && String(location).trim()) {
    url.searchParams.set("location", String(location).trim());
  } else if (ip && String(ip).trim()) {
    url.searchParams.set("ip", String(ip).trim());
  } else {
    throw Object.assign(new Error("No location provided"), { status: 400 });
  }

  // Abort after 15s (Node fetch doesn't take a "timeout" option)
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 15000);

  let resp;
  try {
    resp = await fetch(url, { signal: controller.signal });
  } catch (e) {
    clearTimeout(t);
    throw Object.assign(new Error("Moon API network error"), {
      status: 502,
      cause: e,
    });
  }
  clearTimeout(t);

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw Object.assign(new Error(`Moon API error: ${resp.status}`), {
      status: 502,
      body: text,
    });
  }

  const data = await resp.json();

  // Defensive parsing for different shapes/keys from the API
  const loc = data.location || {};
  const phase =
    data.moon_phase ||
    data.moonPhase ||
    data.astronomy?.moon_phase ||
    data.moon_status ||
    null;

  const moonrise = data.moonrise || data.astronomy?.moonrise || null;
  const moonset = data.moonset || data.astronomy?.moonset || null;
  const zodiac = data.moon_zodiac || data.moon_sign || null;

  // // Prefer response coords; fall back to inputs
  const outLat =
    loc.latitude !== undefined
      ? Number(loc.latitude)
      : typeof lat === "number"
      ? lat
      : null;

  const outLon =
    loc.longitude !== undefined
      ? Number(loc.longitude)
      : typeof lon === "number"
      ? lon
      : null;

  return {
    phase,
    moonrise,
    moonset,
    zodiacSign: zodiac,
    location: {
      lat: outLat,
      lon: outLon,
      city: loc.city || null,
      state: loc.state_prov || null,
      country: loc.country_name || null,
      locality: loc.locality || null,
      elevation: loc.elevation != null ? Number(loc.elevation) : null,
    },
  };
}

/**
 * Get moon data for a date and place, with 24h DB caching by rounded coords.
 *
 * Inputs (one of):
 *  - (date, lat, lon)
 *  - (date, locationStr)
 *  - (date, ip)
 *
 * Behavior:
 *  1) Resolve inputs via API to coords + friendly labels.
 *  2) Check cache by (for_date, round2(lat), round2(lon)) and freshness (<= 24h).
 *  3) If stale/missing, upsert new data, then return normalized payload.
 *
 * Returns:
 * {
 *   date: "YYYY-MM-DD",
 *   phase, moonrise, moonset, zodiacSign,
 *   location: { lat, lon, city, state, country, locality, elevation }
 * }
 */
export async function getMoonFor(date, lat, lon, locationStr, ip) {
  const forDate = toYMD(date || new Date());

  // Step 1: resolve inputs -> canonical coords + labels
  const first = await fetchMoonFromApi({
    dateYmd: forDate,
    lat: typeof lat === "number" ? round2(lat) : undefined,
    lon: typeof lon === "number" ? round2(lon) : undefined,
    location: locationStr,
    ip,
  });

  const rLat = round2(first.location.lat);
  const rLon = round2(first.location.lon);

  // Step 2: check cache
  const { rows } = await pool.query(
    `SELECT id, for_date, lat, lon, phase, moonrise, moonset,
            created_at, (NOW() - created_at) <= INTERVAL '24 hours' AS fresh
     FROM moon_data
     WHERE for_date = $1 AND lat = $2 AND lon = $3
     LIMIT 1`,
    [forDate, rLat, rLon]
  );

  if (rows[0]?.fresh) {
    const m = rows[0];
    return {
      date: m.for_date,
      phase: m.phase,
      moonrise: m.moonrise,
      moonset: m.moonset,
      zodiacSign: first.zodiacSign ?? null,
      location: {
        ...first.location,
        lat: Number(m.lat),
        lon: Number(m.lon),
      },
    };
  }

  // Step 3: upsert & return fresh data from API-normalized result
  const upsert = await pool.query(
    `INSERT INTO moon_data (for_date, lat, lon, phase, moonrise, moonset)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (for_date, lat, lon)
     DO UPDATE SET
       phase      = EXCLUDED.phase,
       moonrise   = EXCLUDED.moonrise,
       moonset    = EXCLUDED.moonset,
       created_at = NOW()
     RETURNING id, for_date, lat, lon, phase, moonrise, moonset, created_at`,
    [
      forDate,
      rLat,
      rLon,
      first.phase,
      combineDateTime(forDate, first.moonrise),
      combineDateTime(forDate, first.moonset),
    ]
  );

  const m = upsert.rows[0];

  return {
    date: m.for_date,
    phase: m.phase,
    moonrise: m.moonrise,
    moonset: m.moonset,
    zodiacSign: first.zodiacSign ?? null,
    location: {
      ...first.location,
      lat: Number(m.lat),
      lon: Number(m.lon),
    },
  };
}

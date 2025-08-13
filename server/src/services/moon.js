import { pool } from "../db.js";
import { MOON_API_KEY, MOON_API_URL } from "../config.js";

// "2025-08-13" + "22:47" -> "2025-08-13 22:47:00"
function combineDateTime(dateYmd, hhmm) {
  if (!hhmm || typeof hhmm !== "string") return null;
  // Accept "H:MM" or "HH:MM"
  if (!/^\d{1,2}:\d{2}$/.test(hhmm.trim())) return null;
  return `${dateYmd} ${hhmm.trim()}:00`;
}

// helper: round to 2 decimals
function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

// helper: ISO date (YYYY-MM-DD) from Date or string
function toYMD(d) {
  if (typeof d === "string") return d;
  const iso = new Date(d).toISOString();
  return iso.slice(0, 10);
}

/**
 * Fetch from third-party API (ipgeolocation.io style)
 * Docs: https://ipgeolocation.io/astronomy-api.html
 * Example params: ?apiKey=...&lat=...&long=...&date=YYYY-MM-DD
 */
async function fetchMoonFromApi(dateYmd, lat, lon) {
  if (!MOON_API_KEY)
    throw Object.assign(new Error("Missing MOON_API_KEY"), { status: 500 });

  const url = new URL(MOON_API_URL);
  url.searchParams.set("apiKey", MOON_API_KEY);
  url.searchParams.set("lat", lat);
  // ipgeolocation uses "long" (not "lon")
  url.searchParams.set("long", lon);
  url.searchParams.set("date", dateYmd);

  const resp = await fetch(url, { timeout: 15000 }).catch((e) => {
    throw Object.assign(new Error("Moon API network error"), {
      status: 502,
      cause: e,
    });
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw Object.assign(new Error(`Moon API error: ${resp.status}`), {
      status: 502,
      body: text,
    });
  }
  const data = await resp.json();

  // Normalize fields defensively (APIs vary; ipgeolocation typically provides these)
  const phase = data.moon_phase || data.moonPhase || data.moon_status || null;
  const moonrise = data.moonrise || null;
  const moonset = data.moonset || null;
  const zodiac = data.moon_zodiac || data.moon_sign || null;

  return { phase, moonrise, moonset, zodiacSign: zodiac };
}

/**
 * getMoonFor(date, lat, lon)
 * - rounds coords
 * - checks cache by (for_date, lat, lon)
 * - returns cached if <= 24h old, else refreshes and upserts
 */
export async function getMoonFor(date, lat, lon) {
  const forDate = toYMD(date || new Date());
  const rLat = round2(lat);
  const rLon = round2(lon);

  // 1) Check cache
  const { rows } = await pool.query(
    `SELECT id, for_date, lat, lon, phase, moonrise, moonset,
            created_at, (NOW() - created_at) <= INTERVAL '24 hours' AS fresh,
            NULLIF(NULLIF('', ''), '') AS zodiac_sign  -- placeholder if you didn’t add column
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
      zodiacSign: m.zodiac_sign ?? null,
      location: { lat: Number(m.lat), lon: Number(m.lon) },
    };
  }

  // 2) Fetch fresh
  const fromApi = await fetchMoonFromApi(forDate, rLat, rLon);

  // 3) Upsert cache
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
      fromApi.phase,
      combineDateTime(forDate, fromApi.moonrise), // <-- convert here
      combineDateTime(forDate, fromApi.moonset), // <-- and here
    ]
  );
}

import { TAROT_API_BASE } from "../config.js";
import { cacheWrap } from "../utils/cache.js";

if (!TAROT_API_BASE) {
  // Fail fast at module load if misconfigured
  throw new Error("TAROT_API_BASE is not set");
}

const DEFAULT_TIMEOUT_MS = 10000;

/**
 * Internal: JSON fetch with AbortController timeout & defensive parse.
 * - Adds Accept: application/json
 * - On non-2xx, throws Error with { status, data? }
 * - Retries once on 429/502/503/504 with tiny backoff.
 */
async function jsonFetch(
  path,
  { method = "GET", headers = {}, body, timeoutMs = DEFAULT_TIMEOUT_MS } = {}
) {
  const attempt = async () => {
    const ctrl = new AbortController();
    const url = new URL(path, TAROT_API_BASE).toString();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const resp = await fetch(url, {
        method,
        headers: { Accept: "application/json", ...headers },
        body,
        signal: ctrl.signal,
      });
      const ct = resp.headers.get("content-type") || "";
      const isJson = ct.includes("application/json");
      const data = isJson
        ? await resp.json().catch(() => ({}))
        : await resp.text();

      if (!resp.ok) {
        const err = new Error(
          typeof data === "object" && data?.error
            ? data.error
            : `Tarot API error ${resp.status}`
        );
        err.status = resp.status;
        err.data = data;
        throw err;
      }
      return data;
    } catch (e) {
      if (e.name === "AbortError") {
        const err = new Error("Upstream timeout");
        err.status = 504;
        throw err;
      }
      throw e;
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    return await attempt();
  } catch (e) {
    if ([429, 502, 503, 504].includes(e.status)) {
      await new Promise((r) => setTimeout(r, 300));
      return attempt();
    }
    throw e;
  }
}

/**
 * Get deterministic daily card.
 * Optional: { seed: string|number, date: "YYYY-MM-DD" }
 * Cache key includes seed+date. TTL = 24h.
 */
export async function getCardOfDay({ seed, date } = {}) {
  const qs = new URLSearchParams();
  if (seed != null && String(seed).length) qs.set("seed", String(seed));
  if (date != null && String(date).length) qs.set("date", String(date));
  const suffix = qs.toString() ? `/daily?${qs}` : "/daily";
  const key = `tarot:daily:${qs.toString() || "today"}`;
  return cacheWrap(key, 24 * 60 * 60 * 1000, () => jsonFetch(suffix));
}

/**
 * Draw a Yes/No/Maybe.
 * - If payload.question is present, POST JSON to /yesno.
 * - Otherwise, GET /yesno (and allow caller to normalize casing if desired).
 * No caching: this should feel "fresh" each time.
 */
export async function drawYesNo(payload) {
  if (payload?.question) {
    return jsonFetch("/yesno", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: payload.question }),
    });
  }
  // Simple GET path (no early return bug)
  return jsonFetch("/yesno");
}

/**
 * List cards for dropdown/search.
 * Supports { arcana, suit, q, limit=100, offset=0 }.
 * Cached 6h by the full querystring.
 */
export async function getCards(params = {}) {
  const qs = new URLSearchParams();
  if (params.arcana) qs.set("arcana", String(params.arcana));
  if (params.suit) qs.set("suit", String(params.suit));
  if (params.q) qs.set("q", String(params.q));
  const lim = clampInt(params.limit, 1, 200, 100);
  const off = clampInt(params.offset, 0, 10000, 0);
  qs.set("limit", String(lim));
  qs.set("offset", String(off));

  const key = `tarot:cards:${qs.toString()}`;
  return cacheWrap(key, 6 * 60 * 60 * 1000, () => jsonFetch(`/cards?${qs}`));
}

/**
 * Get a single card by ID (positive integer).
 * Cached 24h since deck is static across a day.
 */
export async function getCardById(id) {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) {
    const e = new Error("Invalid id");
    e.status = 400;
    throw e;
  }
  const key = `tarot:card:${n}`;
  return cacheWrap(key, 24 * 60 * 60 * 1000, () => jsonFetch(`/cards/${n}`));
}

// ------------------------------- small helpers -------------------------------
function clampInt(v, min, max, dflt) {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : dflt;
}

/*
NOTES FOR FUTURE ARA:
- If you later add multi-card draws, expose drawCards(count) here and consider
  *no caching* (draws are expected to be random), with count clamped 1..10.
- If you notice Render cold starts causing timeouts, you can:
  (a) bump DEFAULT_TIMEOUT_MS to 15000, and/or
  (b) add a tiny /health ping at boot to warm the dyno.
- If the deck ever becomes user-mutable, shorten TTLs or include a deckVersion
  query param and add it to cache keys (e.g., tarot:cards:v{deckVersion}:...).
*/

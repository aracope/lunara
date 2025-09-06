import { TAROT_API_BASE } from "../config.js";

if (!TAROT_API_BASE) {
  // Fail fast at module load if misconfigured
  throw new Error("TAROT_API_BASE is not set");
}

const DEFAULT_TIMEOUT_MS = 15000;

/**
 * Race a promise against a timeout; rejects with { status: 504 } on timeout.
 */
function withTimeout(ms, promise) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      const err = new Error("Upstream timeout");
      err.status = 504;
      setTimeout(() => reject(err), ms);
    }),
  ]);
}

/**
 * Minimal JSON fetch helper with:
 * - default Accept: application/json
 * - timeout via withTimeout
 * - defensive JSON parsing
 * - single retry for 429/502/503/504 (basic jitter)
 *
 * Throws an Error with `status` and optionally `data` from upstream.
 */
async function jsonFetch(
  path,
  { method = "GET", headers = {}, body, timeoutMs = DEFAULT_TIMEOUT_MS } = {}
) {
  const attempt = async () => {
    const url = new URL(path, TAROT_API_BASE).toString();
    const resp = await withTimeout(
      timeoutMs,
      fetch(url, {
        method,
        headers: { Accept: "application/json", ...headers },
        body,
      })
    );

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
 * Optional query params:
 *  - seed: string | number (stable seed for determinism)
 *  - date: "YYYY-MM-DD" (defaults to today on upstream)
 *
 * Returns upstream JSON (card object + date).
 */
export async function getCardOfDay({ seed, date } = {}) {
  const qs = new URLSearchParams();
  if (seed != null && String(seed).length) qs.set("seed", String(seed));
  if (date != null && String(date).length) qs.set("date", String(date));
  const suffix = qs.toString() ? `/daily?${qs}` : "/daily";
  return jsonFetch(suffix);
}

/**
 * Draw a Yes/No/Maybe.
 * - If `payload.question` is present, POST with JSON body.
 * - Otherwise try GET /yesno; fall back to POST on 405.
 *
 * Returns: { answer: "Yes" | "No" | "Maybe", ... }
 */
export async function drawYesNo(payload) {
  if (payload?.question) {
    return jsonFetch("/yesno", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: payload.question }),
    });
  }

  try {
    // GET
    return await jsonFetch("/yesno");
  } catch (e) {
    if (e.status === 405) {
      return jsonFetch("/yesno", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
    }
    throw e;
  }
}

/**
 * Get a single card by ID.
 * - Validates ID as a non-negative integer.
 * - Throws 400 on invalid input.
 */
export async function getCardById(id) {
  const n = Number(id);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) {
    const e = new Error("Invalid id");
    e.status = 400;
    throw e;
  }
  return jsonFetch(`/cards/${n}`);
}

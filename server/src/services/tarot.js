import { TAROT_API_BASE } from "../config.js";

if (!TAROT_API_BASE) {
  throw new Error("TAROT_API_BASE is not set");
}

const DEFAULT_TIMEOUT_MS = 15000;

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

async function jsonFetch(
  path,
  { method = "GET", headers = {}, body, timeoutMs = DEFAULT_TIMEOUT_MS } = {}
) {
  const attempt = async () => {
    const url = new URL(path, TAROT_API_BASE).toString();
    const resp = await withTimeout(
      timeoutMs,
      fetch(url, { method, headers: { Accept: "application/json", ...headers }, body })
    );

    const ct = resp.headers.get("content-type") || "";
    const isJson = ct.includes("application/json");
    const data = isJson ? await resp.json().catch(() => ({})) : await resp.text();

    if (!resp.ok) {
      const err = new Error(
        typeof data === "object" && data?.error ? data.error : `Tarot API error ${resp.status}`
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
 * Get deterministic daily card. Supports optional { seed, date } -> query params.
 * If omitted, backend returns a global (non-user-specific) daily card for today.
 */
export async function getCardOfDay({ seed, date } = {}) {
  const qs = new URLSearchParams();
  if (seed != null && String(seed).length) qs.set("seed", String(seed));
  if (date != null && String(date).length) qs.set("date", String(date));
  const suffix = qs.toString() ? `/daily?${qs}` : "/daily";
  return jsonFetch(suffix);
}

/**
 * Yes/No/Maybe draw. If a question is provided, POST it; otherwise prefer GET.
 * Falls back to POST for APIs that only accept POST.
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
    return await jsonFetch("/yesno"); // GET
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

export async function getCardById(id) {
  const n = Number(id);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) {
    const e = new Error("Invalid id");
    e.status = 400;
    throw e;
  }
  return jsonFetch(`/cards/${n}`);
}
/**
 *
 * Purpose:
 *  - Thin wrapper around `fetch` for the client.
 *  - Centralizes base URL, JSON handling, credentials, and error formatting.
 *  - Exposes a small `api` surface for auth, journal, moon, and tarot endpoints.
 *
 * Base URL:
 *  - Reads VITE_API_BASE (e.g., "https://api.example.com") and strips trailing slashes.
 *  - Falls back to "http://localhost:3001" in dev.
 *
 * request(path, options):
 *  - Sends requests with `credentials: "include"` so HttpOnly cookies flow.
 *  - If `body` is provided, JSON-encodes it and sets "Content-Type: application/json".
 *  - Parses JSON when content-type includes `application/json`, otherwise returns text.
 *  - On non-2xx responses, throws Error("<status>: <message>") where message comes from
 *    JSON `{error}` field or the raw text body.
 *
 * qs(obj):
 *  - Builds URLSearchParams, removing null/undefined and empty/whitespace-only values.
 *  - Trims values before adding.
 *
 * API methods:
 *  - Auth: me, login(email, password), signup(email, password, displayName?), logout
 *    - `signup` trims `displayName` and omits it if blank.
 *  - Journal: listJournal, createJournal(payload), updateJournal(id, payload)
 *  - Moon:
 *    - moonToday(params) where `params` is an object (e.g., {location, lat, lon, useClientIp})
 *    - moonToday(lat, lon) overload: numbers for coords are accepted as separate params
 *    - moonTodayByPlace(place), moonTodayByCoords(lat, lon), moonTodayByIp()
 *    - moonOn(dateYmd, where) for historical lookups (where can be {location} or {lat, lon})
 *  - Tarot: tarotDaily, tarotYesNo(question), tarotCard(id), tarotList
 *
 * Usage:
 *   import { api } from "./apiClient";
 *   const { user } = await api.me();
 *   const today = await api.moonToday({ location: "Boise, ID" });
 *
 * Error handling pattern:
 *   try {
 *     await api.login(email, password);
 *   } catch (err) {
 *     // err.message might be "401: Invalid credentials"
 *   }
 */

const BASE = (import.meta.env.VITE_API_BASE || "http://localhost:3001").replace(
  /\/+$/,
  ""
);

async function request(path, { method = "GET", body, headers = {} } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: "include",
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => ({})) : await res.text();
  if (!res.ok) {
    const msg = isJson ? data?.error || JSON.stringify(data) : data || "";
    throw new Error(`${res.status}: ${msg || "Request failed"}`);
  }
  return data;
}

function qs(obj) {
  const usp = new URLSearchParams();
  Object.entries(obj || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    const s = String(v).trim();
    if (s !== "") usp.set(k, s);
  });
  return usp.toString();
}

export const api = {
  get: (p) => request(p),
  post: (p, b) => request(p, { method: "POST", body: b }),
  patch: (p, b) => request(p, { method: "PATCH", body: b }),
  del: (p) => request(p, { method: "DELETE" }),

  // Auth
  me: () => request("/auth/me"),
  login: (email, password) =>
    request("/auth/login", { method: "POST", body: { email, password } }),
  signup: (email, password, displayName) => {
    const body = {
      email: (email ?? "").trim(),
      password: (password ?? "").trim(),
    };
    const dn = (displayName ?? "").trim();
    if (dn) body.displayName = dn;
    return request("/auth/register", { method: "POST", body });
  },
  logout: () => request("/auth/logout", { method: "POST" }),

  // Journal
  listJournal: () => request("/journal"),
  createJournal: (payload) =>
    request("/journal", { method: "POST", body: payload }),
  updateJournal: (id, payload) =>
    request(`/journal/${id}`, { method: "PATCH", body: payload }),

  // Moon
  moonToday: (paramsOrLat, maybeLon) => {
    if (typeof paramsOrLat === "object" && paramsOrLat !== null) {
      return request(`/moon/today?${qs(paramsOrLat)}`);
    }
    return request(`/moon/today?${qs({ lat: paramsOrLat, lon: maybeLon })}`);
  },
  moonTodayByPlace: (place) =>
    request(`/moon/today?${qs({ location: place })}`),
  moonTodayByCoords: (lat, lon) => request(`/moon/today?${qs({ lat, lon })}`),
  moonTodayByIp: () => request(`/moon/today?${qs({ useClientIp: "1" })}`),

  // NEW: historical/on-date lookup
  moonOn: (dateYmd, where) => {
    const params = { date: dateYmd, ...(where || {}) };
    return request(`/moon/on?${qs(params)}`);
  },

  // Tarot
  tarotDaily: () => request("/tarot/daily"),
  tarotYesNo: (question) =>
    request("/tarot/yesno", { method: "POST", body: { question } }),
  tarotCard: (id) => request(`/tarot/cards/${id}`),
  tarotList: () => request("/tarot/cards"),
};

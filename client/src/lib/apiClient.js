const BASE = (import.meta.env.VITE_API_BASE || "http://localhost:3001").replace(
  /\/+$/,
  ""
);

async function request(path, { method = "GET", body, headers = {} } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: "include", // send httpOnly cookie
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

/** Build safe query strings (skip undefined/empty values) */
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

  // Auth helpers
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

  // Domain helpers
  listJournal: () => request("/journal"),
  createJournal: (payload) =>
    request("/journal", { method: "POST", body: payload }),

  /**
   * Get today's moon data.
   * Usage options:
   *   - api.moonToday({ location: "Boise, ID" })
   *   - api.moonToday({ lat: 43.62, lon: -116.20 })
   *   - api.moonToday({ useClientIp: "1" })
   * Back-compat:
   *   - api.moonToday(43.62, -116.20)
   */
  moonToday: (paramsOrLat, maybeLon) => {
    if (typeof paramsOrLat === "object" && paramsOrLat !== null) {
      return request(`/moon/today?${qs(paramsOrLat)}`);
    }
    // Backward-compatible (lat, lon) signature:
    return request(`/moon/today?${qs({ lat: paramsOrLat, lon: maybeLon })}`);
  },

  // Nice convenience wrappers (optional, but handy)
  moonTodayByPlace: (place) =>
    request(`/moon/today?${qs({ location: place })}`),
  moonTodayByCoords: (lat, lon) =>
    request(`/moon/today?${qs({ lat, lon })}`),
  moonTodayByIp: () => request(`/moon/today?${qs({ useClientIp: "1" })}`),

  tarotDaily: () => request("/tarot/daily"),
  tarotYesNo: (question) =>
    request("/tarot/yesno", { method: "POST", body: { question } }),
  tarotCard: (id) => request(`/tarot/cards/${id}`),
};

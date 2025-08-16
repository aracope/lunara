const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: 'include', // send httpOnly cookie
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json().catch(() => ({})) : await res.text();

  if (!res.ok) {
    const msg = isJson ? data?.error || JSON.stringify(data) : data;
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return data;
}

export const api = {
  get: (p) => request(p),
  post: (p, b) => request(p, { method: 'POST', body: b }),
  patch: (p, b) => request(p, { method: 'PATCH', body: b }),
  del: (p) => request(p, { method: 'DELETE' }),

  // Auth helpers
  me: () => request('/auth/me'),
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  signup: (email, password, displayName) =>
    request('/auth/register', { method: 'POST', body: { email, password, displayName } }),
  logout: () => request('/auth/logout', { method: 'POST' }),

  // Domain helpers (will flesh out in later modules)
  listJournal: () => request('/journal'),
  createJournal: (payload) => request('/journal', { method: 'POST', body: payload }),
  moonToday: (lat, lon) => request(`/moon/today?lat=${lat}&lon=${lon}`),
  tarotDaily: () => request('/tarot/daily'),
  tarotYesNo: (question) => request('/tarot/yesno', { method: 'POST', body: { question } }),
  tarotCard: (id) => request(`/tarot/cards/${id}`)
};

import { TAROT_API_BASE } from '../config.js';

const DEFAULT_TIMEOUT_MS = 15000;

function withTimeout(ms, promise) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Upstream timeout')), ms))
  ]);
}

async function jsonFetch(path, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const url = new URL(path, TAROT_API_BASE).toString();
  const resp = await withTimeout(timeoutMs, fetch(url, {
    headers: { 'Accept': 'application/json', ...(options.headers || {}) },
    ...options,
  }));
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    const err = new Error(`Tarot API ${resp.status}`);
    err.status = 502;
    err.body = text;
    throw err;
  }
  return resp.json();
}

export async function getCardOfDay() {
  // Adjust endpoint to match your Flask routes (example: /api/tarot/daily)
  return jsonFetch('/api/tarot/daily');
}

export async function drawYesNo() {
  // If your Flask expects POST, send POST; if GET, switch accordingly.
  return jsonFetch('/api/tarot/yesno', { method: 'POST' });
}

export async function getCardById(id) {
  if (!Number.isInteger(Number(id))) {
    const e = new Error('Invalid id');
    e.status = 400;
    throw e;
  }
  return jsonFetch(`/api/tarot/cards/${id}`);
}

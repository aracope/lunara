const store = new Map();

export function cacheGet(key) {
  const hit = store.get(key);
  if (!hit) return null;
  const { exp, val } = hit;
  if (Date.now() > exp) {
    store.delete(key);
    return null;
  }
  return val;
}

export function cacheSet(key, val, ttlMs) {
  store.set(key, { val, exp: Date.now() + ttlMs });
}

export function cacheWrap(key, ttlMs, fn) {
  const v = cacheGet(key);
  if (v !== null) return Promise.resolve(v);
  return Promise.resolve(fn()).then((data) => {
    cacheSet(key, data, ttlMs);
    return data;
  });
}

export function cacheClear() {
  store.clear();
}

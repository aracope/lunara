import React, { useState } from 'react';
import { api } from '../lib/apiClient.js';

export default function Moon() {
  const [lat, setLat] = useState('43.62');
  const [lon, setLon] = useState('-116.20');
  const [data, setData] = useState(null);
  async function fetchMoon(e) {
    e.preventDefault();
    try { const d = await api.moonToday(lat, lon); setData(d); } catch (err) { setData({ error: err.message }); }
  }
  return (
    <section>
      <h1>Moon</h1>
      <form onSubmit={fetchMoon} style={{ display: 'flex', gap: 8 }}>
        <input value={lat} onChange={e => setLat(e.target.value)} placeholder="lat" />
        <input value={lon} onChange={e => setLon(e.target.value)} placeholder="lon" />
        <button>Fetch</button>
      </form>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </section>
  );
}

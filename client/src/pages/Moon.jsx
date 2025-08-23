import React, { useState } from 'react';
import { api } from '../lib/apiClient.js';
import './Moon.css';

export default function Moon() {
  const [mode, setMode] = useState("place"); // 'place' | 'coords'
  const [place, setPlace] = useState("Boise, ID");
  const [lat, setLat] = useState('43.62');
  const [lon, setLon] = useState('-116.20');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  async function fetchMoon(e) {
    e.preventDefault();
    setLoading(true);
    try {
      let d;
      if (mode === "place" && place.trim()) {
        d = await api.moonToday({ location: place.trim() });
      } else if (mode === "coords") {
        d = await api.moonToday({ lat, lon });
      } else {
        // server will pass req.ip to API
        d = await api.moonToday({ useClientIp: "1" });
      }
      setData(d);
    } catch (err) {
      setData({ error: err.message });
    } finally {
      setLoading(false);
    }
  }

  function useDeviceLocation() {
    if (!("geolocation" in navigator)) {
      setData({ error: "Geolocation not supported by this browser." });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMode("coords");
        setLat(pos.coords.latitude.toFixed(4));
        setLon(pos.coords.longitude.toFixed(4));
      },
      (err) => setData({ error: err.message }),
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }
  return (
    <section>
      <h1>Moon</h1>
      <div className="moon-switch">
        <label>
          <input
            type="radio"
            name="mode"
            value="place"
            checked={mode === "place"}
            onChange={() => setMode("place")} /> City / place</label>
        <label>
          <input
            type="radio"
            name="mode"
            value="coords"
            checked={mode === "coords"}
            onChange={() => setMode("coords")} /> Coordinates</label>
        <label>
          <input
            type="radio"
            name="mode"
            value="ip"
            checked={mode === "ip"}
            onChange={() => setMode("ip")} /> Use my IP</label>
      </div>

      <form onSubmit={fetchMoon} className="moon-form">
        {mode === "place" && (
          <input
            value={place}
            onChange={e => setPlace(e.target.value)}
            placeholder="e.g., Boise, ID or Paris, FR" />
        )}
        {mode === "coords" && (
          <>
            <input
              value={lat}
              onChange={e => setLat(e.target.value)}
              placeholder="latitude" />
            <input
              value={lon}
              onChange={e => setLon(e.target.value)}
              placeholder="longitude" />
            <button
              type="button"
              onClick={useDeviceLocation}>Use my device</button>
          </>
        )}
        <button disabled={loading}>{loading ? "Loading…" : "Fetch"}</button>
      </form>

      <pre>{JSON.stringify(data, null, 2)}</pre>
    </section>
  );
}
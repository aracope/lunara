import React, { useState } from 'react';
import { api } from '../lib/apiClient.js';
import './Moon.css';
import MoonResult from '../components/MoonResult.jsx';

/**
 * Moon page
 *
 * Purpose:
 *  - Allows users to fetch today's moon phase by city/place, coordinates, or IP.
 *  - Provides optional "Use my device" to autofill geolocation into coords mode.
 *
 * State:
 *  - mode: current lookup mode ("place" | "coords" | "ip")
 *  - place: user-entered location string
 *  - lat/lon: coordinate inputs
 *  - data: moon API response (or error)
 *  - loading: whether a fetch is in progress
 *
 * Data flow:
 *  - On form submit:
 *      • mode=place → api.moonToday({ location })
 *      • mode=coords → api.moonToday({ lat, lon })
 *      • mode=ip → api.moonToday({ useClientIp: "1" })
 *  - Sets `data` with either result or { error }.
 *
 * Rendering:
 *  - Radio buttons toggle mode.
 *  - Inputs change depending on mode.
 *  - Shows loading state on button while fetching.
 *  - If `data.error`, shows status box.
 *  - Otherwise renders <MoonResult data={...} />.
 *
 * Geolocation:
 *  - useDeviceLocation() uses navigator.geolocation if available.
 *  - On success → updates mode to "coords" and populates lat/lon.
 *  - On error → sets { error } in `data`.
 *
 * Usage:
 *  - Public route at "/moon".
 */

export default function Moon() {
  const [mode, setMode] = useState('place'); // 'place' | 'coords' | 'ip'
  const [place, setPlace] = useState('Boise, ID');
  const [lat, setLat] = useState('43.62');
  const [lon, setLon] = useState('-116.20');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  async function fetchMoon(e) {
    e.preventDefault();
    setLoading(true);
    try {
      let d;
      if (mode === 'place' && place.trim()) {
        d = await api.moonToday({ location: place.trim() });
      } else if (mode === 'coords') {
        d = await api.moonToday({ lat, lon });
      } else {
        d = await api.moonToday({ useClientIp: '1' });
      }
      setData(d);
    } catch (err) {
      setData({ error: err.message });
    } finally {
      setLoading(false);
    }
  }

  function useDeviceLocation() {
    if (!('geolocation' in navigator)) {
      setData({ error: 'Geolocation not supported by this browser.' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMode('coords');
        setLat(pos.coords.latitude.toFixed(4));
        setLon(pos.coords.longitude.toFixed(4));
      },
      (err) => setData({ error: err.message }),
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }

  const hasError = data && data.error;

  return (
    <section>
      <h1 className="metal-text">Moon</h1>

      {/* mode switch */}
      <fieldset className="moon-switch switch">
        <legend className="sr-only">Choose input mode</legend>

        <label className="chip">
          <input
            type="radio"
            name="mode"
            value="place"
            checked={mode === 'place'}
            onChange={() => setMode('place')}
          />
          <span>City / place</span>
        </label>

        <label className="chip">
          <input
            type="radio"
            name="mode"
            value="coords"
            checked={mode === 'coords'}
            onChange={() => setMode('coords')}
          />
          <span>Coordinates</span>
        </label>

        <label className="chip">
          <input
            type="radio"
            name="mode"
            value="ip"
            checked={mode === 'ip'}
            onChange={() => setMode('ip')}
          />
          <span>Use my IP</span>
        </label>
      </fieldset>

      {/* inputs */}
      <form onSubmit={fetchMoon} className="moon-form" aria-busy={loading}>
        {mode === 'place' && (
          <input
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder="e.g., Boise, ID or Paris, FR"
            autoComplete="address-level2"
          />
        )}

        {mode === 'coords' && (
          <>
            <input
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="latitude"
              inputMode="decimal"
              autoComplete="off"
            />
            <input
              value={lon}
              onChange={(e) => setLon(e.target.value)}
              placeholder="longitude"
              inputMode="decimal"
              autoComplete="off"
            />
            <button type="button" className="btn btn--metal-dark" onClick={useDeviceLocation}>
              Use my device
            </button>
          </>
        )}

        <button type="submit" className="btn btn--metal" disabled={loading}>
          {loading ? 'Loading…' : 'Fetch'}
        </button>
      </form>

      {/* results */}
      {hasError && (
        <div className="moon-result surface surface--metal-dark" role="status" aria-live="polite">
          <div className="form-status">{data.error}</div>
        </div>
      )}

      {data && !hasError && <MoonResult data={data} />}
    </section>
  );
}

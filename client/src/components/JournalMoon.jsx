import React, { useEffect, useState } from 'react';
import { api } from '../lib/apiClient.js';
import { fmtDate, fmtTimeWithDay, tzOrDefault, titleize } from '../lib/format.js';

/**
 * JournalMoon
 *
 * Purpose:
 *  - Fetches and displays moon data (phase, rise/set) for a given journal entry date.
 *  - Chooses lookup by coordinates (lat/lon) when available, else by human-readable location label.
 *
 * Props:
 *  - snapshot: {
 *      date_ymd: string (YYYY-MM-DD),
 *      lat?: number | null,
 *      lon?: number | null,
 *      location_label?: string,   // e.g., "Boise, ID, USA"
 *      tz?: string | null         // preferred timezone override
 *    }
 *
 * Behavior:
 *  - On mount or when `snapshot` changes, calls `api.moonOn(date, {lat,lon}|{location})`.
 *  - Renders nothing until data arrives (returns `null` as a loading state).
 *  - Uses `tzOrDefault(snapshot.tz || data.timezone)` for consistent formatting.
 *  - Semantic markup: header/title + <dl> with <time> elements.
 *
 */

export default function JournalMoon({ snapshot }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    const run = async () => {
      const d = await api.moonOn(
        snapshot.date_ymd,
        snapshot.lat != null ? { lat: snapshot.lat, lon: snapshot.lon } : { location: snapshot.location_label }
      );
      setData(d);
    };
    run();
  }, [snapshot]);

  if (!data) return null;
  const tz = tzOrDefault(snapshot.tz || data.timezone);

  return (
    <div className="journal-moon surface surface--metal-dark">
      <div className="journal-moon__header">
        <span aria-hidden="true" className="moon-result__badge" />
        <strong className="journal-moon__phase metal-text">{titleize(data.phase)}</strong>
        <span className="journal-moon__date">{fmtDate(`${snapshot.date_ymd}T00:00:00Z`, tz)}</span>
      </div>
      <dl className="journal-moon__kv">
        <div><dt>Moonrise</dt><dd><time dateTime={data.moonrise}>{fmtTimeWithDay(data.moonrise, `${snapshot.date_ymd}T00:00:00Z`, tz)}</time></dd></div>
        <div><dt>Moonset</dt><dd><time dateTime={data.moonset}>{fmtTimeWithDay(data.moonset, `${snapshot.date_ymd}T00:00:00Z`, tz)}</time></dd></div>
      </dl>
    </div>
  );
}
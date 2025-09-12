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
 *  - refData: {
 *      date_ymd: string (YYYY-MM-DD),
 *      lat?: number | null,
 *      lon?: number | null,
 *      location_label?: string,   // e.g., "Boise, ID, USA"
 *      tz?: string | null         // preferred timezone override
 *    }
 *
 * Behavior:
 *  - On mount or when `refData` changes, calls `api.moonOn(date, {lat,lon}|{location})`.
 *  - Renders nothing until data arrives (returns `null` as a loading state).
 *  - Uses `tzOrDefault(refData.tz || data.timezone)` for consistent formatting.
 *  - Semantic markup: header/title + <dl> with <time> elements.
 *
 */

export default function JournalMoon({ refData }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    const run = async () => {
      const d = await api.moonOn(
        refData.date_ymd,
        refData.lat != null ? { lat: refData.lat, lon: refData.lon } : { location: refData.location_label }
      );
      setData(d);
    };
    run();
  }, [refData]);

  if (!data) return null;
  const tz = tzOrDefault(refData.tz || data.timezone);

  return (
    <div className="journal-moon surface surface--metal-dark">
      <div className="journal-moon__header">
        <span aria-hidden="true" className="moon-result__badge" />
        <strong className="journal-moon__phase metal-text">{titleize(data.phase)}</strong>
        <span className="journal-moon__date">{fmtDate(`${refData.date_ymd}T00:00:00Z`, tz)}</span>
      </div>
      <dl className="journal-moon__kv">
        <div><dt>Moonrise</dt><dd><time dateTime={data.moonrise}>{fmtTimeWithDay(data.moonrise, `${refData.date_ymd}T00:00:00Z`, tz)}</time></dd></div>
        <div><dt>Moonset</dt><dd><time dateTime={data.moonset}>{fmtTimeWithDay(data.moonset, `${refData.date_ymd}T00:00:00Z`, tz)}</time></dd></div>
      </dl>
    </div>
  );
}
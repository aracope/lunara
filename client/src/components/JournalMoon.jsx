import React, { useEffect, useState } from 'react';
import { api } from '../lib/apiClient.js';
import { fmtDate, fmtTimeWithDay, tzOrDefault, titleize } from '../lib/format.js';

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
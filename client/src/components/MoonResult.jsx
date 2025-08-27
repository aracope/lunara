import { fmtDate, fmtTimeWithDay, titleize, tzOrDefault } from '../lib/format.js';
import { formatLocation } from '../lib/location.js';

export default function MoonResult({ data }) {
    const tz = tzOrDefault(data?.timezone);
    return (
        <div className="moon-result surface surface--metal-dark">
            <header className="moon-result__header">
                <span aria-hidden="true" className="moon-result__badge" />
                <div>
                    <div className="moon-result__date">{fmtDate(data.date, tz)}</div>
                    <h2 className="moon-result__phase metal-text">{titleize(data.phase)}</h2>
                </div>
            </header>
            <dl className="moon-kv">
                <div><dt>Moonrise</dt>
                    <dd>
                        <time dateTime={data.moonrise || ''}>{fmtTimeWithDay(data.moonrise, data.date, tz)}</time>
                    </dd>
                </div>
                <div><dt>Moonset</dt>
                    <dd>
                        <time dateTime={data.moonset || ''}>{fmtTimeWithDay(data.moonset, data.date, tz)}</time>
                    </dd>
                </div>
                <div><dt>Zodiac</dt>
                    <dd>{titleize(data.zodiacSign)}</dd>
                </div>
                <div><dt>Location</dt>
                    <dd>{formatLocation(data.location)}</dd>
                </div>
            </dl>
        </div>
    );
}

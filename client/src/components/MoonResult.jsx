import { fmtDate, fmtTimeWithDay, titleize, tzOrDefault } from '../lib/format.js';
import { formatLocation } from '../lib/location.js';

/**
 * MoonResult component
 *
 * Purpose:
 *  - Displays the results of a moon phase lookup.
 *  - Renders the date, moon phase, moonrise/set times, zodiac sign, and location.
 *
 * Props:
 *  - data: {
 *      date: string (ISO),
 *      phase: string,
 *      moonrise: string | null,
 *      moonset: string | null,
 *      zodiacSign: string,
 *      location: { city?, state?, country?, ... },
 *      timezone: string (optional)
 *    }
 *
 * Behavior:
 *  - Uses utilities from ../lib/format.js and ../lib/location.js to ensure
 *    consistent formatting (e.g. `fmtDate`, `fmtTimeWithDay`, `titleize`, `formatLocation`).
 *  - Falls back to `tzOrDefault` if timezone is missing.
 *  - Uses semantic HTML (`<time>`, `<dl>`) for accessibility.
 *
 * Styling:
 *  - `moon-result`, `surface--metal-dark`, `moon-kv`, etc. classes apply styles
 *    defined in CSS theme.
 *
 * Usage:
 *  Typically rendered inside the Moon page once API data is fetched:
 *
 *  <MoonResult data={moonData} />
 */


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

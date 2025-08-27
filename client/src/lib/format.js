export function tzOrDefault(tz) {
  return tz || Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function fmtDate(dateStr, timeZone) {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: tzOrDefault(timeZone),
  }).format(new Date(dateStr));
}

export function fmtTime(dateStr, timeZone, withTZ = true) {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric', minute: '2-digit', timeZone: tzOrDefault(timeZone),
    ...(withTZ ? { timeZoneName: 'short' } : {}),
  }).format(new Date(dateStr));
}

export function fmtYMD(dateStr, timeZone) {
  if (!dateStr) return '';
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    timeZone: tzOrDefault(timeZone),
  }).format(new Date(dateStr)); // e.g., "2025-08-27"
}

export function fmtDowMonDay(dateStr, timeZone) {
  if (!dateStr) return '';
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
    timeZone: tzOrDefault(timeZone),
  }).format(new Date(dateStr)); // "Thu, Aug 28"
}

export function fmtTimeWithDay(dateStr, baseDateStr, timeZone) {
  if (!dateStr) return '—';
  const tz = tzOrDefault(timeZone);
  const time = fmtTime(dateStr, tz);
  const baseYMD = fmtYMD(baseDateStr, tz);
  const evYMD = fmtYMD(dateStr, tz);
  if (!baseYMD || baseYMD === evYMD) return time;
  const dayLabel = fmtDowMonDay(dateStr, tz);
  const rel = evYMD > baseYMD ? ' (next day)' : ' (prev day)';
  return `${time} • ${dayLabel}${rel}`;
}

export function titleize(s) {
  if (!s) return '—';
  return s.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, m => m.toUpperCase());
}

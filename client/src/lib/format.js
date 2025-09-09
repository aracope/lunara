/**
 * format.js
 *
 * Purpose:
 *  - Utility functions for date/time/string formatting with timezone support.
 *  - Wrap Intl.DateTimeFormat with consistent defaults for the app.
 *
 * Functions:
 *  - tzOrDefault(tz):
 *      Returns the provided timeZone string, or the system’s current default if falsy.
 *
 *  - fmtDate(dateStr, timeZone):
 *      Formats an ISO-like date string into a long date with weekday.
 *      Example: "2025-08-27" → "Wednesday, August 27, 2025"
 *      Returns "—" if no dateStr.
 *
 *  - fmtTime(dateStr, timeZone, withTZ = true):
 *      Formats into "h:mm AM/PM" with optional timeZone abbreviation.
 *      Example: "2025-08-27T13:45Z" → "9:45 AM EDT"
 *      Returns "—" if no dateStr.
 *
 *  - fmtYMD(dateStr, timeZone):
 *      Formats into YYYY-MM-DD (ISO-style, using `en-CA` locale).
 *      Example: "2025-08-27" → "2025-08-27"
 *      Returns "" if no dateStr.
 *
 *  - fmtDowMonDay(dateStr, timeZone):
 *      Short weekday + month + day.
 *      Example: "2025-08-28" → "Thu, Aug 28"
 *      Returns "" if no dateStr.
 *
 *  - fmtTimeWithDay(dateStr, baseDateStr, timeZone):
 *      Formats a time and adds context if it falls on a different day than `baseDateStr`.
 *      Example: event 01:30 next day → "1:30 AM EST • Fri, Aug 29 (next day)"
 *      Returns "—" if no dateStr.
 *
 *  - titleize(s):
 *      Lowercases a string, replaces underscores with spaces, capitalizes words.
 *      Example: "FULL_MOON" → "Full Moon"
 *      Returns "—" if falsy input.
 *
 * Notes:
 *  - All functions normalize the `timeZone` argument with tzOrDefault().
 *  - Consumers can pass explicit tz strings like "America/Boise".
 */

export function tzOrDefault(tz) {
  return tz || Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function fmtDate(dateStr, timeZone) {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: tzOrDefault(timeZone),
  }).format(new Date(dateStr));
}

export function fmtTime(dateStr, timeZone, withTZ = true) {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: tzOrDefault(timeZone),
    ...(withTZ ? { timeZoneName: "short" } : {}),
  }).format(new Date(dateStr));
}

export function fmtYMD(dateStr, timeZone) {
  if (!dateStr) return "";
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: tzOrDefault(timeZone),
  }).format(new Date(dateStr)); // e.g., "2025-08-27"
}

export function fmtDowMonDay(dateStr, timeZone) {
  if (!dateStr) return "";
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: tzOrDefault(timeZone),
  }).format(new Date(dateStr)); // "Thu, Aug 28"
}

export function fmtTimeWithDay(dateStr, baseDateStr, timeZone) {
  if (!dateStr) return "—";
  const tz = tzOrDefault(timeZone);
  const time = fmtTime(dateStr, tz);
  const baseYMD = fmtYMD(baseDateStr, tz);
  const evYMD = fmtYMD(dateStr, tz);
  if (!baseYMD || baseYMD === evYMD) return time;
  const dayLabel = fmtDowMonDay(dateStr, tz);
  const rel = evYMD > baseYMD ? " (next day)" : " (prev day)";
  return `${time} • ${dayLabel}${rel}`;
}

export function titleize(s) {
  if (!s) return "—";
  return s
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

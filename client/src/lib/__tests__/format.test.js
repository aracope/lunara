import { describe, test, expect } from "vitest";
import {
  tzOrDefault,
  fmtDate,
  fmtTime,
  fmtYMD,
  fmtDowMonDay,
  fmtTimeWithDay,
  titleize,
} from "../format.js";

describe("format.js utilities", () => {
  test("tzOrDefault falls back to system tz", () => {
    const tz = tzOrDefault();
    expect(typeof tz).toBe("string");
    expect(tz.length).toBeGreaterThan(0);
  });

  test("fmtDate returns — for falsy input", () => {
    expect(fmtDate(null)).toBe("—");
  });

  test("fmtDate formats ISO date", () => {
    const out = fmtDate("2025-08-27T00:00:00Z", "UTC");
    expect(out).toMatch(/2025/);
    expect(out).toMatch(/August/);
  });

  test("fmtTime with and without TZ", () => {
    const iso = "2025-08-27T13:45:00Z";
    const withTz = fmtTime(iso, "UTC", true);
    const noTz = fmtTime(iso, "UTC", false);
    expect(withTz).toMatch(/UTC|GMT/);
    expect(noTz).not.toMatch(/UTC|GMT/);
  });

  test("fmtYMD returns YYYY-MM-DD", () => {
    const out = fmtYMD("2025-08-27T10:00:00Z", "UTC");
    expect(out).toBe("2025-08-27");
  });

  test("fmtDowMonDay returns short weekday/month", () => {
    const out = fmtDowMonDay("2025-08-28T10:00:00Z", "UTC");
    expect(out).toMatch(/Thu|Fri|Sat/);
    expect(out).toMatch(/Aug/);
  });

  test("fmtTimeWithDay same-day returns time only", () => {
    const base = "2025-08-28T00:00:00Z";
    const ev = "2025-08-28T06:00:00Z";
    const out = fmtTimeWithDay(ev, base, "UTC");
    expect(out).toMatch(/6:00/);
    expect(out).not.toMatch(/next day|prev day/);
  });

  test("fmtTimeWithDay next day adds context", () => {
    const base = "2025-08-28T00:00:00Z";
    const ev = "2025-08-29T01:00:00Z";
    const out = fmtTimeWithDay(ev, base, "UTC");
    expect(out).toMatch(/next day/);
  });

  test("fmtTimeWithDay prev day adds context", () => {
    const base = "2025-08-28T00:00:00Z";
    const ev = "2025-08-27T23:00:00Z";
    const out = fmtTimeWithDay(ev, base, "UTC");
    expect(out).toMatch(/prev day/);
  });

  test("titleize handles null and strings with underscores", () => {
    expect(titleize(null)).toBe("—");
    expect(titleize("FULL_MOON")).toBe("Full Moon");
    expect(titleize("waning_gibbous")).toBe("Waning Gibbous");
  });
});

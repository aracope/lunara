import { describe, test, expect } from "vitest";
import { formatLocation } from "../location.js";

describe("formatLocation", () => {
  test("returns em dash for falsy input", () => {
    expect(formatLocation(null)).toBe("—");
    expect(formatLocation(undefined)).toBe("—");
  });

  test("formats city/state/country when available", () => {
    expect(formatLocation({ city: "Boise", state: "ID", country: "USA" })).toBe(
      "Boise, ID, USA"
    );
  });

  test("skips missing parts", () => {
    expect(formatLocation({ city: "Boise", country: "USA" })).toBe(
      "Boise, USA"
    );
  });

  test("falls back to lat/lon if no text parts", () => {
    expect(formatLocation({ lat: 43.6123, lon: -116.2146 })).toBe(
      "43.61, -116.21"
    );
  });

  test("returns em dash if neither parts nor coords present", () => {
    expect(formatLocation({})).toBe("—");
  });

  test("ignores non-number lat/lon", () => {
    expect(formatLocation({ lat: "43.6", lon: "-116.2" })).toBe("—");
  });
});

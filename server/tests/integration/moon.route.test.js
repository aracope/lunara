/**
 * Integration tests for Moon routes.
 *
 * These tests stub the upstream Moon API with nock to avoid real HTTP requests.
 * They verify that our Express routes handle both success and error cases,
 * including validation and upstream failures.
 */

import request from "supertest";
import nock from "nock";
import app from "../../src/app.js";
import { MOON_API_URL } from "../../src/config.js";

// Parse configured API URL into host + path for nock.
const { origin, pathname } = new URL(MOON_API_URL || "http://moon.test.local");
const path = pathname || "/";

beforeAll(() => {
  // Block real outbound HTTP during tests; only allow localhost (supertest).
  nock.disableNetConnect();
  nock.enableNetConnect(/(127\.0\.0\.1|localhost)/);
});

afterEach(() => {
  // Ensure each test's HTTP expectations are isolated/clean.
  nock.cleanAll();
});

afterAll(() => {
  // Restore normal network behavior after the test suite.
  nock.enableNetConnect();
});

describe("Moon routes", () => {
  test("GET /moon/today with lat/lon returns 200", async () => {
    // Stub upstream Moon API for today's query.
    nock(origin)
      .get(path)
      .query(true) // accept any query string (apiKey, date, lat, etc.)
      .reply(200, {
        date: "2025-08-23",
        phase: "Full Moon",
        moonrise: "17:23",
        moonset: "02:41",
        location: { lat: 43.615, lon: -116.202, city: "Boise" },
      });

    const res = await request(app)
      .get("/moon/today?lat=43.615&lon=-116.202")
      .expect(200);

    // Shape sanity check; we don't over-specify the payload to keep tests resilient.
    expect(typeof res.body).toBe("object");

    // Timezone is best-effort (tz-lookup). If coords present, we expect a tz string.
    if (res.body.location?.lat && res.body.location?.lon) {
      expect(res.body.timezone).toBeTruthy();
    }
  });

  test("GET /moon/today invalid lat -> 400", async () => {
    const res = await request(app).get("/moon/today?lat=999&lon=0");
    expect(res.status).toBe(400);
  });

  test("GET /moon/on?date=YYYY-MM-DD&location=Boise returns 200", async () => {
    // Stub upstream Moon API for specific date + location query.
    nock(origin)
      .get(path)
      .query(true)
      .reply(200, {
        date: "2025-08-23",
        phase: "Waning",
        location: { lat: 43.615, lon: -116.202 },
      });

    const res = await request(app)
      .get("/moon/on?date=2025-08-23&location=Boise")
      .expect(200);

    expect(res.body).toBeTruthy();
    // Optional: assert stable fields you rely on in UI
    // expect(res.body.date).toBe("2025-08-23");
  });

  test("GET /moon/on invalid date -> 400", async () => {
    const res = await request(app).get("/moon/on?date=bad&location=Boise");
    expect(res.status).toBe(400);
  });

  test("Upstream failure maps to 5xx", async () => {
    // Simulate upstream 503; route should surface a 5xx to the client.
    nock(origin).get(path).query(true).reply(503, { error: "down" });

    const res = await request(app).get("/moon/today?lat=43&lon=-116");
    expect(res.status).toBeGreaterThanOrEqual(500);
  });
});

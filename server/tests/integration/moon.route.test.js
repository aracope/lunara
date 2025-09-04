import request from "supertest";
import nock from "nock";
import app from "../../src/app.js";
import { MOON_API_URL } from "../../src/config.js";

// Use env override if present, else the exported URL
const base = process.env.MOON_API_BASE || MOON_API_URL;

beforeAll(() => {
  nock.disableNetConnect();
  nock.enableNetConnect(/(127\.0\.0\.1|localhost)/);
});

afterEach(() => nock.cleanAll());
afterAll(() => {
  nock.enableNetConnect();
});

describe("Moon routes", () => {
  test("GET /moon/today with lat/lon returns 200", async () => {
    nock(base)
      .get(/.*/)
      .reply(200, {
        date: "2025-08-23",
        phase: "Full Moon",
        location: { lat: 43.615, lon: -116.202, city: "Boise" },
      });

    const res = await request(app)
      .get("/moon/today?lat=43.615&lon=-116.202")
      .expect(200);
    expect(typeof res.body).toBe("object");
    if (res.body.location?.lat && res.body.location?.lon) {
      expect(res.body.timezone).toBeTruthy();
    }
  });

  test("GET /moon/today invalid lat -> 400", async () => {
    const res = await request(app).get("/moon/today?lat=999&lon=0");
    expect(res.status).toBe(400);
  });

  test("GET /moon/on?date=YYYY-MM-DD&location=Boise returns 200", async () => {
    nock(base)
      .get(/.*/)
      .reply(200, {
        date: "2025-08-23",
        phase: "Waning",
        location: { lat: 43.615, lon: -116.202 },
      });

    const res = await request(app)
      .get("/moon/on?date=2025-08-23&location=Boise")
      .expect(200);

    expect(res.body).toBeTruthy();
  });

  test("GET /moon/on invalid date -> 400", async () => {
    const res = await request(app).get("/moon/on?date=bad&location=Boise");
    expect(res.status).toBe(400);
  });

  test("Upstream failure maps to 5xx", async () => {
    nock(base).get(/.*/).reply(503, { error: "down" });
    const res = await request(app).get("/moon/today?lat=43&lon=-116");
    expect(res.status).toBeGreaterThanOrEqual(500);
  });
});

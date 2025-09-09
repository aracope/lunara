import request from "supertest";
import nock from "nock";
import app from "../../src/app.js";
import { jest } from "@jest/globals";
import { TAROT_API_BASE } from "../../src/config.js";
import { cacheClear } from "../../src/utils/cache.js";

// Use env override if present (e.g., CI), else the app's configured base.
const base = process.env.TAROT_API_BASE || TAROT_API_BASE;

// Silence console.error noise from expected 5xx paths
let errorSpy;

beforeAll(() => {
  nock.disableNetConnect();
  nock.enableNetConnect(/(127\.0\.0\.1|localhost)/);
  errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});

beforeEach(() => {
  cacheClear();
  nock.cleanAll();
});

afterAll(() => {
  nock.enableNetConnect();
  errorSpy?.mockRestore();
});

describe("Tarot routes", () => {
  test("GET /tarot/daily returns a card", async () => {
    nock(base)
      .get(/\/daily/)
      .reply(200, { card: { id: 17, name: "The Tower" } });

    const res = await request(app).get("/tarot/daily?seed=ok").expect(200);
    expect(res.body.card).toBeDefined();
  });

  test("GET /tarot/daily upstream error -> 5xx", async () => {
    nock(base)
      .get(/\/daily(?:\?.*)?$/)
      .reply(500, { error: "boom" });

    const res = await request(app).get("/tarot/daily?seed=err");
    expect(res.status).toBeGreaterThanOrEqual(500);
  });

  test("GET /tarot/yesno returns an answer", async () => {
    nock(base)
      .get(/\/yesno/)
      .reply(200, { answer: "yes" }); // case doesn’t matter; route normalizes

    const res = await request(app).get("/tarot/yesno").expect(200);
    expect(["Yes", "No", "Maybe"]).toContain(res.body.answer);
  });

  test("POST /tarot/yesno with question returns an answer", async () => {
    nock(base)
      .post(/\/yesno/)
      .reply(200, { answer: "no" });

    const res = await request(app)
      .post("/tarot/yesno")
      .send({ question: "Will it rain?" })
      .expect(200);

    expect(["Yes", "No", "Maybe"]).toContain(res.body.answer);
  });

  test("GET /tarot/cards returns array (may be empty)", async () => {
    nock(base)
      .get((uri) => uri.startsWith("/cards")) // covers /cards and query params
      .reply(200, { cards: [], total: 0, limit: 100, offset: 0 });

    const res = await request(app).get("/tarot/cards").expect(200);
    expect(Array.isArray(res.body.cards)).toBe(true);
  });

  test("GET /tarot/cards/:id invalid -> 400", async () => {
    const res = await request(app).get("/tarot/cards/not-a-number");
    expect(res.status).toBe(400);
  });

  test("GET /tarot/cards/:id not found -> 404", async () => {
    nock(base)
      .get(/\/cards\/999999$/)
      .reply(404, { error: "Not found" });

    const res = await request(app).get("/tarot/cards/999999").expect(404);
    expect(res.body.error).toMatch(/not/i);
  });

  test("GET /tarot/daily forwards seed and date to upstream", async () => {
    const scope = nock(base)
      .get(
        (uri) =>
          uri.startsWith("/daily") &&
          uri.includes("seed=user123") &&
          uri.includes("date=2025-08-23")
      )
      .reply(200, { card: { id: 1, name: "Ace" }, date: "2025-08-23" });

    const res = await request(app)
      .get("/tarot/daily?seed=user123&date=2025-08-23")
      .expect(200);

    expect(res.body.card).toBeDefined();
    expect(scope.isDone()).toBe(true); // ensured query params were passed upstream
  });
});

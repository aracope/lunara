import request from "supertest";
import nock from "nock";
import app from "../../src/app.js";
import { jest } from "@jest/globals";
import { TAROT_API_BASE } from "../../src/config.js";

// Silence console.error noise from expected 5xx paths
let errorSpy;
beforeAll(() => {
  nock.disableNetConnect();
  nock.enableNetConnect(/(127\.0\.0\.1|localhost)/);
  errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => nock.cleanAll());
afterAll(() => {
  nock.enableNetConnect();
  errorSpy?.mockRestore();
});

describe("Tarot routes", () => {
  test("GET /tarot/daily returns a card", async () => {
    nock(TAROT_API_BASE)
      .get(/\/daily/)
      .reply(200, { card: { id: 17, name: "The Tower" } });
    const res = await request(app).get("/tarot/daily").expect(200);
    expect(res.body.card).toBeDefined();
  });

  test("GET /tarot/daily upstream error -> 5xx", async () => {
    nock(TAROT_API_BASE)
      .get(/\/daily/)
      .reply(500, { error: "boom" });
    const res = await request(app).get("/tarot/daily");
    expect(res.status).toBeGreaterThanOrEqual(500);
  });

  test("GET /tarot/yesno returns an answer", async () => {
    nock(TAROT_API_BASE)
      .get(/\/yesno/)
      .reply(200, { answer: "Yes" });
    const res = await request(app).get("/tarot/yesno").expect(200);
    expect(res.body).toBeTruthy();
  });

  test("POST /tarot/yesno with question returns an answer", async () => {
    nock(TAROT_API_BASE)
      .post(/\/yesno/)
      .reply(200, { answer: "No" });
    const res = await request(app)
      .post("/tarot/yesno")
      .send({ question: "Will it rain?" })
      .expect(200);
    expect(res.body).toBeTruthy();
  });

  test("GET /tarot/cards returns array (may be empty)", async () => {
    // DB-backed, no network needed.
    const res = await request(app).get("/tarot/cards").expect(200);
    expect(Array.isArray(res.body.cards)).toBe(true);
  });

  test("GET /tarot/cards/:id invalid -> 400", async () => {
    const res = await request(app).get("/tarot/cards/not-a-number");
    expect(res.status).toBe(400);
  });

  test("GET /tarot/cards/:id not found -> 404", async () => {
    // Mock the upstream 404 so Nock doesn't block the call
    nock(TAROT_API_BASE)
      .get(/\/cards\/999999$/)
      .reply(404, { error: "Not found" });
    const res = await request(app).get("/tarot/cards/999999").expect(404);
    expect(res.body.error).toMatch(/not/i);
  });
});

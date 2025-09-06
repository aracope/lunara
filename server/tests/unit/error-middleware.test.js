import request from "supertest";
import app from "../../src/app.js";

describe("error & 404 middleware", () => {
  test("unknown route -> 404 JSON error", async () => {
    const res = await request(app).get("/no-such-route").expect(404);
    expect(res.body).toEqual({ error: "Not Found" });
  });

  test("CORS blocked origin bubbles to errorHandler -> 5xx JSON", async () => {
    // app.js: second CORS layer checks allowList and calls cb(new Error(...))
    // Set an Origin that's NOT in CORS_ORIGIN to trigger the error path.
    const res = await request(app)
      .get("/health")
      .set("Origin", "http://not-allowed.example")
      .expect(500);

    // Your errorHandler returns { error: <message> }
    expect(res.body?.error || "").toMatch(/CORS blocked/i);
  });
});

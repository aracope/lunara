import request from "supertest";
import app from "../../src/app.js";

/**
 * Simple liveness/readiness check.
 * Ensures that:
 *   - the /health route responds with 200
 *   - the body matches { ok: true } (DB ping succeeded)
 *
 * Useful as a quick CI/CD smoke test and to validate DB connectivity.
 */
test("GET /health -> 200 and { ok: true }", async () => {
  const res = await request(app).get("/health").expect(200);
  expect(res.body).toEqual({ ok: true });
});

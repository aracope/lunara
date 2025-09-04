import request from "supertest";
import app from "../../src/app.js";

test("GET /health -> 200 and { ok: true }", async () => {
  const res = await request(app).get("/health").expect(200);
  expect(res.body).toEqual({ ok: true });
});

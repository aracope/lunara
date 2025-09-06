import request from "supertest";
import app from "../../src/app.js";

describe("auth middleware", () => {
  test("blocks unauthenticated", async () => {
    // requireAuth should reject missing cookie with 401
    const res = await request(app).get("/journal").expect(401);
    expect(res.body.error || res.body.message).toBeTruthy();
  });

  test("allows authenticated", async () => {
    // Use a persistent agent to retain the auth cookie set by /auth/register
    const agent = request.agent(app);
    await agent
      .post("/auth/register")
      .send({ email: "z@x.com", password: "passpass" }) // length 8
      .expect(201);

    const res = await agent.get("/journal").expect(200);
    expect(Array.isArray(res.body.entries)).toBe(true);
  });
});

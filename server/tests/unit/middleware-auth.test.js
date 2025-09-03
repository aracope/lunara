import request from "supertest";
import app from "../../src/app.js";

describe("auth middleware", () => {
  test("blocks unauthenticated", async () => {
    const res = await request(app).get("/journal").expect(401);
    expect(res.body.error || res.body.message).toBeTruthy();
  });

  test("allows authenticated", async () => {
    const agent = request.agent(app);
    await agent.post("/auth/register").send({ email: "z@x.com", password: "passpass" });
    const res = await agent.get("/journal").expect(200);
    expect(Array.isArray(res.body.entries)).toBe(true);
  });
});

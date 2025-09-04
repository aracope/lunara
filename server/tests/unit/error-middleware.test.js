import request from "supertest";
import app from "../../src/app.js";

describe("Auth validation", () => {
  test("register invalid email -> 400 with field", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "bad", password: "passpass123" });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe("email");
  });

  test("register short password -> 400", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "a@x.com", password: "short" });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe("password");
  });

  test("login missing fields -> 400", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "a@x.com" });
    expect(res.status).toBe(400);
  });
});

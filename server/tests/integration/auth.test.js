import request from "supertest";
import app from "../../src/app.js";

describe("Auth routes", () => {
  test("POST /auth/register creates a user and sets httpOnly cookie", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({
        email: "alice@example.com",
        password: "password123",
        displayName: "Alice",
      })
      .expect(201);

    expect(res.body).toMatchObject({
      user: { email: "alice@example.com", display_name: "Alice" },
    });
    const setCookie = res.headers["set-cookie"]?.join(";") ?? "";
    expect(setCookie).toMatch(/token=/);
    expect(setCookie).toMatch(/HttpOnly/i);
  });

  test("POST /auth/register returns 409 on duplicate email", async () => {
    await request(app)
      .post("/auth/register")
      .send({ email: "dup@x.com", password: "passpass123" });
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "dup@x.com", password: "passpass123" });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already registered/i);
  });

  test("POST /auth/login sets cookie with valid creds", async () => {
    await request(app)
      .post("/auth/register")
      .send({ email: "bob@example.com", password: "passpass123" });
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "bob@example.com", password: "passpass123" });
    expect(res.status).toBe(200);
    const setCookie = res.headers["set-cookie"]?.join(";") ?? "";
    expect(setCookie).toMatch(/token=/);
  });

  test("POST /auth/login returns 401 for bad creds", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "nope@x.com", password: "wrongpass" });
    expect(res.status).toBe(401);
  });

  test("GET /auth/me returns null when no cookie", async () => {
    const res = await request(app).get("/auth/me").expect(200);
    expect(res.body).toEqual({ user: null });
  });

  test("GET /auth/me returns user when authenticated", async () => {
    const agent = request.agent(app);
    await agent
      .post("/auth/register")
      .send({ email: "me@x.com", password: "passpass123" });
    const res = await agent.get("/auth/me").expect(200);
    expect(res.body.user).toMatchObject({ email: "me@x.com" });
  });

  test("POST /auth/logout clears cookie", async () => {
    const agent = request.agent(app);
    await agent
      .post("/auth/register")
      .send({ email: "out@x.com", password: "passpass123" });
    const res = await agent.post("/auth/logout").expect(200);
    expect(res.body).toEqual({ ok: true });
  });
});

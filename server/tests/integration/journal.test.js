import request from "supertest";
import app from "../../src/app.js";

describe("Journal routes (auth required)", () => {
  let agent;

  beforeEach(async () => {
    agent = request.agent(app);
    await agent
      .post("/auth/register")
      .send({ email: "j@x.com", password: "passpass123" })
      .expect(201);
  });

  test("GET /journal returns an empty list initially", async () => {
    const res = await agent.get("/journal").expect(200);
    expect(res.body).toEqual({ entries: [] });
  });

  test("POST /journal creates an entry", async () => {
    const res = await agent
      .post("/journal")
      .send({ title: "First", body: "Hello" })
      .expect(201);

    expect(res.body.entry).toMatchObject({ title: "First", body: "Hello" });
    expect(res.body.entry.id).toBeGreaterThan(0);
  });

  test("PATCH /journal/:id updates an entry", async () => {
    const {
      body: { entry },
    } = await agent
      .post("/journal")
      .send({ title: "T", body: "B" })
      .expect(201);

    const upd = await agent
      .patch(`/journal/${entry.id}`)
      .send({ title: "T2" })
      .expect(200);

    expect(upd.body.entry.title).toBe("T2");
  });

  test("DELETE /journal/:id removes an entry", async () => {
    const {
      body: { entry },
    } = await agent
      .post("/journal")
      .send({ title: "T", body: "B" })
      .expect(201);

    await agent.delete(`/journal/${entry.id}`).expect(200);

    const after = await agent.get("/journal").expect(200);
    expect(after.body.entries.length).toBe(0);
  });
});

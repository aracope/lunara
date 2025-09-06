import request from "supertest";
import app from "../../src/app.js";

// Helper: registers a user and sets the auth cookie on the provided agent.
const register = (agent, email = "user@x.com") =>
  agent.post("/auth/register").send({ email, password: "passpass123" });

describe("Journal validation & auth edges", () => {
  test("PATCH with no fields -> 400", async () => {
    // zod updateSchema requires at least one field; empty body should fail
    const agent = request.agent(app);
    await register(agent);

    const {
      body: { entry },
    } = await agent
      .post("/journal")
      .send({ title: "t", body: "b" })
      .expect(201);

    await agent.patch(`/journal/${entry.id}`).send({}).expect(400);
  });

  test("POST with invalid moon_data_id -> 400", async () => {
    // Friendly FK check should produce 400 (not 500/23503 leak)
    const agent = request.agent(app);
    await register(agent);

    await agent
      .post("/journal")
      .send({ title: "t", body: "b", moon_data_id: 99999 })
      .expect(400);
  });

  test("POST with invalid moonSnapshot (lat only) -> 400", async () => {
    // moonSnapshot requires lat & lon together when either present
    const agent = request.agent(app);
    await register(agent);

    await agent
      .post("/journal")
      .send({
        title: "t",
        body: "b",
        moonSnapshot: { date_ymd: "2025-08-23", tz: "UTC", lat: 10 },
      })
      .expect(400);
  });

  test("DELETE other user's entry -> 404", async () => {
    // Ownership enforced via WHERE user_id = $me
    const a1 = request.agent(app),
      a2 = request.agent(app);
    await register(a1, "a@x.com");
    await register(a2, "b@x.com");

    const {
      body: { entry },
    } = await a1.post("/journal").send({ title: "t", body: "b" }).expect(201);

    await a2.delete(`/journal/${entry.id}`).expect(404);
  });

  test("PATCH non-existent id -> 404", async () => {
    // Valid shape but missing row should 404
    const agent = request.agent(app);
    await register(agent);

    await agent.patch("/journal/999999").send({ title: "new" }).expect(404);
  });

  test("DELETE non-integer id -> 400", async () => {
    // Param validation: id must be a positive integer
    const agent = request.agent(app);
    await register(agent);

    await agent.delete("/journal/abc").expect(400);
  });
});

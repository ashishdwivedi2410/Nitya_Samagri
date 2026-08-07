import request from "supertest";
import app from "../../src/app";

describe("Unknown routes", () => {
  it("returns a 404 JSON error for a route that doesn't exist", async () => {
    const res = await request(app).get("/api/v1/this-route-does-not-exist");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/not found/i);
  });
});
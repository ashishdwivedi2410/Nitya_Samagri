import request from "supertest";
import app from "../../src/app";

// These only exercise the validate() middleware in front of each route —
// invalid input is rejected before the handler ever touches Prisma or Redis,
// so no database/cache needs to be running for these to pass.

describe("POST /api/v1/auth/register", () => {
  it("rejects a non-Indian phone number with 400", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      name: "Test User",
      phone: "1234567890",
      password: "password123",
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "phone" })])
    );
  });

  it("rejects a password shorter than 8 characters with 400", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      name: "Test User",
      phone: "+919876543210",
      password: "short",
    });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "password" })])
    );
  });

  it("rejects a missing name with 400", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      phone: "+919876543210",
      password: "password123",
    });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/v1/auth/login", () => {
  it("rejects an invalid phone number with 400", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      phone: "not-a-phone",
      password: "whatever",
    });

    expect(res.status).toBe(400);
  });

  it("rejects a missing password with 400", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      phone: "+919876543210",
    });

    expect(res.status).toBe(400);
  });
});
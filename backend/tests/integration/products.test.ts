import request from "supertest";
import app from "../../src/app";
import { mockRedisInstance } from "../mocks/ioredis.mock";

describe("GET /api/v1/products", () => {
  it("rejects a non-numeric page param with 400", async () => {
    // Validation runs before any Redis/Prisma call, so this needs no mocking.
    const res = await request(app).get("/api/v1/products?page=abc");

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "page" })])
    );
  });

  it("rejects a limit above 100 with 400", async () => {
    const res = await request(app).get("/api/v1/products?limit=500");
    expect(res.status).toBe(400);
  });

  it("returns the cached response as-is on a cache hit, without querying the database", async () => {
    const cached = {
      success: true,
      data: {
        products: [{ id: "p1", name: "Ganga Jal 1L", price: 199 }],
        pagination: { page: 1, limit: 20, total: 1, pages: 1 },
      },
    };

    // Prime the mock Redis client with a "cache hit" for the very first
    // GET this test file makes; the route should short-circuit and never
    // reach Prisma.
    mockRedisInstance.get.mockResolvedValueOnce(JSON.stringify(cached));

    const res = await request(app).get("/api/v1/products");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(cached);
    expect(mockRedisInstance.get).toHaveBeenCalledWith(expect.stringContaining("products:list:"));
  });
});
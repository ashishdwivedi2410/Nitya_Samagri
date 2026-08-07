import request from "supertest";
import app from "../../src/app";

describe("GET /health", () => {
  it("returns 200 with a status/timestamp/version payload", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(typeof res.body.timestamp).toBe("string");
    expect(res.body.version).toBe("1.0.0");
  });
});
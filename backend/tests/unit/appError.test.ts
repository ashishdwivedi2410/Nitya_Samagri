import { AppError } from "../../src/utils/AppError";

describe("AppError", () => {
  it("defaults to a 500 status code", () => {
    const err = new AppError("Something broke");
    expect(err.statusCode).toBe(500);
    expect(err.message).toBe("Something broke");
    expect(err.isOperational).toBe(true);
  });

  it("accepts a custom status code", () => {
    const err = new AppError("Not found", 404);
    expect(err.statusCode).toBe(404);
  });

  it("carries field-level validation errors when provided", () => {
    const err = new AppError("Validation failed", 400, [
      { field: "phone", message: "Invalid Indian mobile number" },
    ]);
    expect(err.errors).toEqual([
      { field: "phone", message: "Invalid Indian mobile number" },
    ]);
  });

  it("is a real Error instance with a stack trace", () => {
    const err = new AppError("boom", 400);
    expect(err).toBeInstanceOf(Error);
    expect(err.stack).toBeDefined();
  });
});
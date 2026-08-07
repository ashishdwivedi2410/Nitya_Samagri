import { z } from "zod";
import { Request, Response } from "express";
import { validate } from "../../src/middlewares/validate.middleware";
import { AppError } from "../../src/utils/AppError";

const schema = z.object({
  phone: z.string().regex(/^\+91[6-9]\d{9}$/, "Invalid Indian mobile number"),
});

function mockReqRes(body: unknown) {
  const req = { body } as Request;
  const res = {} as Response;
  const next = jest.fn();
  return { req, res, next };
}

describe("validate() middleware", () => {
  it("calls next() with no error when the body is valid", () => {
    const { req, res, next } = mockReqRes({ phone: "+919876543210" });
    validate(schema)(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("replaces req.body with the parsed/coerced data on success", () => {
    const { req, res, next } = mockReqRes({ phone: "+919876543210", extra: "stripped-if-schema-says-so" });
    validate(schema)(req, res, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ phone: "+919876543210" });
  });

  it("calls next() with an AppError(400) when the body is invalid", () => {
    const { req, res, next } = mockReqRes({ phone: "not-a-phone-number" });
    validate(schema)(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0] as AppError;
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(400);
    expect(err.errors).toEqual([
      { field: "phone", message: "Invalid Indian mobile number" },
    ]);
  });

  it("validates the query source when told to", () => {
    const req = { query: { phone: "bad" } } as unknown as Request;
    const res = {} as Response;
    const next = jest.fn();

    validate(schema, "query")(req, res, next);

    const err = next.mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
  });
});
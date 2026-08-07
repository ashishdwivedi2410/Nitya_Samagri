import { paginate, paginationMeta } from "../../src/utils/paginate";

describe("paginate()", () => {
  it("computes skip/take for page 1", () => {
    expect(paginate(1, 20)).toEqual({ skip: 0, take: 20 });
  });

  it("computes skip/take for a later page", () => {
    expect(paginate(3, 20)).toEqual({ skip: 40, take: 20 });
  });

  it("computes skip/take with a non-default limit", () => {
    expect(paginate(2, 5)).toEqual({ skip: 5, take: 5 });
  });
});

describe("paginationMeta()", () => {
  it("reports hasNext/hasPrev correctly on the first page", () => {
    const meta = paginationMeta(1, 20, 45);
    expect(meta).toEqual({
      page: 1,
      limit: 20,
      total: 45,
      pages: 3,
      hasNext: true,
      hasPrev: false,
    });
  });

  it("reports hasNext/hasPrev correctly on the last page", () => {
    const meta = paginationMeta(3, 20, 45);
    expect(meta.hasNext).toBe(false);
    expect(meta.hasPrev).toBe(true);
    expect(meta.pages).toBe(3);
  });

  it("handles zero results without dividing by zero incorrectly", () => {
    const meta = paginationMeta(1, 20, 0);
    expect(meta.pages).toBe(0);
    expect(meta.hasNext).toBe(false);
    expect(meta.hasPrev).toBe(false);
  });
});
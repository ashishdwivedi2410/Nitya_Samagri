// src/utils/paginate.ts
export function paginate(page: number, limit: number): { skip: number; take: number } {
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}

export function paginationMeta(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    pages:    Math.ceil(total / limit),
    hasNext:  page < Math.ceil(total / limit),
    hasPrev:  page > 1,
  };
}

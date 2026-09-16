import { APP_CONSTANTS } from '../config/constants';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export function parsePagination(query: any): PaginationParams {
  const page = Math.max(1, parseInt(query.page, 10) || APP_CONSTANTS.DEFAULT_PAGE);
  const limit = Math.min(
    APP_CONSTANTS.MAX_LIMIT,
    Math.max(1, parseInt(query.limit, 10) || APP_CONSTANTS.DEFAULT_LIMIT)
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function formatPaginatedResponse<T>(data: T[], total: number, page: number, limit: number) {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export interface BaseDocument {
  _id: string;
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Pagination metadata returned by the backend as a sibling of `data`.
 * @see ApiResponse.paginated in backend/src/utils/ApiResponse.js
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

/**
 * Shape of a paginated list response from this backend. The item array lives
 * in `data` directly and pagination metadata is a sibling — NOT nested under
 * `data.items`. Handle a missing `pagination` (the cached-list branch of some
 * controllers drops it) defensively in callers.
 */
export interface ApiListResponse<T> {
  success: boolean;
  statusCode?: number;
  message?: string;
  data: T[];
  pagination?: PaginationInfo;
  timestamp?: string;
}

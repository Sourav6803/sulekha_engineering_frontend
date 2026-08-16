import type { ApiListResponse, ApiResponse } from '@/types/api';
import type {
  ImageUploadResult,
  MaterialDocument,
  MaterialSummary,
  StockAdjustResult,
  StockLedgerEntry,
} from '@/types/material';
import axiosClient from './axiosClient';
import { ENDPOINTS } from './endpoints';

export interface MaterialListQuery {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  lowStock?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export type CreateMaterialDto = Partial<MaterialDocument>;
export type UpdateMaterialDto = Partial<MaterialDocument>;
export interface AdjustStockDto {
  adjustment: number;
  reason: string;
}

export type MaterialListResponse = ApiListResponse<MaterialDocument>;
export type MaterialHistoryResponse = ApiListResponse<StockLedgerEntry>;

export const materialsApi = {
  /** GET /materials — paginated list. `data` is the array; `pagination` is a sibling. */
  list: (query?: MaterialListQuery): Promise<MaterialListResponse> =>
    axiosClient
      .get<MaterialListResponse>(ENDPOINTS.materials.root, { params: query })
      .then((response) => response.data),

  /** POST /materials */
  create: (payload: CreateMaterialDto): Promise<ApiResponse<MaterialDocument>> =>
    axiosClient.post<ApiResponse<MaterialDocument>>(ENDPOINTS.materials.root, payload).then((response) => response.data),

  /** GET /materials/:id */
  get: (id: string): Promise<ApiResponse<MaterialDocument>> =>
    axiosClient.get<ApiResponse<MaterialDocument>>(ENDPOINTS.materials.byId(id)).then((response) => response.data),

  /** PUT /materials/:id */
  update: (id: string, payload: UpdateMaterialDto): Promise<ApiResponse<MaterialDocument>> =>
    axiosClient.put<ApiResponse<MaterialDocument>>(ENDPOINTS.materials.byId(id), payload).then((response) => response.data),

  /** DELETE /materials/:id — soft delete */
  remove: (id: string): Promise<ApiResponse<null>> =>
    axiosClient.delete<ApiResponse<null>>(ENDPOINTS.materials.byId(id)).then((response) => response.data),

  /** GET /materials/low-stock */
  getLowStock: (): Promise<ApiResponse<MaterialDocument[]>> =>
    axiosClient.get<ApiResponse<MaterialDocument[]>>(ENDPOINTS.materials.lowStock).then((response) => response.data),

  /** GET /materials/summary */
  getSummary: (): Promise<ApiResponse<MaterialSummary>> =>
    axiosClient.get<ApiResponse<MaterialSummary>>(ENDPOINTS.materials.summary).then((response) => response.data),

  /** GET /materials/search */
  search: (q: string, limit?: number): Promise<ApiResponse<MaterialDocument[]>> =>
    axiosClient
      .get<ApiResponse<MaterialDocument[]>>(ENDPOINTS.materials.search, { params: { q, limit } })
      .then((response) => response.data),

  /** POST /materials/:id/image — multipart form upload */
  uploadImage: (id: string, image: File): Promise<ApiResponse<ImageUploadResult>> => {
    const formData = new FormData();
    formData.append('image', image);
    return axiosClient
      .post<ApiResponse<ImageUploadResult>>(ENDPOINTS.materials.image(id), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((response) => response.data);
  },

  /** GET /materials/:id/history — paginated stock ledger. */
  getHistory: (id: string, params?: { page?: number; limit?: number }): Promise<MaterialHistoryResponse> =>
    axiosClient
      .get<MaterialHistoryResponse>(ENDPOINTS.materials.history(id), { params })
      .then((response) => response.data),

  /** PATCH /materials/:id/stock — admin/manager only */
  adjustStock: (id: string, payload: AdjustStockDto): Promise<ApiResponse<StockAdjustResult>> =>
    axiosClient.patch<ApiResponse<StockAdjustResult>>(ENDPOINTS.materials.stock(id), payload).then((response) => response.data),
};

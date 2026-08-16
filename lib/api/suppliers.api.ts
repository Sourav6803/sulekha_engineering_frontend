import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type { SupplierDocument } from '@/types/supplier';
import axiosClient from './axiosClient';
import { ENDPOINTS } from './endpoints';

export interface SupplierListQuery {
  page?: number;
  limit?: number;
  status?: string;
  businessType?: string;
  city?: string;
  state?: string;
  category?: string;
  search?: string;
  hasGST?: boolean;
  minRating?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateSupplierDto extends Partial<SupplierDocument> {}
export interface UpdateSupplierDto extends Partial<SupplierDocument> {}

export const suppliersApi = {
  list: (query?: SupplierListQuery) =>
    axiosClient
      .get<ApiResponse<PaginatedResponse<SupplierDocument>>>(ENDPOINTS.suppliers.root, { params: query })
      .then((response) => response.data),

  create: (payload: CreateSupplierDto) =>
    axiosClient.post<ApiResponse<SupplierDocument>>(ENDPOINTS.suppliers.root, payload).then((response) => response.data),

  get: (id: string) =>
    axiosClient.get<ApiResponse<SupplierDocument>>(ENDPOINTS.suppliers.byId(id)).then((response) => response.data),

  update: (id: string, payload: UpdateSupplierDto) =>
    axiosClient.put<ApiResponse<SupplierDocument>>(ENDPOINTS.suppliers.byId(id), payload).then((response) => response.data),

  remove: (id: string) =>
    axiosClient.delete<ApiResponse<null>>(ENDPOINTS.suppliers.byId(id)).then((response) => response.data),

  getPurchases: (id: string, params?: { page?: number; limit?: number; dateFrom?: string; dateTo?: string; status?: string }) =>
    axiosClient
      .get<ApiResponse<PaginatedResponse<unknown>>>(ENDPOINTS.suppliers.purchases(id), { params })
      .then((response) => response.data)
};

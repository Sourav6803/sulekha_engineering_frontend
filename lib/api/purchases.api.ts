import type { ApiListResponse, ApiResponse } from '@/types/api';
import type { PurchaseDocument } from '@/types/purchase';
import axiosClient from './axiosClient';
import { ENDPOINTS } from './endpoints';

export interface PurchaseListQuery {
  page?: number;
  limit?: number;
  supplier?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  paymentStatus?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export type CreatePurchaseDto = Partial<PurchaseDocument>;
export type UpdatePurchaseDto = Partial<PurchaseDocument>;

export const purchasesApi = {
  list: (query?: PurchaseListQuery) =>
    axiosClient
      // `ApiListResponse`: the array is `data`, with paging metadata beside it.
      .get<ApiListResponse<PurchaseDocument>>(ENDPOINTS.purchases.root, { params: query })
      .then((response) => response.data),

  create: (payload: CreatePurchaseDto) =>
    axiosClient.post<ApiResponse<PurchaseDocument>>(ENDPOINTS.purchases.root, payload).then((response) => response.data),

  get: (id: string) =>
    axiosClient.get<ApiResponse<PurchaseDocument>>(ENDPOINTS.purchases.byId(id)).then((response) => response.data),

  update: (id: string, payload: UpdatePurchaseDto) =>
    axiosClient.put<ApiResponse<PurchaseDocument>>(ENDPOINTS.purchases.byId(id), payload).then((response) => response.data),

  remove: (id: string) =>
    axiosClient.delete<ApiResponse<null>>(ENDPOINTS.purchases.byId(id)).then((response) => response.data),

  uploadInvoice: (id: string, file: File) => {
    const data = new FormData();
    data.append('invoice', file);
    return axiosClient
      .post<ApiResponse<null>>(ENDPOINTS.purchases.invoice(id), data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      .then((response) => response.data);
  },

  complete: (id: string) =>
    axiosClient.patch<ApiResponse<null>>(ENDPOINTS.purchases.complete(id)).then((response) => response.data)
};

import type { ApiListResponse, ApiResponse } from '@/types/api';
import type { Customer, CustomerDocument } from '@/types/customer';
import type { InstallationDocument } from '@/types/installation';
import axiosClient from './axiosClient';
import { ENDPOINTS } from './endpoints';

export interface CustomerListQuery {
  page?: number;
  limit?: number;
  status?: string;
  city?: string;
  state?: string;
  roofType?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export type CreateCustomerDto = Partial<Customer>;
export type UpdateCustomerDto = Partial<Customer>;

export type CustomerListResponse = ApiListResponse<Customer>;
export type CustomerResponse = ApiResponse<Customer>;

export interface CustomerHistorySummary {
  totalInstallations: number;
  totalSystemCapacity: number;
  completedInstallations: number;
  averageSystemSize: number;
  totalCost: number;
}

export interface CustomerHistory {
  customer: Customer;
  summary: CustomerHistorySummary;
  installations: InstallationDocument[];
}

export const customersApi = {
  list: (query?: CustomerListQuery) =>
    axiosClient
      .get<CustomerListResponse>(ENDPOINTS.customers.root, { params: query })
      .then((response) => response.data),

  search: (q: string, limit?: number) =>
    axiosClient
      .get<ApiResponse<Customer[]>>(ENDPOINTS.customers.search, { params: { q, limit } })
      .then((response) => response.data),

  get: (id: string) =>
    axiosClient.get<CustomerResponse>(ENDPOINTS.customers.byId(id)).then((response) => response.data),

  create: (payload: CreateCustomerDto) =>
    axiosClient.post<CustomerResponse>(ENDPOINTS.customers.root, payload).then((response) => response.data),

  update: (id: string, payload: UpdateCustomerDto) =>
    axiosClient.put<CustomerResponse>(ENDPOINTS.customers.byId(id), payload).then((response) => response.data),

  remove: (id: string) =>
    axiosClient
      .delete<ApiResponse<null>>(ENDPOINTS.customers.byId(id))
      .then((response) => response.data),

  getInstallations: (id: string, params?: { page?: number; limit?: number }) =>
    axiosClient
      .get<ApiListResponse<InstallationDocument>>(ENDPOINTS.customers.installations(id), { params })
      .then((response) => response.data),

  getHistory: (id: string) =>
    axiosClient.get<ApiResponse<CustomerHistory>>(ENDPOINTS.customers.history(id)).then((response) => response.data),

  uploadDocument: (id: string, formData: FormData) =>
    axiosClient.post<ApiResponse<CustomerDocument>>(ENDPOINTS.customers.documents(id), formData, {
      headers: { 'Content-Type': undefined }
    }).then((response) => response.data),

  deleteDocument: (id: string, documentId: string) =>
    axiosClient.delete<ApiResponse<null>>(ENDPOINTS.customers.document(id, documentId)).then((response) => response.data),
};
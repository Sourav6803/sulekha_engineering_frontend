import type { ApiListResponse, ApiResponse } from '@/types/api';
import type { InstallationDocument, SuggestedBOMSection } from '@/types/installation';
import axiosClient from './axiosClient';
import { ENDPOINTS } from './endpoints';

export interface InstallationListQuery {
  page?: number;
  limit?: number;
  customer?: string;
  status?: string;
  roofType?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export type CreateInstallationDto = Partial<InstallationDocument>;
export type UpdateInstallationDto = Partial<InstallationDocument>;

export interface AssignMaterialsDto {
  items: Array<{
    material: string;
    qty: number;
    remark?: string;
  }>;
  idempotencyKey?: string;
}

export interface ReverseMaterialDto {
  reason: string;
}

export interface UpdateInstallationStatusDto {
  status: string;
  notes?: string;
}

export type BomVariant = 'suggested' | 'final';

export interface CreateInstallationResponse {
  installation: InstallationDocument;
  suggestedMaterials: SuggestedBOMSection[];
  loadAnalysis: unknown;
}

export type InstallationListResponse = ApiListResponse<InstallationDocument>;
export type InstallationResponse = ApiResponse<InstallationDocument>;

export const installationsApi = {
  list: (query?: InstallationListQuery) =>
    axiosClient
      .get<InstallationListResponse>(ENDPOINTS.installations.root, { params: query })
      .then((response) => response.data),

  create: (payload: CreateInstallationDto) =>
    axiosClient
      .post<ApiResponse<CreateInstallationResponse>>(ENDPOINTS.installations.root, payload)
      .then((response) => response.data),

  get: (id: string) =>
    axiosClient.get<InstallationResponse>(ENDPOINTS.installations.byId(id)).then((response) => response.data),

  update: (id: string, payload: UpdateInstallationDto) =>
    axiosClient.put<InstallationResponse>(ENDPOINTS.installations.byId(id), payload).then((response) => response.data),

  remove: (id: string) =>
    axiosClient.delete<ApiResponse<null>>(ENDPOINTS.installations.byId(id)).then((response) => response.data),

  getSuggestedBOM: (roofType: string, systemSizeKW: number) =>
    axiosClient
      .get<ApiResponse<{ roofType: string; systemSizeKW: number; materials: SuggestedBOMSection[] }>>(
        ENDPOINTS.installations.suggestedBOM,
        { params: { roofType, systemSizeKW } }
      )
      .then((response) => response.data),

  assignMaterials: (id: string, payload: AssignMaterialsDto) =>
    axiosClient.post<ApiResponse<InstallationDocument>>(ENDPOINTS.installations.materials(id), payload).then((response) => response.data),

  reverseMaterial: (id: string, usageId: string, payload: ReverseMaterialDto) =>
    axiosClient
      .post<ApiResponse<InstallationDocument>>(ENDPOINTS.installations.reverseMaterial(id, usageId), payload)
      .then((response) => response.data),

  getBomPdf: (id: string, variant: BomVariant = 'final') =>
    axiosClient
      .get<ArrayBuffer>(ENDPOINTS.installations.bomPdf(id), { params: { variant }, responseType: 'arraybuffer' })
      .then((response) => response.data),

  getBomExcel: (id: string, variant: BomVariant = 'suggested') =>
    axiosClient
      .get<ArrayBuffer>(ENDPOINTS.installations.bomExcel(id), { params: { variant }, responseType: 'arraybuffer' })
      .then((response) => response.data),

  updateStatus: (id: string, payload: UpdateInstallationStatusDto) =>
    axiosClient
      .patch<ApiResponse<InstallationDocument>>(ENDPOINTS.installations.status(id), payload)
      .then((response) => response.data),

  getLoadAnalysis: (id: string) =>
    axiosClient.get<ApiResponse<unknown>>(ENDPOINTS.installations.loadAnalysis(id)).then((response) => response.data)
};
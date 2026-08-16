import type { ApiListResponse, ApiResponse } from '@/types/api';
import type {
  BOMTemplateCreatePayload,
  BOMTemplateDocument,
  BOMTemplateListQuery,
  BOMTemplateUpdatePayload,
  BulkCreatePayload,
  BulkCreateResult,
  BOMByRoofTypeQuery,
  BOMByRoofTypeResponse,
} from '@/types/bomTemplate';
import axiosClient from './axiosClient';
import { ENDPOINTS } from './endpoints';

export type { BOMTemplateCreatePayload, BOMTemplateDocument, BOMTemplateListQuery, BOMTemplateUpdatePayload, BulkCreateResult, BOMByRoofTypeResponse };

export type BOMTemplateListResponse = ApiListResponse<BOMTemplateDocument>;
export type BOMByRoofTypeApiResponse = ApiResponse<BOMByRoofTypeResponse>;
export type BulkCreateApiResponse = ApiResponse<BulkCreateResult>;

export const bomTemplatesApi = {
  list: (query?: BOMTemplateListQuery): Promise<BOMTemplateListResponse> =>
    axiosClient.get<BOMTemplateListResponse>(ENDPOINTS.bomTemplates.root, { params: query }).then((r) => r.data),

  get: (id: string): Promise<ApiResponse<BOMTemplateDocument>> =>
    axiosClient.get<ApiResponse<BOMTemplateDocument>>(ENDPOINTS.bomTemplates.byId(id)).then((r) => r.data),

  getByRoofType: (query: BOMByRoofTypeQuery): Promise<BOMByRoofTypeApiResponse> =>
    axiosClient
      .get<BOMByRoofTypeApiResponse>(ENDPOINTS.bomTemplates.byRoofType, { params: query })
      .then((r) => r.data),

  create: (payload: BOMTemplateCreatePayload): Promise<ApiResponse<BOMTemplateDocument>> =>
    axiosClient
      .post<ApiResponse<BOMTemplateDocument>>(ENDPOINTS.bomTemplates.root, payload)
      .then((r) => r.data),

  update: (id: string, payload: BOMTemplateUpdatePayload): Promise<ApiResponse<BOMTemplateDocument>> =>
    axiosClient
      .put<ApiResponse<BOMTemplateDocument>>(ENDPOINTS.bomTemplates.byId(id), payload)
      .then((r) => r.data),

  remove: (id: string): Promise<ApiResponse<null>> =>
    axiosClient.delete<ApiResponse<null>>(ENDPOINTS.bomTemplates.byId(id)).then((r) => r.data),

  bulkCreate: (payload: BulkCreatePayload): Promise<BulkCreateApiResponse> =>
    axiosClient.post<BulkCreateApiResponse>(ENDPOINTS.bomTemplates.bulk, payload).then((r) => r.data),
};

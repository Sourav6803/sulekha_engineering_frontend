import axiosClient from './axiosClient';
import { ENDPOINTS } from './endpoints';
import type { ApiListResponse, ApiResponse } from '@/types/api';
import type {
  AgreementDefaults,
  AgreementDeleteResult,
  AgreementDocument,
  AgreementListQuery,
  AgreementPayload,
  AgreementUpdateResult,
} from '@/types/agreement';

/**
 * Consumer agreements (the four page PM Surya Ghar document).
 *
 * Response envelope is `{ success, message, data, pagination? }` - the list is
 * in `data` and `pagination` is a sibling, never nested under data.
 */
export const agreementsApi = {
  async list(query: AgreementListQuery = {}) {
    const { data } = await axiosClient.get<ApiListResponse<AgreementDocument>>(
      ENDPOINTS.agreements.root,
      { params: query }
    );
    return data;
  },

  /** Fixed wording and defaults for the form (discom, registered office, split). */
  async defaults() {
    const { data } = await axiosClient.get<ApiResponse<AgreementDefaults>>(
      ENDPOINTS.agreements.defaults
    );
    return data;
  },

  async get(id: string) {
    const { data } = await axiosClient.get<ApiResponse<AgreementDocument>>(
      ENDPOINTS.agreements.byId(id)
    );
    return data;
  },

  async create(payload: AgreementPayload) {
    const { data } = await axiosClient.post<ApiResponse<AgreementDocument>>(
      ENDPOINTS.agreements.root,
      payload
    );
    return data;
  },

  async update(id: string, payload: AgreementPayload) {
    const { data } = await axiosClient.put<ApiResponse<AgreementUpdateResult>>(
      ENDPOINTS.agreements.byId(id),
      payload
    );
    return data;
  },

  async remove(id: string, reason = '') {
    const { data } = await axiosClient.delete<ApiResponse<AgreementDeleteResult>>(
      ENDPOINTS.agreements.byId(id),
      { data: { reason } }
    );
    return data;
  },

  /** The four page document as bytes (for download or an inline preview). */
  async downloadPdf(id: string) {
    const { data } = await axiosClient.get(ENDPOINTS.agreements.pdf(id), {
      responseType: 'arraybuffer',
    });
    return data as ArrayBuffer;
  },

  /** The same four pages as printable HTML. */
  async printHtml(id: string) {
    const { data } = await axiosClient.get(ENDPOINTS.agreements.print(id), {
      responseType: 'text',
    });
    return data as string;
  },
};

export default agreementsApi;

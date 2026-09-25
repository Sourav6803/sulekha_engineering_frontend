import axiosClient from './axiosClient';
import { ENDPOINTS } from './endpoints';
import type { ApiListResponse, ApiResponse } from '@/types/api';
import type {
  QuotationAttachment,
  QuotationAttachmentConfirmResult,
  QuotationAttachmentKind,
  QuotationAttachmentStaging,
  QuotationDefaults,
  QuotationDeleteResult,
  QuotationDocument,
  QuotationImportPlan,
  QuotationImportRow,
  QuotationListQuery,
  QuotationNextNumber,
  QuotationPayload,
  QuotationRegisterQuery,
  QuotationRegisterRow,
  QuotationRestoreResult,
  QuotationStats,
  QuotationStatus,
  QuotationUpdateResult,
} from '@/types/quotation';

/**
 * Quotation API.
 *
 * The backend envelope is `{ success, message, data, pagination }` where `data`
 * carries the array for list endpoints and `pagination` is a sibling - never
 * nested under `data.items`.
 */

export interface QuotationRegisterResponse {
  rows: QuotationRegisterRow[];
  nextNumber: QuotationNextNumber | null;
}

export const quotationsApi = {
  /** The quotation sheet (list), newest number first by default. */
  async list(query: QuotationListQuery = {}) {
    const { data } = await axiosClient.get<ApiListResponse<QuotationDocument>>(ENDPOINTS.quotations.root, {
      params: query,
    });
    return data;
  },

  /** The Quotation SL Number register. */
  async register(query: QuotationRegisterQuery = {}) {
    const { data } = await axiosClient.get<ApiListResponse<QuotationRegisterRow>>(ENDPOINTS.quotations.register, {
      params: query,
    });
    return data;
  },

  /**
   * Fixed company values for the form: the terms and payment terms that every
   * quotation carries, plus the panel sizing, line limit and scheme list.
   */
  async defaults() {
    const { data } = await axiosClient.get<ApiResponse<QuotationDefaults>>(ENDPOINTS.quotations.defaults);
    return data;
  },

  /** Preview the number the next quotation will get. Does not consume it. */
  async nextNumber(params: { schemeCode?: string; issueDate?: string } = {}) {
    const { data } = await axiosClient.get<ApiResponse<QuotationNextNumber>>(ENDPOINTS.quotations.nextNumber, {
      params,
    });
    return data;
  },

  async stats(params: { financialYear?: string } = {}) {
    const { data } = await axiosClient.get<ApiResponse<QuotationStats>>(ENDPOINTS.quotations.stats, { params });
    return data;
  },

  async get(id: string) {
    const { data } = await axiosClient.get<ApiResponse<QuotationDocument>>(ENDPOINTS.quotations.byId(id));
    return data;
  },

  async create(payload: QuotationPayload) {
    const { data } = await axiosClient.post<ApiResponse<QuotationDocument>>(ENDPOINTS.quotations.root, payload);
    return data;
  },

  async update(id: string, payload: QuotationPayload) {
    const { data } = await axiosClient.put<ApiResponse<QuotationUpdateResult>>(
      ENDPOINTS.quotations.byId(id),
      payload
    );
    return data;
  },

  async changeStatus(id: string, status: QuotationStatus) {
    const { data } = await axiosClient.patch<ApiResponse<QuotationDocument>>(ENDPOINTS.quotations.status(id), {
      status,
    });
    return data;
  },

  /** Soft delete: removes it from the quotation list AND the SL number register. */
  async remove(id: string, reason?: string) {
    const { data } = await axiosClient.delete<ApiResponse<QuotationDeleteResult>>(ENDPOINTS.quotations.byId(id), {
      data: { reason },
    });
    return data;
  },

  async restore(id: string, assignNewNumber = false) {
    const { data } = await axiosClient.post<ApiResponse<QuotationRestoreResult>>(ENDPOINTS.quotations.restore(id), {
      assignNewNumber,
    });
    return data;
  },

  async uploadAttachment(id: string, file: File, kind: QuotationAttachmentKind = 'original_manual') {
    const body = new FormData();
    body.append('file', file);
    body.append('kind', kind);

    const { data } = await axiosClient.post<ApiResponse<QuotationAttachment>>(
      ENDPOINTS.quotations.attachments(id),
      body,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data;
  },

  async removeAttachment(id: string, attachmentId: string) {
    const { data } = await axiosClient.delete<ApiResponse<{ removed: boolean }>>(
      ENDPOINTS.quotations.attachment(id, attachmentId)
    );
    return data;
  },

  /**
   * The A4 one page document. Returned as an ArrayBuffer so the caller can
   * either save it or turn it into a blob url for the preview iframe.
   */
  async downloadPdf(id: string, inline = false): Promise<ArrayBuffer> {
    const { data } = await axiosClient.get<ArrayBuffer>(ENDPOINTS.quotations.pdf(id), {
      params: inline ? { inline: 1 } : undefined,
      responseType: 'arraybuffer',
    });
    return data;
  },

  /** The same markup as the PDF, as HTML, for the print window. */
  async printHtml(id: string, withToolbar = true): Promise<string> {
    const { data } = await axiosClient.get<string>(ENDPOINTS.quotations.print(id), {
      params: withToolbar ? undefined : { toolbar: 'false' },
      responseType: 'text',
    });
    return data;
  },

  /** Back-fill: import the old register sheet. dryRun defaults to true on the server. */
  async importRegister(payload: {
    dryRun?: boolean;
    useLegacy?: boolean;
    source?: string;
    rows?: QuotationImportRow[];
  }) {
    const { data } = await axiosClient.post<ApiResponse<QuotationImportPlan>>(
      ENDPOINTS.quotations.importRegister,
      payload
    );
    return data;
  },

  /** Back-fill: upload the old register sheet itself (.xlsx / .csv). */
  async importRegisterFile(file: File, payload: { dryRun?: boolean; source?: string } = {}) {
    const body = new FormData();
    body.append('file', file);
    body.append('dryRun', String(payload.dryRun ?? true));
    if (payload.source) body.append('source', payload.source);

    const { data } = await axiosClient.post<ApiResponse<QuotationImportPlan>>(
      ENDPOINTS.quotations.importRegister,
      body,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data;
  },

  /** Back-fill: upload old PDFs and get the proposed matches (nothing attached yet). */
  async importAttachments(files: File[], params: { financialYear?: string } = {}) {
    const body = new FormData();
    files.forEach((file) => body.append('files', file));

    const { data } = await axiosClient.post<ApiResponse<QuotationAttachmentStaging>>(
      ENDPOINTS.quotations.importAttachments,
      body,
      { params, headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data;
  },

  /** Attach the reviewed matches. */
  async confirmImport(
    attachments: Array<{
      quotationId: string;
      url: string;
      publicId?: string | null;
      fileName?: string;
      fileSize?: number | null;
      mimeType?: string;
      kind?: QuotationAttachmentKind;
    }>
  ) {
    const { data } = await axiosClient.post<ApiResponse<QuotationAttachmentConfirmResult>>(
      ENDPOINTS.quotations.importConfirm,
      { attachments }
    );
    return data;
  },
};

export default quotationsApi;

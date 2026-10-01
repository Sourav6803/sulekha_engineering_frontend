import axiosClient from './axiosClient';
import { ENDPOINTS } from './endpoints';
import type { ApiListResponse, ApiResponse } from '@/types/api';
import type {
  ApplicationBillPortalLink,
  ApplicationChecklist,
  ApplicationCreatePayload,
  ApplicationDetail,
  ApplicationDocument,
  ApplicationDocumentFile,
  ApplicationDocumentKind,
  ApplicationDocumentReviewPayload,
  ApplicationDocumentReviewResult,
  ApplicationDocumentUploadFields,
  ApplicationDocumentUploadResult,
  ApplicationDocumentsSummary,
  ApplicationElectricBill,
  ApplicationElectricBillPayload,
  ApplicationElectricBillResult,
  ApplicationElectricBillVerifyPayload,
  ApplicationListQuery,
  ApplicationNameMatch,
  ApplicationNameMatchInput,
  ApplicationReviewPayload,
  ApplicationStats,
  ApplicationStatsQuery,
  ApplicationStatusUpdatePayload,
  ApplicationSubmitIssue,
  ApplicationSubmitPayload,
  ApplicationUpdatePayload,
  CreditCheckPreviewPayload,
  CreditCheckVerdict,
  LenderCriteria,
} from '@/types/application';

/**
 * Applications API.
 *
 * An agent only ever receives their own applications — the scoping is done by
 * the server from the access token, never from a query param.
 */
export const applicationsApi = {
  async list(query: ApplicationListQuery = {}) {
    const { data } = await axiosClient.get<ApiListResponse<ApplicationDocument>>(
      ENDPOINTS.applications.root,
      { params: query }
    );
    return data;
  },

  /** The agent (or office) dashboard numbers. */
  async stats(query: ApplicationStatsQuery = {}) {
    const { data } = await axiosClient.get<ApiResponse<ApplicationStats>>(ENDPOINTS.applications.stats, {
      params: query,
    });
    return data;
  },

  /** The form definition — documents, site types, statuses (with tones) and the bill portal URL. */
  async checklist() {
    const { data } = await axiosClient.get<ApiResponse<ApplicationChecklist>>(
      ENDPOINTS.applications.checklist
    );
    return data;
  },

  /**
   * GET /applications/lender-criteria — the credit rules per lender. Read only, so
   * the client never keeps a second copy of the numbers the server compares against.
   */
  async lenderCriteria() {
    const { data } = await axiosClient.get<ApiResponse<LenderCriteria>>(
      ENDPOINTS.applications.lenderCriteria
    );
    return data;
  },

  /**
   * POST /applications/credit-check — the verdict for a consumer's answers before
   * an application exists. Nothing is stored and nothing is required: every field
   * is optional and a doubtful score only produces a notice.
   */
  async creditCheckPreview(payload: CreditCheckPreviewPayload) {
    const { data } = await axiosClient.post<ApiResponse<CreditCheckVerdict>>(
      ENDPOINTS.applications.creditCheck,
      payload
    );
    return data;
  },

  /** The application plus its document summary and everything blocking a submit. */
  async get(id: string) {
    const { data } = await axiosClient.get<ApiResponse<ApplicationDetail>>(ENDPOINTS.applications.byId(id));
    return data;
  },

  /**
   * POST /applications — open a draft. `consumerName` and `phone` are required;
   * the agent is taken from the token, never from the body.
   */
  async create(payload: ApplicationCreatePayload) {
    const { data } = await axiosClient.post<ApiResponse<ApplicationDocument>>(
      ENDPOINTS.applications.root,
      payload
    );
    return data;
  },

  /**
   * DELETE /applications/:id — soft-delete. The server only lets an agent delete
   * a draft or an application sent back for correction; anything further along
   * is refused with a 400 whose message is surfaced verbatim.
   */
  async deleteApplication(id: string) {
    const { data } = await axiosClient.delete<ApiResponse<{ _id: string; deleted: boolean }>>(
      ENDPOINTS.applications.byId(id)
    );
    return data;
  },

  /** PATCH /applications/:id — merge a slice of the form into the draft. */
  async update(id: string, payload: ApplicationUpdatePayload) {
    const { data } = await axiosClient.patch<
      ApiResponse<{ application: ApplicationDocument; submitIssues: ApplicationSubmitIssue[] }>
    >(ENDPOINTS.applications.byId(id), payload);
    return data;
  },

  /**
   * POST /applications/:id/documents — multipart.
   *
   * Content-Type is deliberately left unset: axios (and the browser) must write
   * it themselves so the multipart boundary is included. Setting it by hand
   * produces a body the server cannot parse.
   */
  async uploadDocument(id: string, file: File, fields: ApplicationDocumentUploadFields) {
    const body = new FormData();
    body.append('file', file);
    body.append('kind', fields.kind);
    if (fields.accountNumber) body.append('accountNumber', fields.accountNumber);
    if (fields.ifsc) body.append('ifsc', fields.ifsc);
    if (fields.branchName) body.append('branchName', fields.branchName);
    if (fields.accountType) body.append('accountType', fields.accountType);

    const { data } = await axiosClient.post<ApiResponse<ApplicationDocumentUploadResult>>(
      ENDPOINTS.applications.documents(id),
      body,
      { headers: { 'Content-Type': undefined } }
    );
    return data;
  },

  /** DELETE /applications/:id/documents/:documentId */
  async deleteDocument(id: string, documentId: string) {
    const { data } = await axiosClient.delete<ApiResponse<ApplicationDocumentsSummary>>(
      ENDPOINTS.applications.document(id, documentId)
    );
    return data;
  },

  /** PUT /applications/:id/electric-bill — the two ids, uppercased by the server. */
  async setElectricBill(id: string, payload: ApplicationElectricBillPayload) {
    const { data } = await axiosClient.put<ApiResponse<ApplicationElectricBillResult>>(
      ENDPOINTS.applications.electricBill(id),
      payload
    );
    return data;
  },

  /** GET /applications/:id/electric-bill/portal — where the agent downloads the bill. */
  async getBillPortal(id: string) {
    const { data } = await axiosClient.get<ApiResponse<ApplicationBillPortalLink>>(
      ENDPOINTS.applications.electricBillPortal(id)
    );
    return data;
  },

  /** POST /applications/:id/name-match — recompute the three-name verdict. */
  async runNameMatch(id: string, payload: ApplicationNameMatchInput = {}) {
    const { data } = await axiosClient.post<ApiResponse<ApplicationNameMatch>>(
      ENDPOINTS.applications.nameMatch(id),
      payload
    );
    return data;
  },

  /** POST /applications/:id/submit — leaves the agent's hands. */
  async submit(id: string, payload: ApplicationSubmitPayload) {
    const { data } = await axiosClient.post<ApiResponse<ApplicationDocument>>(
      ENDPOINTS.applications.submit(id),
      payload
    );
    return data;
  },

  // ------------------------- the office's half -------------------------

  /**
   * PATCH /applications/:id/documents/:documentId/review — the office accepts or
   * rejects one uploaded file. The server requires a `reason` when the status is
   * `rejected`; the refusal comes back with its own wording.
   */
  async reviewDocument(id: string, documentId: string, payload: ApplicationDocumentReviewPayload) {
    const { data } = await axiosClient.patch<ApiResponse<ApplicationDocumentReviewResult>>(
      ENDPOINTS.applications.documentReview(id, documentId),
      payload
    );
    return data;
  },

  /**
   * PATCH /applications/:id/electric-bill/verify — the office confirms the two
   * ids against the bill (or withdraws an earlier verification with
   * `{ verified: false }`). Returns the updated electric-bill block.
   */
  async verifyElectricBill(id: string, payload: ApplicationElectricBillVerifyPayload = {}) {
    const { data } = await axiosClient.patch<ApiResponse<ApplicationElectricBill>>(
      ENDPOINTS.applications.electricBillVerify(id),
      payload
    );
    return data;
  },

  /**
   * PATCH /applications/:id/review — approve, send back for correction or reject
   * the application as a whole. The server requires `rejectionReason` for
   * `correction_required` and `rejected`; the refusal is surfaced verbatim.
   */
  async review(id: string, payload: ApplicationReviewPayload) {
    const { data } = await axiosClient.patch<ApiResponse<ApplicationDocument>>(
      ENDPOINTS.applications.review(id),
      payload
    );
    return data;
  },

  /** PATCH /applications/:id/status — move the file along the workflow. */
  async updateStatus(id: string, payload: ApplicationStatusUpdatePayload) {
    const { data } = await axiosClient.patch<ApiResponse<ApplicationDocument>>(
      ENDPOINTS.applications.status(id),
      payload
    );
    return data;
  },

  /**
   * POST /applications/:id/signed-document — multipart, the scanned
   * consumer-signed copy of the quotation or the agreement.
   *
   * `kind` picks which one is being filed (`signedQuotation` by default on the
   * server, or `signedAgreement`); it is only appended when given.
   *
   * Content-Type is deliberately left unset for the same reason as
   * `uploadDocument`: the browser must write it itself so the multipart boundary
   * is included. The server stores it as its own document, so the generated PDF
   * is never overwritten. Office only — an agent gets a 403.
   */
  async uploadSignedDocument(id: string, file: File, kind?: ApplicationDocumentKind) {
    const body = new FormData();
    body.append('file', file);
    if (kind) body.append('kind', kind);

    const { data } = await axiosClient.post<ApiResponse<ApplicationDocumentFile>>(
      ENDPOINTS.applications.signedDocument(id),
      body,
      { headers: { 'Content-Type': undefined } }
    );
    return data;
  },
};

export default applicationsApi;

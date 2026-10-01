/**
 * Consumer application types (the field agent's intake record).
 *
 * Statuses, site types and the document checklist are served by
 * GET /applications/checklist so the client renders exactly what the API
 * enforces (backend/src/data/applicationChecklist.js).
 */

import type { BaseDocument } from './api';

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'correction_required'
  | 'approved'
  | 'quotation_issued'
  | 'agreement_issued'
  | 'completed'
  | 'rejected';

export type ApplicationSiteType =
  | 'rcc_rooftop'
  | 'tin_shed'
  | 'high_rise_structure'
  | 'ground_mount';

/** Badge tone served with each status by /applications/checklist. */
export type ApplicationStatusTone = 'muted' | 'info' | 'warning' | 'success' | 'error';

export type ApplicationDocumentKind =
  | 'aadhaar'
  | 'panCard'
  | 'electricBill'
  | 'rooftopPhoto'
  | 'landRecord'
  | 'passbookOrCheque'
  | 'signedQuotation'
  | 'signedAgreement'
  | 'other';

export type ApplicationIntention = 'yes' | 'no' | 'undecided';

/** Backend enum for the bank account type captured off the passbook / cheque. */
export type ApplicationAccountType = 'savings' | 'current' | 'cash_credit' | 'other';

export type ApplicationQualityVerdict = 'pass' | 'fail' | 'skipped';

export type ApplicationDocumentReviewStatus = 'pending' | 'accepted' | 'rejected';

/** Verdict of the Aadhaar / passbook / bill name agreement check. */
export type ApplicationNameMatchVerdict = 'match' | 'near_match' | 'mismatch' | 'incomplete';

export interface ApplicationAddress {
  street?: string;
  village?: string;
  block?: string;
  panchayat?: string;
  district?: string;
  city?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
  fullAddress?: string;
}

export interface ApplicationDeal {
  systemSizeKW?: number | null;
  proposalAmount?: number | null;
  quotedAmount?: number | null;
  intentionToProceed?: ApplicationIntention | null;
}

export interface ApplicationLoan {
  asked?: boolean;
  hasExistingLoan?: boolean | null;
  lenderName?: string | null;
  loanAmount?: number | null;
  outstandingAmount?: number | null;
  monthlyEmi?: number | null;
  consumerInformed?: boolean;
  remark?: string | null;
}

export interface ApplicationAgentRef {
  _id?: string;
  name?: string;
  email?: string;
  employeeId?: string;
}

export interface ApplicationCustomerRef {
  _id?: string;
  name?: string;
  customerId?: string;
  phone?: string;
}

/** One line of the application's status trail (backend StatusHistorySchema). */
export interface ApplicationStatusHistoryEntry {
  status: ApplicationStatus;
  at?: string;
  by?: string;
  byNameSnapshot?: string;
  note?: string | null;
}

/** The office's verdict on the application as a whole (backend `review` block). */
export interface ApplicationReviewInfo {
  reviewedBy?: string;
  reviewedBySnapshot?: string;
  reviewedAt?: string;
  remark?: string | null;
  /** Plain-language reason shown to the agent when a correction is needed. */
  rejectionReason?: string | null;
}

export interface ApplicationDocument extends BaseDocument {
  applicationNo: string;
  consumerName: string;
  phone: string;
  status: ApplicationStatus;
  siteType?: ApplicationSiteType | null;
  deal?: ApplicationDeal;
  loan?: ApplicationLoan;
  address?: ApplicationAddress;
  siteNotes?: string;
  submittedAt?: string | null;
  agent?: ApplicationAgentRef | string | null;
  /** Frozen at creation so history survives a rename or a deleted agent. */
  agentNameSnapshot?: string | null;
  customer?: ApplicationCustomerRef | string | null;
  createdAt: string;
  updatedAt: string;

  // ---- Workflow trail + office verdict (GET /applications/:id) ----
  statusHistory?: ApplicationStatusHistoryEntry[];
  review?: ApplicationReviewInfo | null;

  // ---- Fields the full application carries (GET /applications/:id) ----
  /** Digits only once the server has normalised it. */
  aadhaarNumber?: string | null;
  panNumber?: string | null;
  alternatePhone?: string | null;
  email?: string | null;
  /** The uploaded checklist documents, with their clarity and office verdicts. */
  documents?: ApplicationDocumentFile[];
  electricBill?: ApplicationElectricBill;
  nameMatch?: ApplicationNameMatch | null;
  /** The credit pre-check the agent recorded — a notice only, never a gate. */
  creditCheck?: ApplicationCreditCheck;
}

/** One uploaded document (the array item stored on the application). */
export interface ApplicationDocumentFile {
  _id: string;
  kind: ApplicationDocumentKind;
  url: string;
  publicId?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  /** Structured fields for the documents that carry them (bank details). */
  extras?: ApplicationDocumentExtras;
  /** The offline clarity verdict computed when the file was stored. */
  qualityCheck?: ApplicationQualityCheck;
  /** The office's human verdict — separate from the clarity check. */
  review?: ApplicationDocumentReview;
  uploadedAt?: string;
}

export interface ApplicationDocumentExtras {
  accountNumber?: string | null;
  ifsc?: string | null;
  branchName?: string | null;
  accountType?: ApplicationAccountType | null;
}

export interface ApplicationQualityCheck {
  verdict: ApplicationQualityVerdict;
  score?: number;
  reasons?: string[];
  metrics?: Record<string, unknown>;
  checkedAt?: string;
}

export interface ApplicationDocumentReview {
  status?: ApplicationDocumentReviewStatus;
  reviewedAt?: string;
  /** Why the office rejected the document — the agent has to know what to fix. */
  reason?: string | null;
}

/** PATCH /applications/:id/documents/:documentId/review — the office's verdict on one file. */
export interface ApplicationDocumentReviewPayload {
  status: Extract<ApplicationDocumentReviewStatus, 'accepted' | 'rejected'>;
  /** Required by the server when the status is `rejected`. */
  reason?: string | null;
}

/** The response to a document verdict: the application status + the refreshed ledger. */
export interface ApplicationDocumentReviewResult {
  status: ApplicationStatus;
  documents: ApplicationDocumentsSummary;
}

/** PATCH /applications/:id/review — approve / send back for correction / reject. */
export interface ApplicationReviewPayload {
  status: Extract<
    ApplicationStatus,
    'under_review' | 'correction_required' | 'approved' | 'rejected'
  >;
  /** A reviewer remark, surfaced to the agent. */
  remark?: string | null;
  /** Required by the server for `correction_required` and `rejected`. */
  rejectionReason?: string | null;
}

/** PATCH /applications/:id/status — move the file along the workflow. */
export interface ApplicationStatusUpdatePayload {
  status: ApplicationStatus;
  note?: string | null;
}

/** The per-kind document ledger returned by the API (summariseDocuments). */
export interface ApplicationDocumentsSummary {
  byKind: Record<
    string,
    Array<{
      _id: string;
      url: string;
      fileName?: string;
      qualityVerdict?: ApplicationQualityVerdict;
      reviewStatus?: ApplicationDocumentReviewStatus;
    }>
  >;
  /** Required kinds with no file yet. */
  missing: string[];
  unclear: number;
  total: number;
  complete: boolean;
}

export interface ApplicationNameMatch {
  consumerName?: string | null;
  aadhaarName?: string | null;
  passbookName?: string | null;
  electricBillName?: string | null;
  verdict?: ApplicationNameMatchVerdict | null;
  passed?: boolean | null;
  mismatched?: string[];
  message?: string | null;
  checkedAt?: string | null;
}

/** One lender's rule for one loan slab, from GET /applications/lender-criteria. */
export interface LenderCriteriaSlab {
  /** The minimum score the bank states, or null when it prescribes none. */
  minScore: number | null;
  /** True when the bank publishes this figure itself. */
  verified: boolean;
  note?: string | null;
}

/** One lender row from GET /applications/lender-criteria. */
export interface LenderCriterion {
  /** Matches the code stored in `creditCheck.bank`. */
  code: string;
  name: string;
  /** The rule for a loan at or below ₹2 lakh. */
  upTo2L?: LenderCriteriaSlab;
  /** The rule for a loan above ₹2 lakh. */
  above2L?: LenderCriteriaSlab;
  /** True when the bank onboarded under the scheme but its minimum is not recorded. */
  unknown?: boolean;
  source?: string;
}

/** GET /applications/lender-criteria — the rules the server itself compares against. */
export interface LenderCriteria {
  lenders: LenderCriterion[];
  schemeWideRules: string[];
  scoreMax: number;
  slabLimit: number;
}

/** Verdict of a credit answer. Only `review` and `fail` are warnings. */
export type CreditCheckStatus = 'pass' | 'review' | 'fail' | 'not_checked';

/** How the credit score was obtained. */
export type CreditCheckMethod = 'consumer_self_check' | 'bank_portal' | 'agent_estimate' | 'other';

/**
 * The credit answer a client may send. Every field is optional — the server owns
 * `status`, `headline` and `detail` and recomputes them from this answer. Nothing
 * here gates a submit.
 */
export interface ApplicationCreditCheckInput {
  bank?: string | null;
  method?: CreditCheckMethod | null;
  score?: number | null;
  defaultOrWriteOff?: boolean;
  newToCredit?: boolean;
  note?: string | null;
}

/** POST /applications/credit-check — the answer plus the cost being judged. Nothing is stored. */
export interface CreditCheckPreviewPayload extends ApplicationCreditCheckInput {
  amount?: number | null;
}

/** The notice the server returns for a credit answer. */
export interface CreditCheckVerdict {
  status: CreditCheckStatus;
  headline: string;
  detail: string;
}

/** The stored `creditCheck` block on an application (GET /applications/:id). */
export interface ApplicationCreditCheck extends ApplicationCreditCheckInput {
  status?: CreditCheckStatus;
  headline?: string | null;
  detail?: string | null;
  checkedAt?: string | null;
  checkedBy?: string | null;
}

export interface ApplicationElectricBill {
  consumerId?: string | null;
  installationNo?: string | null;
  portalUrl?: string | null;
  /** Set when the bill was uploaded through the documents endpoint. */
  fileUrl?: string | null;
  fileName?: string | null;
  verified?: boolean;
  verifiedAt?: string | null;
  verificationNote?: string | null;
}

/** One item blocking a submit — field path + the plain-language reason. */
export interface ApplicationSubmitIssue {
  field: string;
  message: string;
}

/** GET /applications/:id */
export interface ApplicationDetail {
  application: ApplicationDocument;
  documents: ApplicationDocumentsSummary;
  submitIssues: ApplicationSubmitIssue[];
}

/** POST /applications — the two fields that must be present to open a draft. */
export interface ApplicationCreatePayload {
  consumerName: string;
  phone: string;
  alternatePhone?: string | null;
  aadhaarNumber?: string | null;
  panNumber?: string | null;
  email?: string | null;
}

/**
 * PATCH /applications/:id — any subset, at least one field. Nested `address`,
 * `deal` and `loan` blocks are merged field-by-field on the server, so a step
 * can save only the slice it owns.
 */
export interface ApplicationUpdatePayload {
  consumerName?: string;
  phone?: string;
  alternatePhone?: string | null;
  aadhaarNumber?: string | null;
  panNumber?: string | null;
  email?: string | null;
  address?: ApplicationAddress;
  siteType?: ApplicationSiteType | null;
  siteNotes?: string | null;
  deal?: ApplicationDeal;
  loan?: ApplicationLoan;
  nameMatch?: ApplicationNameMatchInput;
  creditCheck?: ApplicationCreditCheckInput;
}

export interface ApplicationNameMatchInput {
  consumerName?: string;
  aadhaarName?: string;
  passbookName?: string;
  electricBillName?: string;
}

/** The non-file fields of POST /applications/:id/documents. */
export interface ApplicationDocumentUploadFields {
  kind: ApplicationDocumentKind;
  accountNumber?: string;
  ifsc?: string;
  branchName?: string;
  accountType?: ApplicationAccountType;
}

/** POST /applications/:id/documents */
export interface ApplicationDocumentUploadResult {
  document: ApplicationDocumentFile;
  qualityCheck: ApplicationQualityCheck;
  isImage: boolean;
  summary: ApplicationDocumentsSummary;
}

/** PUT /applications/:id/electric-bill */
export interface ApplicationElectricBillPayload {
  consumerId: string;
  installationNo: string;
}

export interface ApplicationElectricBillResult {
  electricBill: ApplicationElectricBill;
  /** Portal URL with the two ids appended, ready for the browser. */
  portalUrl: string;
}

/**
 * PATCH /applications/:id/electric-bill/verify — the office confirms (or
 * withdraws) the verification of the two ids against the bill.
 */
export interface ApplicationElectricBillVerifyPayload {
  /** Defaults to true on the server; pass false to withdraw an earlier verification. */
  verified?: boolean;
  note?: string | null;
}

/** GET /applications/:id/electric-bill/portal */
export interface ApplicationBillPortalLink {
  portalUrl: string;
  prefilledUrl: string;
  consumerId?: string | null;
  installationNo?: string | null;
  verified: boolean;
}

/** POST /applications/:id/submit */
export interface ApplicationSubmitPayload {
  confirmNameMatch: boolean;
  note?: string;
}

/** One entry of the form definition from /applications/checklist. */
export interface ApplicationChecklistDocument {
  kind: ApplicationDocumentKind;
  label: string;
  labelBn?: string;
  hint: string;
  hintBn?: string;
  required: boolean;
  /**
   * Structured extras this document carries — currently the bank fields on the
   * passbook / cheque. Rendered generically from this list, never hardcoded.
   */
  extras?: string[];
  /**
   * Who files this document. `office` marks the paperwork the office owns — the
   * signed quotation and the signed agreement — which the field agent may only
   * view and download, never upload. Absent (or `field`) means an agent-uploaded
   * checklist document. Read from the checklist; never hardcode the kinds.
   */
  filedBy?: 'office' | 'field';
}

export interface ApplicationChecklist {
  documents: ApplicationChecklistDocument[];
  siteTypes: Array<{ value: ApplicationSiteType; label: string; labelBn?: string }>;
  statuses: Array<{ value: ApplicationStatus; label: string; tone: ApplicationStatusTone }>;
  billPortalUrl: string;
}

/** A row of the dashboard's recent applications strip. */
export interface ApplicationRecentItem {
  _id: string;
  applicationNo: string;
  consumerName: string;
  status: ApplicationStatus;
  siteType?: ApplicationSiteType | null;
  deal?: { systemSizeKW?: number | null };
  createdAt?: string;
}

export interface ApplicationStats {
  totalApplications: number;
  uniqueConsumers: number;
  quotationsIssued: number;
  agreementsIssued: number;
  consumersWithLoan: number;
  totalProposalValue: number;
  byStatus: Record<string, number>;
  documents: { pending: number; accepted: number; rejected: number; unclear: number };
  pendingReview: number;
  needsCorrection: number;
  recentApplications: ApplicationRecentItem[];
}

export interface ApplicationStatsQuery {
  agent?: string;
}

export interface ApplicationListQuery {
  page?: number;
  limit?: number;
  status?: ApplicationStatus;
  siteType?: ApplicationSiteType;
  agent?: string;
  search?: string;
  district?: string;
  hasExistingLoan?: boolean;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'submittedAt' | 'applicationNo' | 'consumerName';
  sortOrder?: 'asc' | 'desc';
}

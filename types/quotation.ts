import type { BaseDocument } from './api';

/** Quotation lifecycle. 'converted' means it became an installation. */
export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';

/** Mounting structure / roof type. */
export type StructureType = 'high_rise' | 'tin_shed' | 'rcc_rooftop' | 'ground_mount';

/**
 * Which sheet a quotation is.
 *
 * `consumer` — the domestic PM Surya Ghar quotation. Every household quotation
 * uses the one fixed template.
 *
 * `partner` — the business sheet, raised for a solar partner, an institutional
 * client or a material supply order. It has no fixed pattern: the lines, the
 * sections and the wording are whatever that job needs.
 */
export type QuotationType = 'consumer' | 'partner';

/**
 * BOQ unit. `null` is valid — two lines of the standard template have no unit.
 * `kwp`, `set` and `job` are the business sheet's units (arrays priced per kWp,
 * switchgear and installation lots as Set./JOB).
 */
export type QuotationUnit =
  | 'nos'
  | 'mtr'
  | 'kg'
  | 'lot'
  | 'pair'
  | 'bag'
  | 'roll'
  | 'box'
  | 'kwp'
  | 'set'
  | 'job';

export type QuotationAttachmentKind = 'original_manual' | 'signed_copy' | 'other';

export interface QuotationItem {
  _id?: string;
  description: string;
  brandModel?: string;
  /** Business sheet only: its own technical specification column. */
  specification?: string;
  qty: number;
  unit?: QuotationUnit | null;
  amount?: number | null;
  isOptional?: boolean;
  order?: number;
  /**
   * Business sheet only: the plant section this line belongs to. Consecutive
   * lines sharing the same label print under one heading with its own sub-total.
   */
  section?: string;
}

export interface QuotationTerm {
  label?: string | null;
  text: string;
}

export interface QuotationPaymentTerm {
  text: string;
}

export interface QuotationAttachment {
  _id: string;
  kind: QuotationAttachmentKind;
  url: string;
  publicId?: string | null;
  fileName?: string;
  fileSize?: number | null;
  mimeType?: string;
  uploadedAt?: string;
  uploadedBy?: string | null;
}

export interface QuotationRevision {
  _id: string;
  at: string;
  action: string;
  changedFields: string[];
}

/** Company details frozen onto the quotation when it was created. */
export interface QuotationCompanySnapshot {
  name?: string;
  addressLines?: string[];
  phone?: string;
  email?: string;
  gstn?: string;
  stateCode?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  ifsc?: string;
  quotationTitle?: string;
  logoPath?: string;
}

export interface QuotationShipTo {
  name?: string;
  addressLines?: string[];
  phone?: string;
}

export interface QuotationDocument extends BaseDocument {
  quotationNo: string;
  quotationSeq: number;
  financialYear: string;
  schemeCode: string;
  schemeLabel?: string;
  /** Which sheet this is. Absent on records made before the business sheet existed. */
  quotationType?: QuotationType;
  customer?: { _id: string; name: string } | string | null;
  customerName: string;
  consumerId?: string;
  phoneNo?: string;
  addressLine1?: string;
  addressLine2?: string;
  district?: string;
  pincode?: string;
  shipTo?: QuotationShipTo;
  systemSizeKW?: number | null;
  panelWp?: number | null;
  panelQty?: number | null;
  panelBrand?: string;
  inverterCapacityKW?: number | null;
  inverterBrand?: string;
  structureType?: StructureType;
  systemOverview?: string;
  items: QuotationItem[];
  amount?: number | null;
  amountIncludesGST?: boolean;
  amountInWords?: string;
  terms: QuotationTerm[];
  paymentTerms: QuotationPaymentTerm[];
  companySnapshot?: QuotationCompanySnapshot;
  issueDate?: string | null;
  validUntil?: string | null;
  validityDays?: number | null;
  status: QuotationStatus;
  attachments?: QuotationAttachment[];
  revisions?: QuotationRevision[];
  notes?: string;
  isHistorical?: boolean;
  importedSlNo?: number | null;
  convertedInstallation?: string | null;
  /** server virtuals */
  formattedAmount?: string;
  isComplete?: boolean;
  customerAddress?: string;
}

/** A row of the Quotation SL Number register (the old Excel sheet, live). */
export interface QuotationRegisterRow {
  slNo: number;
  id: string;
  quotationNo: string;
  /** the "DETAILS" column — the customer name */
  details: string;
  consumerId?: string;
  date?: string | null;
  financialYear: string;
  quotationSeq: number;
  schemeCode: string;
  status: QuotationStatus;
  amount?: number | null;
  isHistorical?: boolean;
  isDeleted?: boolean;
  importedSlNo?: number | null;
  attachmentCount?: number;
}

/**
 * Fixed company values served by GET /quotations/defaults.
 * The terms and payment terms are NOT per-quotation: they are configured once
 * and copied onto every quotation.
 */
// ---------------------------------------------------------------------------
// Back-fill: importing the old manual quotations
// ---------------------------------------------------------------------------

/** One row of the old serial sheet. */
export interface QuotationImportRow {
  slNo?: number | null;
  quotationNo: string;
  details?: string;
  date?: string | null;
}

export interface QuotationImportIssue {
  quotationNo?: string;
  details?: string;
  customerName?: string;
  slNo?: number | null;
  reason: string;
}

export interface QuotationImportPlan {
  dryRun: boolean;
  source: string;
  summary: {
    received: number;
    valid: number;
    created: number;
    skipped: number;
    conflicts: number;
    invalid: number;
    duplicates: number;
    warnings: number;
  };
  toCreate: unknown[];
  toSkip: QuotationImportIssue[];
  conflicts: QuotationImportIssue[];
  invalid: QuotationImportIssue[];
  duplicates: QuotationImportIssue[];
  warnings: QuotationImportIssue[];
  /** What the next number will be once this plan is applied. */
  nextNumberAfterImport: {
    financialYear: string | null;
    nextSequence: number | null;
    nextNumber: string | null;
  };
}

/** How a scanned file was matched to a quotation. */
export type AttachmentMatchType = 'number' | 'name' | 'fuzzy' | 'none';

export interface QuotationAttachmentCandidate {
  id: string;
  quotationNo: string;
  customerName: string;
  score: number;
}

export interface QuotationAttachmentMatch {
  fileName: string;
  matchType: AttachmentMatchType;
  confidence: number;
  detectedNumber?: string | null;
  quotation: { id: string; quotationNo: string; customerName: string; isHistorical?: boolean } | null;
  candidates: QuotationAttachmentCandidate[];
  uploaded: boolean;
  url?: string;
  publicId?: string | null;
  fileSize?: number | null;
  uploadError?: string;
}

export interface QuotationAttachmentStaging {
  dryRun: boolean;
  files: QuotationAttachmentMatch[];
  summary: {
    received: number;
    uploaded: number;
    exactMatches: number;
    needsReview: number;
    unmatched: number;
  };
  note: string;
}

export interface QuotationAttachmentConfirmResult {
  attached: number;
  failed: number;
  applied: Array<{ quotationId: string; quotationNo: string; fileName?: string }>;
  failures: Array<{ reason: string; fileName?: string }>;
}

/**
 * Everything the form needs to render one of the two sheets. The server sends
 * both side by side so switching type needs no extra round trip, and so the
 * form can never disagree with the printed document about what a sheet carries.
 */
export interface QuotationTypeOption {
  value: QuotationType;
  label: string;
  /** Document heading printed on the sheet. */
  title: string;
  /** Line under the company name. Business sheet only. */
  tagline: string;
  showSerialColumn: boolean;
  showSpecificationColumn: boolean;
  showSections: boolean;
  /** Business sheets quote before tax; domestic sheets quote an all-in figure. */
  amountIncludesGST: boolean;
  acceptance: 'client' | 'vendor';
  itemLimit: number;
  terms: Array<{ label?: string | null; text: string }>;
  paymentTerms: Array<{ text: string }>;
}

export interface QuotationDefaults {
  quotationItemLimit: number;
  defaultPanelWp: number;
  panelSizingFactor: number;
  validityDays: number;
  defaultSchemeCode: string;
  quotationNumberPrefix: string;
  quotationTitle: string;
  partnerTitle?: string;
  companyName: string;
  schemes: Array<{ code: string; label?: string }>;
  structures: Array<{ value: StructureType; label: string }>;
  terms: Array<{ label?: string | null; text: string }>;
  paymentTerms: Array<{ text: string }>;
  /** Both sheets described. Absent on an older server. */
  quotationTypes?: QuotationTypeOption[];
}

export interface QuotationNextNumber {
  quotationNo: string;
  quotationSeq: number;
  financialYear: string;
  schemeCode: string;
  schemeLabel?: string;
  basedOnMaxSequence?: number;
}

export interface QuotationStats {
  financialYear: string;
  totalQuotations: number;
  totalAmount: number;
  byStatus: Record<string, number>;
  historical: number;
  maxSequence: number;
  nextNumber: string;
  nextSequence: number;
}

export interface QuotationListQuery {
  page?: number;
  limit?: number;
  financialYear?: string;
  schemeCode?: string;
  quotationType?: QuotationType;
  status?: QuotationStatus;
  customer?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeDeleted?: boolean;
  onlyDeleted?: boolean;
  isHistorical?: boolean;
}

export interface QuotationRegisterQuery {
  page?: number;
  limit?: number;
  financialYear?: string;
  schemeCode?: string;
  search?: string;
  includeDeleted?: boolean;
  onlyDeleted?: boolean;
}

/** Write payload. Never carries the sequence or lifecycle flags. */
export interface QuotationPayload {
  /** Which sheet to issue. Create-only in effect — the terms follow from it. */
  quotationType?: QuotationType;
  customer?: string | null;
  customerName?: string;
  consumerId?: string;
  phoneNo?: string;
  addressLine1?: string;
  addressLine2?: string;
  district?: string;
  pincode?: string;
  shipTo?: QuotationShipTo;
  /** Null on a business sheet that has no single kW figure. */
  systemSizeKW?: number | null;
  panelWp?: number | null;
  panelQty?: number | null;
  panelBrand?: string;
  inverterCapacityKW?: number | null;
  inverterBrand?: string;
  structureType?: StructureType;
  systemOverview?: string;
  items?: QuotationItem[];
  amount?: number | null;
  amountIncludesGST?: boolean;
  amountInWords?: string;
  terms?: QuotationTerm[];
  paymentTerms?: QuotationPaymentTerm[];
  issueDate?: string;
  validUntil?: string | null;
  validityDays?: number;
  status?: QuotationStatus;
  notes?: string;
  schemeCode?: string;
  /**
   * Create only, and only when the admin typed one. Sent as written; the server
   * parses it for the scheme and serial and refuses one whose financial year does
   * not match the issue date. Omitted entirely to take the next number.
   */
  quotationNo?: string;
}

/**
 * The answer to "is this number free?" — see `GET /quotations/check-number`.
 *
 * `reason` says which rule answered, because they need different corrections:
 * a wrong format, the wrong financial year, the number itself already on a live
 * quotation (`duplicate`), or that serial already used by another scheme's
 * quotation (`sequence_taken` — the sequence is global across schemes).
 */
export interface QuotationNumberCheck {
  quotationNo: string;
  available: boolean;
  reason: 'required' | 'format' | 'financial_year' | 'duplicate' | 'sequence_taken' | null;
  message: string;
  quotationSeq?: number;
  financialYear?: string;
  schemeCode?: string;
  expectedFinancialYear?: string;
  existing?: {
    _id?: string;
    quotationNo: string;
    customerName?: string;
    issueDate?: string;
  };
}

export interface QuotationDeleteResult {
  quotation: QuotationDocument;
  /** true when the deleted number is now the next one to be issued */
  numberFreed: boolean;
  deletedSequence: number;
  nextSequence: number;
  financialYear: string;
}

export interface QuotationUpdateResult {
  quotation: QuotationDocument;
  changedFields: string[];
  warnings: string[];
}

export interface QuotationRestoreResult {
  quotation: QuotationDocument;
  reassigned: boolean;
  previousNumber: string | null;
}

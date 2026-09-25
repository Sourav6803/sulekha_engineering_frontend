import type { BaseDocument } from './api';

/** One milestone of the 50 / 40 / 10 schedule, computed by the server. */
export interface AgreementPaymentStage {
  label: string;
  percent: number;
  amount: number;
  /** Amount as printed: 88000.00 */
  amountText: string;
  note: string;
}

/** Company details frozen onto the agreement when it was created. */
export interface AgreementCompanySnapshot {
  name: string;
  registeredOffice: string;
  phone: string;
  email: string;
  gstn: string;
  logoPath: string;
}

export interface AgreementDocument extends BaseDocument {
  /** Page 1 */
  consumerName: string;
  consumerId: string;
  /** "W/o-dharanidhar Pramanick" */
  relationLine: string;
  /** Free text exactly as printed, including the PIN. */
  address: string;
  discom: string;
  agreementDate: string;
  dateParts?: { day: string; month: string; year: string } | null;

  /** Page 4 */
  amount: number;
  paymentSchedule: AgreementPaymentStage[];

  /** Set when the agreement was created from a quotation. */
  quotation?: { _id: string; quotationNo?: string; customerName?: string } | string | null;
  quotationNo?: string;

  notes?: string;
  companySnapshot?: AgreementCompanySnapshot;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** What the form sends. The split is derived from the amount by the server. */
export interface AgreementPayload {
  consumerName?: string;
  consumerId?: string;
  relationLine?: string;
  address?: string;
  discom?: string;
  agreementDate?: string;
  amount?: number;
  quotation?: string | null;
  notes?: string;
}

export interface AgreementListQuery {
  page?: number;
  limit?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  includeDeleted?: boolean;
  sortBy?: 'agreementDate' | 'createdAt' | 'updatedAt' | 'consumerName' | 'amount';
  sortOrder?: 'asc' | 'desc';
}

/** Fixed values served by GET /agreements/defaults. */
export interface AgreementDefaults {
  discom: string;
  registeredOffice: string;
  companyName: string;
  paymentStages: Array<{ label: string; percent: number; note: string }>;
  relationOptions: string[];
}

export interface AgreementUpdateResult {
  agreement: AgreementDocument;
  changedFields: string[];
}

export interface AgreementDeleteResult {
  agreement: AgreementDocument;
  message: string;
}

/**
 * The 50 / 40 / 10 preview shown in the form before saving.
 * Mirrors the server's rounding, including the last stage taking the remainder
 * so the three amounts always add up to the total.
 */
export const splitAgreementAmount = (
  amount: number,
  stages: Array<{ label: string; percent: number }> = [
    { label: 'a)', percent: 50 },
    { label: 'b)', percent: 40 },
    { label: 'c)', percent: 10 },
  ]
): Array<{ label: string; percent: number; amountText: string }> => {
  const total = Math.round((Number(amount) + Number.EPSILON) * 100) / 100;
  if (!Number.isFinite(total) || total < 0) return [];

  let allocated = 0;

  return stages.map((stage, index) => {
    const isLast = index === stages.length - 1;
    const value = isLast
      ? Math.round((total - allocated + Number.EPSILON) * 100) / 100
      : Math.round(((total * stage.percent) / 100 + Number.EPSILON) * 100) / 100;
    allocated = Math.round((allocated + value + Number.EPSILON) * 100) / 100;

    return { label: stage.label, percent: stage.percent, amountText: value.toFixed(2) };
  });
};

/** "176000" when whole, otherwise "176000.50" - the shape page 4 prints. */
export const formatAgreementTotal = (amount: number): string => {
  const value = Math.round((Number(amount) + Number.EPSILON) * 100) / 100;
  if (!Number.isFinite(value)) return '';
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
};

import axios from 'axios';
import { handleApiError } from './handleApiError';
import type { ApplicationSubmitIssue } from '@/types/application';

/**
 * The error envelope this backend sends (see backend/src/utils/ApiResponse.js):
 *
 *   { success: false, statusCode, error: { code, message, details? } }
 *
 * `details` is free-form per endpoint. For an application submit refusal it is
 * `{ issues: [{ field, message }] }`; for a Joi validation failure it is a flat
 * `{ field: message }` map. Both are normalised here into one list of
 * `{ field, message }` so a screen can render the real reasons instead of
 * "Something went wrong".
 */
export interface ApiErrorDetails {
  /** Human message, from the server when there is one. */
  message: string;
  /** Machine code — e.g. APPLICATION_INCOMPLETE, DOCUMENT_NOT_CLEAR, DUPLICATE_APPLICATION. */
  code: string | null;
  /** Field-level reasons, when the server sent any. */
  issues: ApplicationSubmitIssue[];
  /**
   * The raw `error.details` payload, for callers that need the structured part
   * of a refusal. A duplicate application, for example, carries
   * `{ applicationId, applicationNo }` so the screen can offer to open the
   * existing draft instead of just reporting the clash.
   */
  data: Record<string, unknown>;
}

/**
 * Keys in `error.details` that hold a reference rather than a message. See the
 * matching note in handleApiError.ts.
 */
const NON_MESSAGE_DETAIL_KEYS = new Set([
  'id',
  '_id',
  'applicationId',
  'applicationNo',
  'customerId',
  'agentId',
  'installationId',
  'quotationId',
  'agreementId',
  'documentId',
  'materialId',
  'portalUrl',
  'url',
  'code',
]);

const isIssueList = (value: unknown): value is ApplicationSubmitIssue[] =>
  Array.isArray(value) &&
  value.every(
    (item) => Boolean(item) && typeof item === 'object' && typeof (item as { message?: unknown }).message === 'string'
  );

/** Read the structured details off any API error. Never throws. */
export function readApiErrorDetails(error: unknown): ApiErrorDetails {
  const message = handleApiError(error);

  if (!axios.isAxiosError(error)) {
    return { message, code: null, issues: [], data: {} };
  }

  const data = error.response?.data as
    | { error?: { code?: string; message?: string; details?: unknown }; message?: string }
    | undefined;

  const code = typeof data?.error?.code === 'string' ? data.error.code : null;
  const details = data?.error?.details;
  const issues: ApplicationSubmitIssue[] = [];
  const structured: Record<string, unknown> = {};

  if (details && typeof details === 'object') {
    const nested = (details as { issues?: unknown }).issues;
    if (isIssueList(nested)) {
      nested.forEach((issue) => {
        if (issue.message) issues.push({ field: String(issue.field ?? ''), message: String(issue.message) });
      });
    } else {
      // Flat Joi map: { "address.pincode": "Please enter a valid 6-digit pincode" }
      Object.entries(details as Record<string, unknown>).forEach(([field, value]) => {
        // Identifiers are payload, not messages — they must not become issues.
        if (NON_MESSAGE_DETAIL_KEYS.has(field)) {
          structured[field] = value;
          return;
        }

        if (typeof value === 'string' && value) {
          issues.push({ field, message: value });
        } else if (Array.isArray(value) && typeof value[0] === 'string') {
          issues.push({ field, message: value[0] });
        } else {
          structured[field] = value;
        }
      });
    }
  }

  return { message, code, issues, data: structured };
}

export default readApiErrorDetails;

import axios, { AxiosError } from 'axios';
import { ERROR_MESSAGES } from './errorMessages';
import { ApiError } from './ApiError';

/**
 * Keys in `error.details` that hold a reference or an identifier, never a
 * user-facing sentence. A validation failure puts `{ field: "message" }` there,
 * but other refusals put structured payloads — a duplicate application sends
 * `{ applicationId, applicationNo }`. Those values must never be shown as the
 * error text.
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

export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      const data = axiosError.response.data as
        | {
            message?: string;
            errors?: string[];
            error?: { code?: string; message?: string; details?: unknown };
          }
        | undefined;
      if (data?.message) {
        return data.message;
      }

      const status = axiosError.response.status;
      const isLoginRequest = axiosError.config?.url?.includes('/auth/login');

      if (status === 401) {
        if (isLoginRequest) {
          return ERROR_MESSAGES.invalidCredentials;
        }
        // A 401 from change-password means "that is not your current password",
        // not an expired session, so it falls through to the server wording.
        if (!axiosError.config?.url?.includes('/auth/change-password')) {
          return ERROR_MESSAGES.unauthorized;
        }
      }

      // The backend nests the human message under `error.message` (see
      // backend/src/utils/ApiResponse.js). Without reading it, every refusal —
      // "This agent has 3 application(s) on record", "Email is already
      // registered" — reached the user as a generic "Something went wrong".
      // Validation failures additionally carry per-field details; the first one
      // is more useful than the generic "Validation failed".
      if (data?.error?.message) {
        const details = data.error.details;
        if (details && typeof details === 'object' && !Array.isArray(details)) {
          // `details` is a field -> message map for a Joi failure, but a plain
          // data payload for other refusals — a duplicate application sends
          // { applicationId, applicationNo }. Taking the first value blindly
          // returned the raw id as if it were the message, so the agent saw
          // "6ab7f130..." instead of "An application for this consumer already
          // exists". Skip keys that can only ever carry a reference.
          const firstMessage = Object.entries(details as Record<string, unknown>).find(
            ([key, value]) =>
              !NON_MESSAGE_DETAIL_KEYS.has(key) && typeof value === 'string' && value.trim() !== ''
          )?.[1];

          if (typeof firstMessage === 'string') {
            return firstMessage;
          }
        }
        return data.error.message;
      }

      return data?.errors?.[0] ?? ERROR_MESSAGES.default;
    }

    return axiosError.message || ERROR_MESSAGES.network;
  }

  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return ERROR_MESSAGES.default;
};

import axios, { AxiosError } from 'axios';
import { ERROR_MESSAGES } from './errorMessages';
import { ApiError } from './ApiError';

export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      const data = axiosError.response.data as { message?: string; errors?: string[] } | undefined;
      if (data?.message) {
        return data.message;
      }
      if (axiosError.response.status === 401) {
        return ERROR_MESSAGES.unauthorized;
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

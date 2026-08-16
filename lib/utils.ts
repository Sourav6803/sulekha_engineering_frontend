import axios from 'axios';

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const responseData = (error.response?.data ?? {}) as any;
    return (
      responseData?.message ||
      error.response?.statusText ||
      error.message ||
      'An unknown API error occurred'
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error ?? 'Unknown error');
}

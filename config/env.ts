export interface EnvConfig {
  apiBaseUrl: string;
}

export const env: EnvConfig = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || '/api/v1'
};

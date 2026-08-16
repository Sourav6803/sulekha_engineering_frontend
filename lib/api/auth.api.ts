import type { ApiResponse } from '@/types/api';
import type { AuthLoginPayload, AuthLoginResponse, AuthUser } from '@/types/auth';
import axiosClient from './axiosClient';
import { ENDPOINTS } from './endpoints';

export const authApi = {
  login: (payload: AuthLoginPayload) =>
    axiosClient
      .post<ApiResponse<AuthLoginResponse>>(ENDPOINTS.auth.login, payload)
      .then((response) => response.data),

  getProfile: () =>
    axiosClient
      .get<ApiResponse<AuthUser>>(ENDPOINTS.auth.profile)
      .then((response) => response.data),

  refreshToken: (refreshToken: string) =>
    axiosClient
      .post<ApiResponse<{ accessToken: string; user: AuthUser }>>(ENDPOINTS.auth.refreshToken, { refreshToken })
      .then((response) => response.data),

  logout: () =>
    axiosClient
      .post<ApiResponse<null>>(ENDPOINTS.auth.logout)
      .then((response) => response.data),
};

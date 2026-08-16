import axios, { AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { API_BASE_URL } from '@/config/constants';
import { AuthSession } from '@/lib/auth/session';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = AuthSession.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await axios.post(
      `${API_BASE_URL}${'/auth/refresh-token'}`,
      { refreshToken },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const newAccessToken = response.data?.data?.accessToken;
    if (newAccessToken) {
      const existingUser = AuthSession.getUser();
      AuthSession.setSession(
        {
          accessToken: newAccessToken,
          refreshToken,
        },
        existingUser,
        true
      );
      return newAccessToken;
    }
  } catch {
    AuthSession.clearSession();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  return null;
};

axiosClient.interceptors.request.use(
  (config) => {
    const token = AuthSession.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;

    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        const newToken = await refreshAccessToken();
        isRefreshing = false;

        if (newToken) {
          onRefreshed(newToken);
        }
      }

      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((token) => {
          if (!originalRequest.headers) {
            originalRequest.headers = {};
          }
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(axios(originalRequest));
        });
      });
    }

    return Promise.reject(error);
  }
);

export default axiosClient;

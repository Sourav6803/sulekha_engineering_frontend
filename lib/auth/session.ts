import type { AuthTokens, AuthUser } from '@/types/auth';

const ACCESS_TOKEN_KEY = 'sulekha_access_token';
const REFRESH_TOKEN_KEY = 'sulekha_refresh_token';
const AUTH_USER_KEY = 'sulekha_auth_user';
const ACCESS_TOKEN_COOKIE = 'sulekha_access_token';
const REFRESH_TOKEN_COOKIE = 'sulekha_refresh_token';
const COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

const getCookieValue = (name: string): string | null => {
  if (!isBrowser) return null;
  const cookie = document.cookie.split(';').find((item) => item.trim().startsWith(`${name}=`));
  if (!cookie) return null;
  return decodeURIComponent(cookie.split('=')[1] ?? '');
};

const setCookieValue = (name: string, value: string, maxAge = COOKIE_MAX_AGE_SECONDS) => {
  if (!isBrowser) return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=Lax`;
};

const deleteCookie = (name: string) => {
  if (!isBrowser) return;
  document.cookie = `${name}=; path=/; max-age=0; samesite=Lax`;
};

const getStoredValue = (key: string): string | null => {
  if (!isBrowser) return null;
  return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);
};

const removeStoredValue = (key: string) => {
  if (!isBrowser) return;
  window.localStorage.removeItem(key);
  window.sessionStorage.removeItem(key);
};

const parseJson = <T>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const AuthSession = {
  getAccessToken: (): string | null => {
    if (!isBrowser) return null;
    return getStoredValue(ACCESS_TOKEN_KEY) ?? getCookieValue(ACCESS_TOKEN_COOKIE);
  },

  getRefreshToken: (): string | null => {
    if (!isBrowser) return null;
    return getStoredValue(REFRESH_TOKEN_KEY) ?? getCookieValue(REFRESH_TOKEN_COOKIE);
  },

  getUser: (): AuthUser | null => {
    if (!isBrowser) return null;
    return parseJson<AuthUser>(getStoredValue(AUTH_USER_KEY));
  },

  isAuthenticated: (): boolean => {
    return Boolean(AuthSession.getAccessToken());
  },

  setSession: (tokens: AuthTokens, user: AuthUser | null, persist = true) => {
    if (!isBrowser) return;
    const storage = persist ? window.localStorage : window.sessionStorage;
    storage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    storage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    if (user) {
      storage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    }
    // Mirror tokens into cookies so the proxy middleware (proxy.ts) can
    // authorize protected routes on server-side navigation. Without these,
    // every protected route redirects back to /login right after login.
    setCookieValue(ACCESS_TOKEN_COOKIE, tokens.accessToken);
    setCookieValue(REFRESH_TOKEN_COOKIE, tokens.refreshToken);
  },

  setUser: (user: AuthUser) => {
    if (!isBrowser) return;
    const persist = Boolean(window.localStorage.getItem(ACCESS_TOKEN_KEY));
    const storage = persist ? window.localStorage : window.sessionStorage;
    storage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  },

  clearSession: () => {
    if (!isBrowser) return;
    removeStoredValue(ACCESS_TOKEN_KEY);
    removeStoredValue(REFRESH_TOKEN_KEY);
    removeStoredValue(AUTH_USER_KEY);
    deleteCookie(ACCESS_TOKEN_COOKIE);
    deleteCookie(REFRESH_TOKEN_COOKIE);
  },
};

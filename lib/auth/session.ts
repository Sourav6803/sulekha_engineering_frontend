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

/**
 * Put the two halves of a session back together.
 *
 * A signed-in session lives in two places: the token in storage, which authorises
 * every API call, and a cookie mirror of that same token, which is the only half
 * the edge proxy (proxy.ts) can see. They expire on different clocks — a cookie
 * has a 7-day life, storage has none — so the mirror is regularly lost while the
 * token survives, and nothing but a sign-in ever wrote it back.
 *
 * That disagreement is what makes the browser bounce. /login reads the stored
 * token, believes the visitor is signed in, and sends the document to /dashboard;
 * the proxy finds no cookie, sends it straight back to /login; the fresh document
 * does the same thing again — a reload loop several times a second, which is
 * impossible to type into because each round tears the page down mid-keystroke.
 *
 * So whichever half survived is copied over the missing one, before anything
 * reads `isAuthenticated`. Whether the token is still *valid* is deliberately not
 * judged here: that belongs to the API layer, where a 401 refreshes the session
 * or clears it (see lib/api/axiosClient.ts).
 */
const repairSession = () => {
  if (!isBrowser) return;

  const storedAccess = getStoredValue(ACCESS_TOKEN_KEY);
  const cookieAccess = getCookieValue(ACCESS_TOKEN_COOKIE);

  // Neither half is present: nothing to repair, and no session either way.
  if (!storedAccess && !cookieAccess) return;

  if (storedAccess && !cookieAccess) {
    // The usual case — the cookie expired or was dropped while the token stayed.
    setCookieValue(ACCESS_TOKEN_COOKIE, storedAccess);
    const storedRefresh = getStoredValue(REFRESH_TOKEN_KEY);
    if (storedRefresh) setCookieValue(REFRESH_TOKEN_COOKIE, storedRefresh);
    return;
  }

  if (!storedAccess && cookieAccess) {
    // The mirror outlived storage. It carries the same token, so the session is
    // restored rather than thrown away. `localStorage` is assumed: a
    // sessionStorage-only sign-in cannot be told apart from here, and being
    // signed in for the rest of the browser session is the harmless direction to
    // guess in.
    window.localStorage.setItem(ACCESS_TOKEN_KEY, cookieAccess);
    const cookieRefresh = getCookieValue(REFRESH_TOKEN_COOKIE);
    if (cookieRefresh) window.localStorage.setItem(REFRESH_TOKEN_KEY, cookieRefresh);
  }
};

/**
 * Is the half the proxy authorises on actually present?
 *
 * Guards must ask this before navigating to a protected route: without the cookie
 * the proxy will certainly bounce the request, and a bounce is a document reload.
 */
const hasCookieMirror = (): boolean => {
  if (!isBrowser) return false;
  return Boolean(getCookieValue(ACCESS_TOKEN_COOKIE));
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

  /** See `repairSession` above. Call this before reading `isAuthenticated`. */
  repairSession,

  /** True when the cookie mirror the proxy authorises on is present. */
  hasCookieMirror,

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

/*
 * Repair the pair as soon as this module loads, rather than only when something
 * mounts `useAuth` and calls `hydrate()`.
 *
 * `hydrate()` is guarded by `if (!hydrated)`, and the cross-tab `storage` listener
 * (store/useAuthStore.ts) also sets `hydrated` — so an event arriving before the
 * hook's mount effect would skip the repair entirely and leave the mirror missing,
 * which is the state this fix exists to prevent. Running here is unconditional and
 * happens before any component renders, so the login screen's guard reads a
 * repaired pair on the very first paint.
 */
if (isBrowser) repairSession();

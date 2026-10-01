import { create } from 'zustand';
import { AuthSession } from '@/lib/auth/session';
import type { AuthUser } from '@/types/auth';

/**
 * The signed-in user, in one place.
 *
 * This started as per-component state inside `useAuth()`, which meant the copy in
 * the header and the copy in the dashboard layout were independent. Signing out
 * cleared the header's copy and the tokens on disk, but nothing told the layout —
 * and because the layout had no session check of its own, a client-side navigation
 * back to /dashboard would still render: the router serves a prefetched payload
 * from its cache without asking the server, so the edge proxy never runs and no
 * request is made that could fail with a 401.
 *
 * One shared store fixes the cause: every consumer reads the same `isAuthenticated`,
 * so clearing it on sign-out takes effect everywhere at once.
 *
 * `isAuthenticated` is deliberately about the *token*, not about having a user
 * object. A session restored from the cookie alone (storage cleared, cookie intact)
 * is still a session, and requiring a loaded user here would bounce such a visitor
 * to /login, where the proxy would send them straight back — a loop. The profile
 * arrives a moment later and, if the token turns out to be dead, the fetch clears
 * this state and the guards act.
 */
interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** True once storage has been read, so a guard can tell "signed out" from
   * "not looked yet" and avoid redirecting a signed-in user on first paint. */
  hydrated: boolean;
  setUser: (user: AuthUser | null) => void;
  hydrate: () => void;
  /** Forgets the session everywhere: this store, storage and the cookies. */
  forget: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  hydrated: false,

  setUser: (user) => set({ user, isAuthenticated: AuthSession.isAuthenticated(), hydrated: true }),

  hydrate: () =>
    set({
      user: AuthSession.getUser(),
      isAuthenticated: AuthSession.isAuthenticated(),
      hydrated: true,
    }),

  forget: () => {
    AuthSession.clearSession();
    set({ user: null, isAuthenticated: false, hydrated: true });
  },
}));

/**
 * Signing out in one tab has to sign this one out too.
 *
 * The browser only fires `storage` in the *other* tabs, which is exactly the tab
 * that would otherwise keep a working dashboard open. Nothing is navigated from
 * here: the state change alone makes the guards redirect, which keeps the "who
 * redirects" decision in one place.
 */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', () => {
    const { isAuthenticated } = useAuthStore.getState();
    const present = AuthSession.isAuthenticated();
    if (present === isAuthenticated) return;

    useAuthStore.setState({
      user: present ? AuthSession.getUser() : null,
      isAuthenticated: present,
      hydrated: true,
    });
  });
}

"use client";

import { useEffect, useState } from "react";
import { authApi } from '@/lib/api/auth.api';
import { AuthSession } from '@/lib/auth/session';
import { handleApiError } from '@/lib/errors/handleApiError';
import { useAuthStore } from '@/store/useAuthStore';
import type { AuthLoginPayload } from '@/types/auth';

/**
 * The session, as the UI sees it.
 *
 * State lives in `useAuthStore` so that the header, the guards and the login
 * screen all read the same truth — see that file for why per-component state
 * here turned into a security hole rather than an inconvenience. `loading` and
 * `error` stay local because they describe one call, not the session.
 */
export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hydrated = useAuthStore((state) => state.hydrated);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!useAuthStore.getState().hydrated) {
      useAuthStore.getState().hydrate();
    }
  }, []);

  /**
   * A session is sometimes known only from the cookie (storage cleared, cookie
   * intact). Ask the server who it belongs to; a refusal means the token is dead,
   * so forget it and let the guards send the visitor to the login screen.
   */
  useEffect(() => {
    if (!isAuthenticated || user) return;

    let active = true;

    void authApi
      .getProfile()
      .then((response) => {
        if (active) useAuthStore.getState().setUser(response.data);
      })
      .catch(() => {
        if (active) useAuthStore.getState().forget();
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated, user]);

  const login = async (payload: AuthLoginPayload, persist = true) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authApi.login(payload);
      AuthSession.setSession(response.data, response.data.user, persist);
      useAuthStore.getState().setUser(response.data.user);
      return response;
    } catch (err) {
      const message = handleApiError(err);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);

    try {
      await authApi.logout();
    } catch {
      // Even if logout call fails, clear client session state
    } finally {
      useAuthStore.getState().forget();
      setLoading(false);

      /**
       * A full navigation rather than `router.replace`, to the same destination as
       * before.
       *
       * Signing out has to drop the router's cached payloads for the console: with
       * a client-side navigation they survive, and the next click on a dashboard
       * link renders straight from that cache without asking the server — which is
       * exactly the bug this replaced. The layout guard now catches that path too,
       * so this is the second line of defence rather than the only one.
       */
      window.location.assign('/');
    }
  };

  return {
    user,
    loading,
    error,
    isAuthenticated,
    hydrated,
    login,
    logout,
  };
}

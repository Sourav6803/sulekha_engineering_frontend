"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth.api';
import { AuthSession } from '@/lib/auth/session';
import { handleApiError } from '@/lib/errors/handleApiError';
import type { AuthLoginPayload, AuthUser } from '@/types/auth';

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = useMemo(
    () => Boolean(user) && AuthSession.isAuthenticated(),
    [user],
  );

  useEffect(() => {
    const storedUser = AuthSession.getUser();
    if (storedUser) {
      queueMicrotask(() => setUser(storedUser));
    }
  }, []);

  useEffect(() => {
    if (user || AuthSession.getUser()) return;
    if (!AuthSession.isAuthenticated()) return;

    let active = true;

    void authApi
      .getProfile()
      .then((response) => {
        if (!active) return;
        AuthSession.setUser(response.data);
        setUser(response.data);
      })
      .catch(() => {
        if (!active) return;
        AuthSession.clearSession();
        setUser(null);
      });

    return () => {
      active = false;
    };
  }, [user]);

  const login = async (payload: AuthLoginPayload, persist = true) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authApi.login(payload);
      AuthSession.setSession(response.data, response.data.user, persist);
      setUser(response.data.user);
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
      AuthSession.clearSession();
      setUser(null);
      setLoading(false);
      router.replace('/');
    }
  };

  return {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
  };
}

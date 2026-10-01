"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import DashboardHeader from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { AuthSession } from '@/lib/auth/session';

const CHANGE_PASSWORD_PATH = '/change-password';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, hydrated } = useAuth();

  /**
   * The client-side gate on the whole console.
   *
   * The edge proxy guards navigations that reach the server, but a client-side
   * one can be answered from the router's cache without asking the server at all:
   * after signing out, the console stayed reachable by clicking a "Dashboard"
   * link, and only a refresh (which does reach the server) or a failing request
   * (which the interceptor picks up) put an end to it. So the session is also
   * checked here, where the cache cannot skip it — and `isAuthenticated` comes
   * from a shared store, so signing out anywhere empties it everywhere.
   */
  useEffect(() => {
    if (!hydrated || isAuthenticated) return;
    router.replace('/login');
  }, [hydrated, isAuthenticated, router]);

  /**
   * An admin-created (or admin-reset) account has to set its own password
   * before it can use the console.
   *
   * The stored session is read on every navigation instead of being cached:
   * the change-password screen clears the flag on the stored user, so
   * re-reading is exactly what stops the redirect looping back afterwards.
   * `user` is the fallback for the case where the profile had to be fetched
   * first (no stored user yet on this device).
   */
  useEffect(() => {
    if (!isAuthenticated) return;
    const current = AuthSession.getUser() ?? user;
    if (!current?.mustChangePassword) return;
    if (pathname === CHANGE_PASSWORD_PATH) return;
    router.replace(CHANGE_PASSWORD_PATH);
  }, [user, isAuthenticated, pathname, router]);

  // Render nothing at all rather than the console with a frame of stale data:
  // an unauthenticated visitor must not see the shell before the redirect lands.
  if (!hydrated || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-[var(--muted)]">
        Checking your session…
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <DashboardHeader />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}


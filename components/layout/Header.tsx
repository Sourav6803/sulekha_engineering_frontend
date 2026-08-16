

"use client";

import { useEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSidebarStore } from "@/store/useSidebarStore";
import { useUIStore } from "@/store/useUIStore";
import { BrandMark } from "./Brandmark";
import { NotificationBell } from "./NotificationBell";

export default function Header() {
  const { user, logout } = useAuth();
  const toggleMobileSidebar = useSidebarStore((state) => state.toggleMobile);
  const userMenuOpen = useUIStore((state) => state.userMenuOpen);
  const setUserMenuOpen = useUIStore((state) => state.setUserMenuOpen);

  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userMenuOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
        setConfirmingLogout(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setUserMenuOpen(false);
        setConfirmingLogout(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [userMenuOpen, setUserMenuOpen]);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "SE";

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--header-border)] bg-[var(--header-bg)] shadow-[var(--header-shadow)]">
      <div className="relative flex h-16 items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {/* Mobile-only hamburger */}
          <button
            type="button"
            onClick={toggleMobileSidebar}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[var(--muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <BrandMark />
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <NotificationBell />

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white py-1 pl-1 pr-1 text-sm transition-all hover:border-[var(--primary)] hover:shadow-sm sm:pr-3"
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-tint)] text-xs font-semibold text-[var(--primary-active)]">
                {initials}
              </span>
              <span className="hidden font-medium text-[var(--foreground)] sm:inline">
                {user?.name ?? "Account"}
              </span>
            </button>

             {userMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-[var(--border-soft)] bg-white p-2 shadow-[var(--shadow)]"
              >
                {!confirmingLogout ? (
                  <>
                    <div className="border-b border-[var(--border-soft)] px-3 py-2.5">
                      <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                        {user?.name ?? "Account"}
                      </p>
                      {user?.email && (
                        <p className="truncate text-xs text-[var(--muted)]">{user.email}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfirmingLogout(true)}
                      role="menuitem"
                      className="mt-1 w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[var(--error)] transition-colors hover:bg-[var(--error-tint)]"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <div className="p-2">
                    <p className="px-1 pb-3 text-sm text-[var(--foreground)]">
                      Sign out of Sulekha Engineering?
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          setConfirmingLogout(false);
                          void logout();
                        }}
                        className="brand-button w-full !px-3 !py-2 text-sm"
                      >
                        Yes, sign out
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingLogout(false)}
                        className="neutral-button w-full !px-3 !py-2 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Truck,
  Users,
  Wrench,
  ClipboardList,
  Bell,
  ChevronsLeft,
  ChevronsRight,
  X,
  Sun,
} from "lucide-react";
import { useSidebarStore } from "@/store/useSidebarStore";
// import { BrandMark } from "./Brandmark";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/materials", label: "Materials", icon: Package },
  { href: "/suppliers", label: "Suppliers", icon: Truck },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/installations", label: "Installations", icon: Wrench },
  { href: "/bom-templates", label: "BOM Templates", icon: ClipboardList },
  { href: "/notifications", label: "Notifications", icon: Bell },
] as const;

export default function Sidebar() {
  const pathname = usePathname();
  const isOpen = useSidebarStore((state) => state.isOpen);
  const closeMobile = useSidebarStore((state) => state.closeMobile);
  const isCollapsed = useSidebarStore((state) => state.isCollapsed);
  const toggleCollapsed = useSidebarStore((state) => state.toggleCollapsed);

  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`flex h-full flex-col overflow-y-auto border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] transition-all duration-300 ease-out
          fixed inset-y-0 left-0 z-50 lg:sticky lg:top-0 lg:z-30 lg:translate-x-0 lg:overflow-y-auto
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          ${isCollapsed ? "lg:w-[72px]" : "lg:w-64"}
          w-72`}
      >
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--sidebar-border)] px-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] text-white">
              <Sun className="h-5 w-5" />
            </div>
            <span
              className={`font-display text-base font-semibold text-white transition-opacity duration-200 ${
                isCollapsed ? "lg:hidden" : ""
              }`}
            >
              Sulekha
            </span>
          </div>
          <button
            type="button"
            onClick={closeMobile}
            className="rounded-lg p-1.5 text-[var(--sidebar-text)] transition-colors hover:bg-[var(--sidebar-hover)] hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname?.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                title={isCollapsed ? label : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200
                  ${
                    isActive
                      ? "bg-[var(--sidebar-active)] text-[var(--sidebar-text-active)]"
                      : "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-white"
                  }
                  ${isCollapsed ? "lg:justify-center" : ""}`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className={`truncate transition-opacity duration-200 ${isCollapsed ? "lg:hidden" : ""}`}>
                  {label}
                </span>
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Desktop-only collapse toggle */}
        <div className="hidden shrink-0 border-t border-[var(--sidebar-border)] p-3 lg:block">
          <button
            type="button"
            onClick={toggleCollapsed}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--sidebar-text)] transition-all duration-200 hover:bg-[var(--sidebar-hover)] hover:text-white ${isCollapsed ? "lg:justify-center" : ""}`}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
            <span className={`truncate transition-opacity duration-200 ${isCollapsed ? "lg:hidden" : ""}`}>
              {isCollapsed ? "Expand" : "Collapse"}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}

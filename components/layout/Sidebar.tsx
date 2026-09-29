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
  ClipboardCheck,
  Bell,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  FileText,
  FileSignature,
  ListOrdered,
  UserCog,
  X,
  Sun,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { AuthRole } from "@/types/auth";
import { useSidebarStore } from "@/store/useSidebarStore";
import { useUIStore } from "@/store/useUIStore";
// import { BrandMark } from "./Brandmark";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  /** Roles allowed to see this entry. Omitted = every signed in user. */
  roles?: AuthRole[];
};

type NavGroup = {
  key: string;
  label: string;
  icon: typeof LayoutDashboard;
  children: NavItem[];
  roles?: AuthRole[];
};

type NavEntry = NavItem | NavGroup;

const isGroup = (entry: NavEntry): entry is NavGroup => "children" in entry;

/**
 * The field agent only collects consumer applications, so it sees the
 * dashboard, its applications and notifications — nothing from the office side.
 */
const OFFICE_ROLES: AuthRole[] = [
  'admin',
  'manager',
  'warehouse_staff',
  'installation_team',
  'viewer',
  'administration',
];

/** Applications are shared by the field agents and the roles that oversee them. */
const APPLICATION_ROLES: AuthRole[] = ['admin', 'manager', 'agent'];

/** Agent accounts are created and managed by the admin alone. */
const AGENT_ADMIN_ROLES: AuthRole[] = ['admin'];

/**
 * Quotation sits in its own group with two entries, both reading the same
 * records: the quotation sheet and the SL number register.
 */
const NAV_ENTRIES: NavEntry[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/applications", label: "Applications", icon: ClipboardCheck, roles: APPLICATION_ROLES },
  { href: "/agents", label: "Agents", icon: UserCog, roles: AGENT_ADMIN_ROLES },
  { href: "/materials", label: "Materials", icon: Package, roles: OFFICE_ROLES },
  { href: "/suppliers", label: "Suppliers", icon: Truck, roles: OFFICE_ROLES },
  { href: "/customers", label: "Customers", icon: Users, roles: OFFICE_ROLES },
  { href: "/installations", label: "Installations", icon: Wrench, roles: OFFICE_ROLES },
  {
    key: "quotation",
    label: "Quotation",
    icon: FileText,
    roles: OFFICE_ROLES,
    children: [
      { href: "/quotations", label: "Quotations", icon: FileText },
      { href: "/quotations/serial", label: "Quotation SL Number", icon: ListOrdered },
    ],
  },
  // The consumer agreement (4 page PM Surya Ghar document) has its own menu:
  // it can be raised for a consumer whose quotation is not in the system.
  { href: "/agreements", label: "Agreements", icon: FileSignature, roles: OFFICE_ROLES },
  { href: "/bom-templates", label: "BOM Templates", icon: ClipboardList, roles: OFFICE_ROLES },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const role = user?.role;
  const isOpen = useSidebarStore((state) => state.isOpen);
  const closeMobile = useSidebarStore((state) => state.closeMobile);
  const isCollapsed = useSidebarStore((state) => state.isCollapsed);
  const toggleCollapsed = useSidebarStore((state) => state.toggleCollapsed);
  const expandedNavGroups = useUIStore((state) => state.expandedNavGroups);
  const toggleNavGroup = useUIStore((state) => state.toggleNavGroup);

  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  /**
   * Only the entries this role may reach. Until the signed-in user has been
   * read the full list is shown, which is exactly the previous behaviour.
   */
  const navEntries = role
    ? NAV_ENTRIES.filter((entry) => !entry.roles || entry.roles.includes(role))
    : NAV_ENTRIES;

  /**
   * The most specific matching route wins, so "/quotations/serial" does not
   * light up "/quotations" as well.
   */
  const isRouteActive = (href: string, siblings: NavItem[] = []) => {
    if (pathname === href) return true;
    if (!pathname?.startsWith(`${href}/`)) return false;

    return !siblings.some(
      (sibling) =>
        sibling.href !== href &&
        sibling.href.length > href.length &&
        (pathname === sibling.href || pathname.startsWith(`${sibling.href}/`))
    );
  };

  const itemClasses = (active: boolean) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200
      ${
        active
          ? "bg-[var(--sidebar-active)] text-[var(--sidebar-text-active)]"
          : "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-white"
      }
      ${isCollapsed ? "lg:justify-center" : ""}`;

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
        className={`flex h-full flex-col overflow-y-auto border-r border-[var(--sidebar-border)] sidebar-surface transition-all duration-300 ease-out
          fixed inset-y-0 left-0 z-50 lg:sticky lg:top-16 lg:z-30 lg:h-[calc(100vh-4rem)] lg:translate-x-0 lg:overflow-y-auto
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          ${isCollapsed ? "lg:w-[72px]" : "lg:w-64"}
          w-72`}
      >
        {/* Brand */}
        {/* <div className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--sidebar-border)] px-4">
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
        </div> */}

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navEntries.map((entry) => {
            if (!isGroup(entry)) {
              const active = isRouteActive(entry.href);
              return (
                <Link
                  key={entry.href}
                  href={entry.href}
                  title={isCollapsed ? entry.label : undefined}
                  className={itemClasses(active)}
                >
                  <entry.icon className="h-5 w-5 shrink-0" />
                  <span className={`truncate transition-opacity duration-200 ${isCollapsed ? "lg:hidden" : ""}`}>
                    {entry.label}
                  </span>
                  {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--primary-bright)] shadow-[0_0_8px_rgba(52,196,107,0.8)]" />}
                </Link>
              );
            }

            const childActive = entry.children.some((child) => isRouteActive(child.href, entry.children));
            const expanded = Boolean(expandedNavGroups[entry.key]) || childActive;

            // Collapsed sidebar: show the children as icons so both entries stay reachable.
            if (isCollapsed) {
              return (
                <div key={entry.key} className="space-y-1">
                  {entry.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      title={child.label}
                      className={itemClasses(isRouteActive(child.href, entry.children))}
                    >
                      <child.icon className="h-5 w-5 shrink-0" />
                      <span className="truncate lg:hidden">{child.label}</span>
                    </Link>
                  ))}
                </div>
              );
            }

            return (
              <div key={entry.key} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleNavGroup(entry.key)}
                  aria-expanded={expanded}
                  className={`w-full ${itemClasses(childActive)}`}
                >
                  <entry.icon className="h-5 w-5 shrink-0" />
                  <span className="truncate">{entry.label}</span>
                  <ChevronDown
                    className={`ml-auto h-4 w-4 shrink-0 transition-transform duration-200 ${
                      expanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {expanded && (
                  <div className="space-y-1 border-l border-[var(--sidebar-border)] pl-3">
                    {entry.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all duration-200 ${
                          isRouteActive(child.href, entry.children)
                            ? "bg-[var(--sidebar-active)] text-[var(--sidebar-text-active)]"
                            : "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-white"
                        }`}
                      >
                        <child.icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{child.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
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

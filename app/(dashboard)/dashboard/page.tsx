'use client';

import { useEffect, useState, type ComponentType } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  PackageX,
  ShieldCheck,
  Sun,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react';
import { toast } from 'sonner';
import { materialsApi } from '@/lib/api/materials.api';
import { installationsApi } from '@/lib/api/installations.api';
import { customersApi } from '@/lib/api/customers.api';
import { purchasesApi } from '@/lib/api/purchases.api';
import { AgentDashboard } from '@/components/features/agent/AgentDashboard';
import { installationStatusStyle } from '@/components/features/installations/installationStatus';
import { useAuth } from '@/hooks/useAuth';
import type { MaterialSummary, MaterialDocument } from '@/types/material';
import type { InstallationDocument } from '@/types/installation';
import type { PurchaseDocument } from '@/types/purchase';

const PM_SURYAAHAR_NEWS = [
  {
    id: '1',
    title: 'PM Surya Ghar Muft Bijli Yojana Extended',
    date: '2026-08-10',
    summary: 'Government extends free electricity scheme with enhanced subsidies for rooftop solar installations.',
    source: 'Ministry of New & Renewable Energy',
  },
  {
    id: '2',
    title: 'New Subsidy Rates for Rooftop Solar',
    date: '2026-07-28',
    summary: 'Updated subsidy structure announced for residential rooftop solar systems up to 6 kW capacity.',
    source: 'MNRE Official Notification',
  },
  {
    id: '3',
    title: 'PM Surya Ghar Portal Registration Crosses 1 Crore',
    date: '2026-07-15',
    summary: 'Over 1 crore households register for free electricity scheme across the country.',
    source: 'PIB',
  },
];

const SCHEME_STATS = [
  { label: 'Target households', value: '10 Crore+' },
  { label: 'Free electricity', value: 'Up to 300 units/month' },
  { label: 'Subsidy on solar', value: 'Up to 60%' },
  { label: 'Last date to apply', value: '31 March 2027' },
];

const SCHEME_HIGHLIGHTS = [
  { label: 'Rooftop Solar', tone: 'bg-[var(--primary-tint)] text-[var(--primary-active)]' },
  { label: 'Free Electricity', tone: 'bg-[var(--success-tint)] text-[var(--success)]' },
  // Subsidy is money — the one place the solar-gold accent is allowed to speak.
  { label: '60% Subsidy', tone: 'bg-[var(--accent-tint)] text-[var(--accent)]' },
  { label: 'Clean Energy', tone: 'bg-[var(--success-tint)] text-[var(--success)]' },
];

type MetricCardProps = {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  tone: string;
  chip: string;
};

/**
 * One KPI tile.
 *
 * The label wraps freely but the figure is clamped with
 * `overflow-wrap: anywhere`, so a long value such as "Rs 12,34,56,789" breaks
 * inside the tile instead of spilling past its edge.
 */
function MetricCard({ label, value, icon: Icon, tone, chip }: MetricCardProps) {
  return (
    <div className="panel p-4 transition-shadow duration-200 hover:shadow-[var(--shadow-card-hover)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 text-[11px] font-semibold uppercase leading-4 tracking-[0.12em] text-[var(--muted)]">
          {label}
        </p>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.65rem] ${chip}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className={`mt-3 text-2xl font-semibold leading-none tabular-nums [overflow-wrap:anywhere] ${tone}`}>
        {value}
      </p>
    </div>
  );
}

/**
 * /dashboard is role aware. A field agent gets their own applications dashboard
 * (AgentDashboard); admin, manager and every other office role keep the
 * dashboard below. Deliberately one route, not two.
 */
export default function DashboardPage() {
  const { user } = useAuth();

  // Wait until the signed-in user is known before choosing. Rendering the office
  // dashboard first would fire five requests an agent is not authorised for.
  if (!user) {
    return (
      <main className="canvas-warm min-h-screen px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-7">
        <div className="mx-auto max-w-7xl space-y-4">
          <div className="skeleton h-28 w-full rounded-[1.25rem]" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((card) => (
              <div key={card} className="skeleton h-24 w-full rounded-[1.25rem]" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (user.role === 'agent') {
    return <AgentDashboard user={user} />;
  }

  return <OfficeDashboard />;
}

/** The office dashboard: stock, installations, purchases and the scheme notes. */
function OfficeDashboard() {
  const [summary, setSummary] = useState<MaterialSummary | null>(null);
  const [recentInstallations, setRecentInstallations] = useState<InstallationDocument[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [purchases, setPurchases] = useState<PurchaseDocument[]>([]);
  const [lowStock, setLowStock] = useState<MaterialDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      try {
        const [summaryRes, installationsRes, customersRes, purchasesRes, lowStockRes] = await Promise.all([
          materialsApi.getSummary(),
          installationsApi.list({ limit: 5, sortBy: 'installDate', sortOrder: 'desc' }),
          customersApi.list({ limit: 1 }),
          purchasesApi.list({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
          materialsApi.getLowStock(),
        ]);

        if (!active) return;

        setSummary(summaryRes.data);
        setRecentInstallations(Array.isArray(installationsRes.data) ? installationsRes.data : []);
        setTotalCustomers(customersRes.pagination?.total ?? 0);
        setPurchases(Array.isArray(purchasesRes.data) ? purchasesRes.data : []);
        setLowStock(Array.isArray(lowStockRes.data) ? lowStockRes.data.slice(0, 5) : []);
      } catch (err) {
        toast.error('Failed to load dashboard data');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const pendingInstallations = recentInstallations.filter(i => i.status === 'pending_quotation' || i.status === 'quoted').length;
  const completedInstallations = recentInstallations.filter(i => i.status === 'completed').length;
  const pendingPurchases = purchases.filter(p => p.status === 'pending' || p.status === 'processing').length;

  return (
    <main className="canvas-warm min-h-screen px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-7">
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-5">
        {/* Hero - a slim welcome banner rather than a deep panel, so the
            operational numbers below stay near the fold. */}
        <header className="panel relative overflow-hidden p-5 sm:p-6">
          <span aria-hidden="true" className="accent-bar absolute inset-y-0 left-0 w-1" />
          <img
            src="/sulekha_engineering_logo.jpeg"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -right-6 -top-8 h-40 w-40 object-contain opacity-[0.06]"
          />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--primary-active)]">
                PM Surya Ghar Vendor Portal
              </p>
              <h1 className="text-2xl font-semibold leading-tight text-[var(--foreground)]">
                Sulekha Engineering Dashboard
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">
                Manage installations, inventory and customer records for the PM Surya Ghar Muft Bijli Yojana.
              </p>
              <ul className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-0.5 text-xs text-[var(--muted-soft)]">
                <li className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-[var(--success)]" />
                  Registered vendor
                </li>
                <li aria-hidden="true" className="text-[var(--border)]">•</li>
                <li className="inline-flex items-center gap-1.5">
                  <Sun className="h-3.5 w-3.5 text-[var(--primary)]" />
                  Rooftop solar up to 6 kW
                </li>
                <li aria-hidden="true" className="text-[var(--border)]">•</li>
                <li className="inline-flex items-center gap-1.5">
                  <CalendarClock className="h-3.5 w-3.5 text-[var(--secondary)]" />
                  Applications open until 31 Mar 2027
                </li>
              </ul>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Link href="/installations/new" className="brand-button px-4 py-2.5">
                New installation
              </Link>
              <Link href="/purchases" className="neutral-button px-4 py-2.5">
                Purchase request
              </Link>
            </div>
          </div>
        </header>

        {/* KPI tiles — compact, overflow-proof */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total customers"
            value={loading ? '…' : formatNumber(totalCustomers)}
            icon={Users}
            tone="text-[var(--foreground)]"
            chip="bg-[var(--primary-tint)] text-[var(--primary-active)]"
          />
          <MetricCard
            label="Pending installations"
            value={loading ? '…' : formatNumber(pendingInstallations)}
            icon={Wrench}
            tone="text-[var(--primary)]"
            chip="bg-[var(--primary-tint)] text-[var(--primary-active)]"
          />
          <MetricCard
            label="Stock value"
            value={loading ? '…' : summary ? `₹${formatNumber(summary.totalStockValue)}` : '₹0'}
            icon={TrendingUp}
            tone="text-[var(--foreground)]"
            chip="bg-[var(--success-tint)] text-[var(--success)]"
          />
          <MetricCard
            label="Low stock items"
            value={loading ? '…' : formatNumber(summary?.lowStockCount ?? 0)}
            icon={AlertTriangle}
            tone="text-[var(--error)]"
            chip="bg-[var(--error-tint)] text-[var(--error)]"
          />
        </div>

        {/* Main content */}
        <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr] xl:gap-5">
          {/* Left column */}
          <div className="min-w-0 space-y-4 xl:space-y-5">
            {/* Recent installations */}
            <section className="panel overflow-hidden p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-[var(--foreground)]">Recent installations</h2>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {loading
                      ? 'Loading latest field updates…'
                      : `${completedInstallations} completed • ${pendingPurchases} purchase request${pendingPurchases === 1 ? '' : 's'} open`}
                  </p>
                </div>
                <Link href="/installations" className="neutral-button px-4 py-2">
                  View all
                </Link>
              </div>

              <div className="mt-4 overflow-x-auto">
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="skeleton h-12 w-full rounded-[1rem]" />
                    ))}
                  </div>
                ) : recentInstallations.length === 0 ? (
                  <div className="py-10 text-center text-[var(--muted)]">
                    <Wrench className="mx-auto h-9 w-9 opacity-40" />
                    <p className="mt-2 text-sm">No installations yet</p>
                  </div>
                ) : (
                  <table className="w-full border-separate border-spacing-y-2 text-left text-sm">
                    <tbody>
                      {recentInstallations.map((row) => (
                        <tr key={row._id} className="rounded-[1rem] border border-[var(--border-soft)] bg-[var(--surface)]">
                          <td className="max-w-[7.5rem] px-3 py-3 font-semibold text-[var(--foreground)] sm:max-w-[13rem]">
                            <span className="block truncate">{row.customerNameSnapshot || 'Installation'}</span>
                          </td>
                          {/* Phone and date are hidden on phones so the row fits
                              without horizontal scrolling; the full row is on
                              the installations page. */}
                          <td className="hidden whitespace-nowrap px-3 py-3 tabular-nums text-[var(--muted)] sm:table-cell">
                            {row.customerPhoneSnapshot || '—'}
                          </td>
                          <td className="hidden whitespace-nowrap px-3 py-3 text-[var(--muted)] sm:table-cell">
                            {row.installDate ? new Date(row.installDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                          </td>
                          <td className="px-3 py-3">
                            {(() => {
                              const s = installationStatusStyle(row.status);
                              return <span className={`badge-pill ${s.className}`}>{s.label}</span>;
                            })()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            {/* PM Surya Ghar scheme info */}
            <section className="panel overflow-hidden p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-3">
                <img
                  src="/sulekha_engineering_logo.jpeg"
                  alt=""
                  className="h-9 w-9 shrink-0 rounded-full object-contain"
                  width={36}
                  height={36}
                />
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-[var(--foreground)]">PM Surya Ghar Muft Bijli Yojana</h2>
                  <p className="text-xs text-[var(--muted)]">Government of India initiative</p>
                </div>
              </div>

              {/* Two columns on a phone, four once there is room. Values wrap
                  inside their box rather than stretching it. */}
              <div className="mb-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                {SCHEME_STATS.map((stat) => (
                  <div
                    key={stat.label}
                    className="min-w-0 rounded-[1rem] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-3"
                  >
                    {/* Label first: it is always one line, so the labels stay
                        aligned across the row. A value that wraps to two lines
                        then simply extends downwards. */}
                    <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">{stat.label}</p>
                    <p className="mt-1 text-lg font-semibold leading-snug text-[var(--primary-active)] [overflow-wrap:anywhere]">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-[1rem] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4">
                <h3 className="text-sm font-semibold text-[var(--foreground)]">About the scheme</h3>
                <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
                  PM Surya Ghar Muft Bijli Yojana aims to provide free electricity up to 300 units per month
                  to households through rooftop solar installations. Under this scheme, beneficiaries receive
                  central financial assistance of up to 60% for systems up to 6 kW capacity. The scheme also
                  enables solar panel manufacturing, creates jobs, and promotes clean energy adoption across India.
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {SCHEME_HIGHLIGHTS.map((tag) => (
                    <span key={tag.label} className={`badge-pill ${tag.tone}`}>
                      {tag.label}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Right column */}
          <aside className="min-w-0 space-y-4 xl:space-y-5">
            {/* Stock alerts */}
            <section className="panel p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <PackageX className="h-4 w-4 shrink-0 text-[var(--error)]" />
                <h2 className="text-base font-semibold text-[var(--foreground)]">Stock alerts</h2>
              </div>
              <p className="mt-1 text-xs text-[var(--muted)]">Prioritize procurement for the next installation cycle.</p>

              <div className="mt-4 space-y-2">
                {loading ? (
                  [1, 2, 3].map(i => (
                    <div key={i} className="skeleton h-12 w-full rounded-[1rem]" />
                  ))
                ) : lowStock.length === 0 ? (
                  <p className="text-xs text-[var(--muted)]">All materials are adequately stocked.</p>
                ) : (
                  lowStock.map((item) => (
                    <div
                      key={item._id}
                      className="flex items-center justify-between gap-3 rounded-[1rem] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--foreground)]">{item.name}</p>
                        <p className="mt-0.5 text-xs tabular-nums text-[var(--muted)]">
                          {item.currentStock} / {item.minimumStockLevel} {item.unit}
                        </p>
                      </div>
                      <span className="badge-pill shrink-0 bg-[rgba(183,43,40,0.12)] text-[var(--error)]">Low</span>
                    </div>
                  ))
                )}
              </div>

              <Link
                href="/materials?lowStock=true"
                className="mt-3 block text-center text-xs font-semibold text-[var(--primary-active)] hover:underline"
              >
                View all low stock items
              </Link>
            </section>

            {/* News & updates */}
            <section className="panel p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 shrink-0 text-[var(--primary)]" />
                <h2 className="text-base font-semibold text-[var(--foreground)]">PM Surya Ghar updates</h2>
              </div>
              <div className="mt-4 space-y-2.5">
                {PM_SURYAAHAR_NEWS.map((news) => (
                  <article
                    key={news.id}
                    className="min-w-0 rounded-[1rem] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-3"
                  >
                    <p className="text-sm font-semibold leading-snug text-[var(--foreground)]">{news.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--muted)]">{news.summary}</p>
                    <p className="mt-1.5 text-[11px] text-[var(--muted-soft)]">
                      {news.source} • {new Date(news.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            {/* Quick actions */}
            <section className="panel p-4 sm:p-5">
              <h2 className="text-base font-semibold text-[var(--foreground)]">Quick actions</h2>
              <div className="mt-3 grid gap-2">
                <Link href="/quotations" className="neutral-button w-full px-4 py-2.5 text-center">
                  Create a quotation
                </Link>
                <Link href="/installations" className="neutral-button w-full px-4 py-2.5 text-center">
                  View installations
                </Link>
                <Link href="/materials" className="neutral-button w-full px-4 py-2.5 text-center">
                  Manage stock
                </Link>
              </div>
            </section>
          </aside>
        </div>

        <footer className="flex flex-col gap-1 px-1 pb-2 text-[11px] text-[var(--muted-soft)] sm:flex-row sm:items-center sm:justify-between">
          <p>Sulekha Engineering • PM Surya Ghar registered vendor • +91 98321 17393</p>
          <p>Figures shown are for the current cycle.</p>
        </footer>
      </div>
    </main>
  );
}

function formatNumber(value: number | string | undefined): string {
  if (value == null) return '0';
  const numeric = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(numeric)) return '0';
  return new Intl.NumberFormat('en-IN').format(numeric);
}

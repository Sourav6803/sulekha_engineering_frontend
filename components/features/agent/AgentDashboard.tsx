'use client';

import { useEffect, useState, type ComponentType } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileSignature,
  FileText,
  Plus,
  Users,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { useApplications } from '@/hooks/useApplications';
import { formatDateShort, formatINR, formatNumber } from '@/lib/format';
import {
  APPLICATION_SITE_TYPE_LABEL,
  siteTypeLabelsFromChecklist,
  statusMetaFromChecklist,
} from '@/components/features/applications/applicationDisplay';
import { applicationStatusBadgeFor } from '@/components/features/applications/ApplicationStatusBadge';
import type { AuthUser } from '@/types/auth';
import type { ApplicationChecklist, ApplicationStats } from '@/types/application';

type MetricCardProps = {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  tone: string;
  chip: string;
};

/**
 * One KPI tile. The label wraps freely and the figure is clamped with
 * `overflow-wrap: anywhere`, so even "₹1,23,45,678" breaks inside the tile
 * instead of spilling past its edge.
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
 * The field agent's own dashboard, rendered on /dashboard instead of the office
 * dashboard. Every number comes from GET /applications/stats, which the server
 * scopes to this agent's own applications.
 */
export function AgentDashboard({ user }: { user: AuthUser }) {
  const { fetchStats, fetchChecklist } = useApplications();
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [checklist, setChecklist] = useState<ApplicationChecklist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const [statsRes, checklistRes] = await Promise.all([fetchStats(), fetchChecklist()]);
        if (!active) return;
        if (!statsRes) {
          toast.error('Failed to load your dashboard');
          return;
        }
        setStats(statsRes);
        setChecklist(checklistRes);
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [fetchStats, fetchChecklist]);

  const statusMeta = statusMetaFromChecklist(checklist?.statuses);
  const siteTypeLabels = siteTypeLabelsFromChecklist(checklist?.siteTypes);
  const recent = stats?.recentApplications ?? [];
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'there';

  return (
    <main className="canvas-warm min-h-screen px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-7">
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-5">
        {/* Welcome + the one action that matters on this screen */}
        <header className="panel relative overflow-hidden p-5 sm:p-6">
          <span aria-hidden="true" className="accent-bar absolute inset-y-0 left-0 w-1" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--primary-active)]">
                Field agent
              </p>
              <h1 className="truncate text-2xl font-semibold leading-tight text-[var(--foreground)]">
                Namaste, {firstName}
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">
                Your consumer applications, quotations and agreements at a glance.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Link
                href="/applications/new"
                className="brand-button inline-flex items-center gap-1.5 px-4 py-2.5"
              >
                <Plus className="h-4 w-4" /> New consumer application
              </Link>
              <Link href="/applications" className="neutral-button px-4 py-2.5">
                My applications
              </Link>
            </div>
          </div>
        </header>

        {/* KPI tiles — compact, overflow-proof */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Consumers dealt with"
            value={loading ? '…' : formatNumber(stats?.uniqueConsumers)}
            icon={Users}
            tone="text-[var(--foreground)]"
            chip="bg-[var(--primary-tint)] text-[var(--primary-active)]"
          />
          <MetricCard
            label="Total applications"
            value={loading ? '…' : formatNumber(stats?.totalApplications)}
            icon={FileText}
            tone="text-[var(--foreground)]"
            chip="bg-[var(--primary-tint)] text-[var(--primary-active)]"
          />
          <MetricCard
            label="Quotations issued"
            value={loading ? '…' : formatNumber(stats?.quotationsIssued)}
            icon={FileSignature}
            tone="text-[var(--success)]"
            chip="bg-[var(--success-tint)] text-[var(--success)]"
          />
          <MetricCard
            label="Agreements issued"
            value={loading ? '…' : formatNumber(stats?.agreementsIssued)}
            icon={CheckCircle2}
            tone="text-[var(--success)]"
            chip="bg-[var(--success-tint)] text-[var(--success)]"
          />
          <MetricCard
            label="Pending review"
            value={loading ? '…' : formatNumber(stats?.pendingReview)}
            icon={Clock}
            tone="text-[var(--primary)]"
            chip="bg-[var(--primary-tint)] text-[var(--primary-active)]"
          />
          <MetricCard
            label="Needs correction"
            value={loading ? '…' : formatNumber(stats?.needsCorrection)}
            icon={AlertTriangle}
            tone="text-[var(--warning)]"
            chip="bg-[var(--warning-tint)] text-[var(--warning)]"
          />
          <MetricCard
            label="Total proposal value"
            value={loading ? '…' : `₹${formatINR(stats?.totalProposalValue)}`}
            icon={Wallet}
            tone="text-[var(--foreground)]"
            chip="bg-[var(--surface-muted)] text-[var(--secondary)]"
          />
        </div>

        {/* Recent applications */}
        <section className="panel overflow-hidden p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-[var(--foreground)]">Recent applications</h2>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {loading
                  ? 'Loading your latest filings…'
                  : `${formatNumber(stats?.pendingReview)} awaiting review • ${formatNumber(stats?.needsCorrection)} sent back for correction`}
              </p>
            </div>
            <Link href="/applications" className="neutral-button px-4 py-2 text-sm">
              View all
            </Link>
          </div>

          <div className="mt-4 overflow-x-auto">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((row) => (
                  <div key={row} className="skeleton h-12 w-full rounded-[1rem]" />
                ))}
              </div>
            ) : recent.length === 0 ? (
              <div className="py-10 text-center text-[var(--muted)]">
                <FileText className="mx-auto h-9 w-9 opacity-40" />
                <p className="mt-2 text-sm">No applications yet</p>
                <Link
                  href="/applications/new"
                  className="brand-button mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-sm"
                >
                  <Plus className="h-4 w-4" /> Start a consumer application
                </Link>
              </div>
            ) : (
              <table className="w-full border-separate border-spacing-y-2 text-left text-sm">
                <tbody>
                  {recent.map((row) => (
                    <tr key={row._id} className="rounded-[1rem] border border-[var(--border-soft)] bg-[var(--surface)]">
                      <td className="px-3 py-3">
                        <span className="block max-w-[7rem] truncate font-mono text-xs text-[var(--muted)]">
                          {row.applicationNo}
                        </span>
                        <span className="mt-0.5 block max-w-[9rem] truncate font-semibold text-[var(--foreground)] sm:max-w-[14rem]">
                          {row.consumerName}
                        </span>
                      </td>
                      {/* Site and date are hidden on phones so the row fits without
                          a horizontal scroll; the full row is on /applications. */}
                      <td className="hidden whitespace-nowrap px-3 py-3 text-[var(--muted)] sm:table-cell">
                        {row.siteType ? siteTypeLabels[row.siteType] ?? APPLICATION_SITE_TYPE_LABEL[row.siteType] : '—'}
                      </td>
                      <td className="hidden whitespace-nowrap px-3 py-3 tabular-nums text-[var(--muted)] sm:table-cell">
                        {row.deal?.systemSizeKW != null ? `${row.deal.systemSizeKW} kW` : '—'}
                      </td>
                      <td className="hidden whitespace-nowrap px-3 py-3 text-[var(--muted)] md:table-cell">
                        {row.createdAt ? formatDateShort(row.createdAt) : '—'}
                      </td>
                      <td className="px-3 py-3">{applicationStatusBadgeFor(row.status, statusMeta)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <footer className="flex flex-col gap-1 px-1 pb-2 text-[11px] text-[var(--muted-soft)] sm:flex-row sm:items-center sm:justify-between">
          <p>Sulekha Engineering • PM Surya Ghar registered vendor</p>
          <p>Figures cover the applications filed under your account.</p>
        </footer>
      </div>
    </main>
  );
}

export default AgentDashboard;

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CalendarDays, CheckCircle2, Loader2, Wrench } from 'lucide-react';
import { installationsApi, type InstallationDashboardData } from '@/lib/api/installations.api';
interface InstallationDashboardProps {
  /** Only the greeting uses this, so it stays a shape rather than the auth type. */
  user: { name?: string; role?: string };
}

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

/**
 * The installation department's board.
 *
 * The crew does not work from counters — it works from a list it can open on a
 * phone, in the order it will drive. So the top row is four numbers, and below
 * them are the jobs themselves, with the one thing that stops a job closing
 * ("3 evidence items missing") written on the row instead of hidden behind a tap.
 */
export function InstallationDashboard({ user }: InstallationDashboardProps) {
  const [data, setData] = useState<InstallationDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await installationsApi.dashboard();
      setData(response.data);
    } catch {
      setError('Could not load the installation board.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const mine = data?.scope === 'mine';

  const cards = [
    {
      label: mine ? 'My active jobs' : 'Active jobs',
      value: data?.counts.active ?? 0,
      icon: Wrench,
      tone: 'text-[var(--primary)]',
    },
    {
      label: 'Scheduled today',
      value: data?.counts.today ?? 0,
      icon: CalendarDays,
      tone: 'text-[var(--primary)]',
    },
    {
      label: 'Evidence pending',
      value: data?.counts.evidencePending ?? 0,
      icon: AlertTriangle,
      tone: 'text-[var(--warning)]',
    },
    {
      label: 'Completed this month',
      value: data?.counts.completedThisMonth ?? 0,
      icon: CheckCircle2,
      tone: 'text-[var(--success)]',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">
          {mine ? `Your jobs, ${String(user.name || '').split(' ')[0] || 'crew'}` : 'Installation board'}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {mine
            ? 'Only the installations you are assigned to. Tap a job to record panel serials and photos.'
            : 'The whole installation pipeline — every crew, every district.'}
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-[var(--error-tint)] px-3 py-2 text-sm text-[var(--error)]">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="surface-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-soft)]">
                {card.label}
              </span>
              <card.icon className={`h-4 w-4 ${card.tone}`} />
            </div>
            <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
              {loading ? '—' : card.value}
            </p>
          </div>
        ))}
      </div>

      <section className="surface-card p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-[var(--foreground)]">
            {mine ? 'Assigned to you' : 'Coming up'}
          </h2>
          <Link
            href="/installations"
            className="text-xs font-semibold text-[var(--primary-active)] underline-offset-2 hover:underline"
          >
            All installations
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-[var(--muted)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading jobs…
          </div>
        ) : !data || data.jobs.length === 0 ? (
          <p className="mt-3 rounded-lg bg-[var(--surface-muted)] px-3 py-3 text-sm leading-6 text-[var(--muted)]">
            {mine
              ? 'No job is assigned to you yet. The office assigns the crew from the installation page — once you are on a job it appears here.'
              : 'No installation is waiting.'}
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-[var(--border-soft)]">
            {data.jobs.map((job) => (
              <li key={job._id}>
                <Link
                  href={`/installations/${job._id}`}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 transition-colors hover:bg-[var(--surface-muted)]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--foreground)]">
                      {job.consumerName || 'Consumer'}
                    </p>
                    <p className="truncate font-mono text-[11px] text-[var(--muted-soft)]">
                      {job.projectNo || job.installationId}
                      {job.systemSizeKW ? ` • ${job.systemSizeKW} kW` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[var(--muted)]">{formatDate(job.installDate)}</span>
                    {job.gaps > 0 ? (
                      <span className="badge-pill bg-[var(--warning-tint)] text-[var(--warning)]">
                        {job.gaps} missing
                      </span>
                    ) : (
                      <span className="badge-pill badge-success">Documented</span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

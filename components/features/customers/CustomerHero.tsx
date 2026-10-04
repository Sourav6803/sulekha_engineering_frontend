'use client';

import Link from 'next/link';
import {
  CalendarDays,
  IndianRupee,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Ruler,
  Sun,
  Wrench,
  Zap,
} from 'lucide-react';
import { formatDateShort, formatINR, formatNumber } from '@/lib/format';
import { customerStatusStyle, ROOF_TYPE_LABEL } from './customerStatus';
import type { Customer } from '@/types/customer';
import type { CustomerHistorySummary } from '@/lib/api/customers.api';

interface CustomerHeroProps {
  customer: Customer;
  summary: CustomerHistorySummary;
  canEdit: boolean;
  onEdit?: () => void;
}

/**
 * A card's top hairline gradient, handed to CSS through a custom property.
 * Typed as CSSProperties because React's CSS declaration has no index
 * signature for custom properties.
 */
const accent = (gradient: string) => ({ '--card-accent': gradient }) as React.CSSProperties;

/** "Sunita Devi" -> "SD" — for the avatar. Falls back to a dash, never blank. */
function initialsOf(name: string): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
  return letters || '—';
}

const KPI_ACCENTS = {
  installs: 'linear-gradient(90deg, #34C46B 0%, #0B7A3D 100%)',
  capacity: 'linear-gradient(90deg, #2BB3A8 0%, #0F7A5A 100%)',
  value: 'linear-gradient(90deg, #E8B03A 0%, #C98A08 100%)',
  size: 'linear-gradient(90deg, #4A90D9 0%, #1F5FA8 100%)',
} as const;

/**
 * Identity band plus the four headline figures.
 *
 * Split out of CustomerDetailView so that file stays about record-keeping —
 * documents, serials, installations — rather than about presentation.
 */
export function CustomerHero({ customer, summary, canEdit, onEdit }: CustomerHeroProps) {
  const status = customerStatusStyle(customer.status);

  const location = [customer.village, customer.block].filter(Boolean).join(' · ');
  const fullAddress = [customer.address, customer.city, customer.state, customer.pincode]
    .filter(Boolean)
    .join(', ');

  const averageKw = summary.averageSystemSize;

  const kpis = [
    {
      key: 'installs',
      label: 'Installations',
      value: formatNumber(summary.totalInstallations),
      hint: `${formatNumber(summary.completedInstallations)} completed`,
      icon: Wrench,
      wash: 'wash-mint',
      accent: KPI_ACCENTS.installs,
      tile: 'bg-[linear-gradient(140deg,#34C46B_0%,#0B7A3D_100%)]',
    },
    {
      key: 'capacity',
      label: 'Capacity installed',
      value: `${formatNumber(summary.totalSystemCapacity)} kW`,
      hint: averageKw > 0 ? `Average ${formatNumber(averageKw)} kW per site` : 'No installations yet',
      icon: Zap,
      wash: 'wash-teal',
      accent: KPI_ACCENTS.capacity,
      tile: 'bg-[linear-gradient(140deg,#2BB3A8_0%,#0F7A5A_100%)]',
    },
    {
      key: 'value',
      label: 'Total order value',
      value: formatINR(summary.totalCost),
      hint: 'Across every installation on file',
      icon: IndianRupee,
      wash: 'wash-solar',
      accent: KPI_ACCENTS.value,
      tile: 'bg-[linear-gradient(140deg,#E8B03A_0%,#C98A08_100%)]',
    },
    {
      key: 'size',
      label: 'System size',
      value: `${formatNumber(customer.systemSizeKW)} kW`,
      hint: ROOF_TYPE_LABEL[customer.roofType] ?? customer.roofType,
      icon: Ruler,
      wash: 'wash-sky',
      accent: KPI_ACCENTS.size,
      tile: 'bg-[linear-gradient(140deg,#4A90D9_0%,#1F5FA8_100%)]',
    },
  ];

  return (
    <div className="space-y-6">
      {/* .hero-luxe brings both its own entrance rise and its slow gradient
          pan — declared in one `animation` list in globals.css, because a
          second `animation` shorthand here would replace the pan, not join it. */}
      <section className="hero-luxe p-6 sm:p-8">
        {/* Light blooms. Decorative only — the figures above carry the meaning. */}
        <span
          className="orb orb-slow -right-16 -top-24 h-64 w-64"
          style={{ background: 'rgba(52, 196, 107, 0.55)' }}
          aria-hidden="true"
        />
        <span
          className="orb orb-delay -bottom-28 left-1/4 h-56 w-56"
          style={{ background: 'rgba(201, 138, 8, 0.38)' }}
          aria-hidden="true"
        />
        <span className="pointer-events-none absolute -right-6 -top-8 text-white/10" aria-hidden="true">
          <Sun className="h-56 w-56" strokeWidth={1} />
        </span>

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/25 bg-white/15 font-display text-xl font-semibold backdrop-blur-sm">
              {initialsOf(customer.name)}
            </span>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold sm:text-3xl">{customer.name}</h1>
                <span className={`badge-pill ${status.className}`}>{status.label}</span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/85">
                <span className="font-mono text-xs tracking-wide">{customer.customerId}</span>
                {location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {location}
                  </span>
                )}
                {customer.createdAt && (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Customer since {formatDateShort(customer.createdAt)}
                  </span>
                )}
              </div>

              {/* Quick-contact. Only the channels that actually exist — an
                  empty "email" chip would just be noise on most records. */}
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={`tel:${customer.phone}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/12 px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span className="font-mono">{customer.phone}</span>
                </a>
                {customer.email && (
                  <a
                    href={`mailto:${customer.email}`}
                    className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/25 bg-white/12 px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{customer.email}</span>
                  </a>
                )}
                {fullAddress && (
                  <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/25 bg-white/12 px-3.5 py-1.5 text-sm font-medium text-white/90">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{fullAddress}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            {canEdit && onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[var(--primary-active)] shadow-[var(--shadow-sm)] transition-all hover:shadow-[var(--shadow-lg)] active:scale-[0.98]"
              >
                <Pencil className="h-4 w-4" />
                Edit customer
              </button>
            )}
            <Link
              href="/customers"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/15"
            >
              All customers
            </Link>
          </div>
        </div>
      </section>

      {/* Four headline figures, each on its own hue so the row reads as a set
          with rhythm rather than four interchangeable boxes. */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <article
              key={kpi.key}
              className={`card-luxe card-sheen ${kpi.wash} anim-rise p-5`}
              style={{ ...accent(kpi.accent), animationDelay: `${80 + index * 70}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  {kpi.label}
                </p>
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-[var(--shadow-sm)] ${kpi.tile}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-4 font-mono text-2xl font-semibold text-[var(--foreground)] sm:text-[1.75rem]">
                {kpi.value}
              </p>
              <p className="mt-1.5 text-xs text-[var(--muted-soft)]">{kpi.hint}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}

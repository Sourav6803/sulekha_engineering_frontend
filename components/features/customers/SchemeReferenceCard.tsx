'use client';

import { Calculator, Info, Landmark } from 'lucide-react';
import { formatNumber } from '@/lib/format';

interface SchemeReferenceCardProps {
  systemSizeKW: number;
  roofArea?: number;
}

/**
 * Reference copy of the scheme terms, shown to staff on this screen.
 *
 * Kept as data rather than written into the markup so the figures live in one
 * place: both the central subsidy slabs and the loan conditions have moved
 * since the scheme opened, and this card is the thing someone reads out to a
 * customer standing at the counter. Confirm against the latest MNRE / national
 * portal notification before quoting — the footnote on the card says as much,
 * because a stale number here is worse than no card at all.
 */
const SUBSIDY_SLABS = [
  { range: '1st & 2nd kW', amount: '₹30,000 per kW' },
  { range: '3rd kW onward', amount: '₹18,000 per kW' },
  { range: 'Central maximum', amount: '₹78,000' },
];

const LOAN_TERMS = [
  { label: 'Customer contribution', value: '10% of project cost, paid after installation' },
  { label: 'Bank loan', value: 'Up to 90% of project cost' },
  { label: 'Collateral', value: 'Not required up to ₹2 lakh' },
  { label: 'Paperwork', value: 'Handled by us end to end' },
];

/**
 * The vendor's own design figure for a rooftop system in this region, used for
 * the generation estimate below. It is a planning number, not a guarantee —
 * the card labels it as such rather than presenting a projection as a reading.
 */
const UNITS_PER_KW_PER_DAY = 4;

/** Rough roof a kilowatt of panels needs, for the area cross-check. */
const SQFT_PER_KW = 80;

/**
 * Two reference blocks that support a conversation rather than record one:
 * what the system should generate, and the terms of the scheme behind it.
 *
 * Both are read-only. They exist because the questions a customer asks at the
 * counter — "how many units will I get", "how much subsidy", "do I pay it all
 * up front" — were otherwise answered from memory or a printed sheet.
 */
export function SchemeReferenceCard({ systemSizeKW, roofArea }: SchemeReferenceCardProps) {
  const size = typeof systemSizeKW === 'number' && Number.isFinite(systemSizeKW) ? systemSizeKW : 0;

  const dailyUnits = size * UNITS_PER_KW_PER_DAY;
  const monthlyUnits = dailyUnits * 30;
  const yearlyUnits = dailyUnits * 365;

  const requiredRoofArea = size * SQFT_PER_KW;
  const roofIsTight = typeof roofArea === 'number' && roofArea > 0 && roofArea < requiredRoofArea;

  const generation = [
    { label: 'Per day', value: formatNumber(Math.round(dailyUnits)) },
    { label: 'Per month', value: formatNumber(Math.round(monthlyUnits)) },
    { label: 'Per year', value: formatNumber(Math.round(yearlyUnits)) },
  ];

  return (
    <section className="card-luxe wash-solar anim-rise p-6 sm:p-8" style={{ animationDelay: '120ms' }}>
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(140deg,#E8B03A_0%,#C98A08_100%)] text-white shadow-[var(--shadow-sm)]">
          <Landmark className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">PM Surya Ghar — reference</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Scheme terms and expected generation for a {formatNumber(size)} kW system
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Generation estimate */}
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-[var(--accent)]" />
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              Expected generation
            </h3>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3">
            {generation.map((item) => (
              <div
                key={item.label}
                className="rounded-[var(--radius-sm)] border border-[var(--border-soft)] bg-white/80 p-3 text-center"
              >
                <p className="font-mono text-lg font-semibold text-[var(--foreground)]">{item.value}</p>
                <p className="mt-0.5 text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--muted-soft)]">
                  {item.label}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-2 text-xs text-[var(--muted)]">
            Units (kWh) at {UNITS_PER_KW_PER_DAY} units per kW per day — a design estimate, not a
            guarantee. Actual output tracks sunlight, shading and module cleanliness.
          </p>

          {size > 0 && (
            <p
              className={`mt-3 rounded-[var(--radius-sm)] border p-3 text-xs ${
                roofIsTight
                  ? 'border-[var(--error)] bg-[var(--error-tint)] text-[var(--error)]'
                  : 'border-[var(--border-soft)] bg-white/70 text-[var(--muted)]'
              }`}
            >
              <span className="font-semibold text-[var(--foreground)]">Roof check: </span>
              about {formatNumber(requiredRoofArea)} sq ft is needed.
              {typeof roofArea === 'number' && roofArea > 0 ? (
                <> {formatNumber(roofArea)} sq ft is recorded on this customer.</>
              ) : (
                <> No roof area recorded on this customer yet.</>
              )}
              {roofIsTight && <> The recorded area is below the requirement — verify on site.</>}
            </p>
          )}
        </div>

        {/* Scheme terms */}
        <div>
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-[var(--accent)]" />
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              Subsidy & loan
            </h3>
          </div>

          <ul className="mt-3 divide-y divide-[var(--border-soft)] rounded-[var(--radius-sm)] border border-[var(--border-soft)] bg-white/80">
            {SUBSIDY_SLABS.map((slab) => (
              <li key={slab.range} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="text-sm text-[var(--muted)]">{slab.range}</span>
                <span className="text-sm font-semibold text-[var(--foreground)]">{slab.amount}</span>
              </li>
            ))}
          </ul>

          <ul className="mt-3 divide-y divide-[var(--border-soft)] rounded-[var(--radius-sm)] border border-[var(--border-soft)] bg-white/80">
            {LOAN_TERMS.map((term) => (
              <li key={term.label} className="px-4 py-2.5">
                <p className="text-[0.6875rem] uppercase tracking-[0.14em] text-[var(--muted-soft)]">
                  {term.label}
                </p>
                <p className="mt-0.5 text-sm text-[var(--foreground)]">{term.value}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-6 flex items-start gap-2 rounded-[var(--radius-sm)] border border-[var(--border-soft)] bg-white/70 p-3 text-xs text-[var(--muted)]">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          Reference figures — confirm against the latest MNRE / national portal notification before
          quoting them to a customer.
        </span>
      </p>
    </section>
  );
}

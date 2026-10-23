'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Info, Sun, Zap } from 'lucide-react';
import SectionHeading from './SectionHeading';
import type { HomePayload } from '@/types/site';

const inr = (value: number) => `₹${Math.round(value).toLocaleString('en-IN')}`;

type Props = {
  table: HomePayload['savings']['table'];
  assumptions: HomePayload['savings']['assumptions'];
  panel: HomePayload['savings']['panel'];
  subsidy: HomePayload['savings']['subsidy'];
  disclaimer: string;
};

/**
 * The arithmetic, in the visitor's hands.
 *
 * The server sends both the table and the assumptions it was built from, so the
 * slider stays honest at 4.5 kW as well as at the tab sizes — the same three
 * numbers (units per kW, tariff, subsidy slab) drive every figure shown here.
 */
export default function SavingsCalculator({ table, assumptions, panel, subsidy, disclaimer }: Props) {
  const defaultSize = table.find((row) => row.sizeKW === 3)?.sizeKW ?? table[0]?.sizeKW ?? 3;
  const [size, setSize] = useState(defaultSize);
  const [bill, setBill] = useState('');
  /**
   * SC/ST households get a state top-up on top of the central subsidy. Kept as a
   * toggle rather than a separate table: it changes one number on the same card,
   * and a visitor should be able to see both answers without scrolling away.
   */
  const [scSt, setScSt] = useState(false);

  const result = useMemo(() => {
    // Two ends of the generation band, so the card can print a range instead of
    // a single figure that only holds in one month of the year.
    const unitsPerDay = size * assumptions.unitsPerKWPerDay;
    const unitsPerDayMax = size * assumptions.unitsPerKWPerDayMax;
    const unitsPerMonth = unitsPerDay * assumptions.billableDaysPerMonth;
    const unitsPerMonthMax = unitsPerDayMax * assumptions.billableDaysPerMonth;
    const monthlySaving = unitsPerMonth * assumptions.tariffPerUnit;
    const monthlySavingMax = unitsPerMonthMax * assumptions.tariffPerUnit;

    const firstTwo = Math.min(size, 2) * subsidy.perKwFirstTwo;
    const third = size > 2 ? Math.min(size - 2, 1) * subsidy.perKwThird : 0;
    const central = Math.min(firstTwo + third, subsidy.cap);
    const topUp = scSt
      ? Math.min(Math.min(size, subsidy.scStMaxKW) * subsidy.scStPerKw, subsidy.scStCap)
      : 0;

    return {
      unitsPerDay: Math.round(unitsPerDay * 100) / 100,
      unitsPerDayMax: Math.round(unitsPerDayMax * 100) / 100,
      unitsPerMonth: Math.round(unitsPerMonth),
      unitsPerMonthMax: Math.round(unitsPerMonthMax),
      monthlySaving: Math.round(monthlySaving),
      monthlySavingMax: Math.round(monthlySavingMax),
      yearlySaving: Math.round(monthlySaving * 12),
      yearlySavingMax: Math.round(monthlySavingMax * 12),
      centralSubsidy: central,
      topUp,
      subsidyAmount: central + topUp,
      panels: Math.ceil((size * 1000) / panel.wp),
    };
  }, [size, assumptions, subsidy, panel.wp, scSt]);

  /** A bill is usually the only number a visitor knows about their own home. */
  const suggestedSize = useMemo(() => {
    const billValue = Number(bill);
    if (!billValue || billValue <= 0) return null;
    const units = billValue / assumptions.tariffPerUnit;
    const kw = units / assumptions.billableDaysPerMonth / assumptions.unitsPerKWPerDay;
    return Math.min(10, Math.max(1, Math.round(kw * 2) / 2));
  }, [bill, assumptions]);

  return (
    <section id="savings" className="scroll-mt-24 bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Savings calculator"
          title="What will a rooftop system actually save?"
          description="Move the slider to your roof size. Units are an annual average for this region; the tariff is a domestic slab, so your own bill may differ."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2rem] border border-[var(--border-soft)] bg-[var(--background)] p-6 sm:p-8">
            <div className="flex flex-wrap gap-2">
              {table.map((row) => (
                <button
                  key={row.sizeKW}
                  type="button"
                  onClick={() => setSize(row.sizeKW)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    size === row.sizeKW
                      ? 'bg-[var(--primary)] text-white shadow-[var(--shadow-glow)]'
                      : 'bg-white text-[var(--muted)] ring-1 ring-[var(--border)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {row.sizeKW} kW
                </button>
              ))}
            </div>

            <div className="mt-8">
              <div className="flex items-end justify-between">
                <label htmlFor="system-size" className="text-sm font-medium text-[var(--foreground)]">
                  System size
                </label>
                <span className="font-display text-2xl font-semibold text-[var(--primary)]">{size} kW</span>
              </div>
              <input
                id="system-size"
                type="range"
                min={1}
                max={10}
                step={0.5}
                value={size}
                onChange={(event) => setSize(Number(event.target.value))}
                className="mt-3 w-full accent-[var(--primary)]"
              />
              <div className="mt-1 flex justify-between text-[11px] font-medium text-[var(--muted-soft)]">
                <span>1 kW</span>
                <span>5 kW</span>
                <span>10 kW</span>
              </div>
            </div>

            {/* The top-up changes one line of the answer, so it is a checkbox on the
                same card rather than a second table a visitor has to compare. */}
            <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--border-soft)] bg-white p-4">
              <input
                type="checkbox"
                checked={scSt}
                onChange={(event) => setScSt(event.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 accent-[var(--primary)]"
              />
              <span className="text-xs leading-6 text-[var(--muted)]">
                <span className="block text-sm font-semibold text-[var(--foreground)]">SC / ST household</span>
                পশ্চিমবঙ্গে SC/ST পরিবারের জন্য রাজ্য সরকারের অতিরিক্ত ₹5,000 প্রতি কিলোওয়াট (সর্বোচ্চ ৩
                কিলোওয়াট, মোট ₹15,000) — কেন্দ্রীয় ভর্তুকির উপরে যোগ হবে।
              </span>
            </label>

            <div className="mt-6 rounded-2xl border border-[var(--border-soft)] bg-white p-5">
              <label htmlFor="monthly-bill" className="text-sm font-medium text-[var(--foreground)]">
                Or start from your electricity bill
              </label>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2">
                  <span className="text-sm text-[var(--muted-soft)]">₹</span>
                  <input
                    id="monthly-bill"
                    inputMode="numeric"
                    value={bill}
                    onChange={(event) => setBill(event.target.value.replace(/[^\d]/g, ''))}
                    placeholder="e.g. 2500"
                    className="w-28 bg-transparent text-sm outline-none"
                  />
                </div>
                <span className="text-sm text-[var(--muted)]">per month</span>
                {suggestedSize && (
                  <button
                    type="button"
                    onClick={() => setSize(suggestedSize)}
                    className="rounded-full bg-[var(--primary-tint)] px-3 py-1.5 text-xs font-semibold text-[var(--primary-active)]"
                  >
                    Use {suggestedSize} kW
                  </button>
                )}
              </div>
              <p className="mt-2 text-xs leading-6 text-[var(--muted-soft)]">
                At ₹{assumptions.tariffPerUnit} a unit, that bill is about{' '}
                {Math.round(Number(bill || 0) / assumptions.tariffPerUnit) || 0} units a month.
              </p>
            </div>

            <div className="mt-6 flex items-start gap-2.5">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
              <p className="text-xs leading-6 text-[var(--muted)]">
                Indicative: {assumptions.unitsPerKWPerDay}–{assumptions.unitsPerKWPerDayMax} units per kW per day,{' '}
                {assumptions.billableDaysPerMonth} billable days a month, ₹{assumptions.tariffPerUnit} a unit.
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] bg-[var(--sidebar-bg)] p-6 text-white sm:p-8">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(52,196,107,0.35), transparent 70%)' }}
            />
            <div className="relative">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sidebar-text)]">
                Your {size} kW system
              </p>

              <div className="mt-4 flex flex-wrap items-end gap-x-2 gap-y-1">
                <span className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                  {inr(result.monthlySaving)} – {inr(result.monthlySavingMax)}
                </span>
                <span className="pb-1.5 text-sm text-white/70">/ month saved</span>
              </div>
              <p className="mt-1 text-sm text-white/70">
                {inr(result.yearlySaving)} – {inr(result.yearlySavingMax)} over a year, at today&apos;s tariff.
              </p>

              <dl className="mt-7 space-y-3 border-t border-white/10 pt-5 text-sm">
                {[
                  {
                    label: 'Generation',
                    value: `${result.unitsPerDay}–${result.unitsPerDayMax} units / day`,
                    icon: Zap,
                  },
                  { label: 'Per month', value: `${result.unitsPerMonth}–${result.unitsPerMonthMax} units`, icon: Sun },
                  { label: 'Panels needed', value: `${result.panels} × ${panel.wp} Wp`, icon: Sun },
                  {
                    label: result.topUp > 0 ? 'Subsidy (incl. SC/ST)' : 'Central subsidy',
                    value: `${inr(result.subsidyAmount)}`,
                    icon: Info,
                    highlight: true,
                    hint:
                      result.topUp > 0
                        ? `${inr(result.centralSubsidy)} central + ${inr(result.topUp)} state SC/ST top-up`
                        : undefined,
                  },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="flex items-center gap-2 text-white/65">
                        <row.icon className="h-4 w-4" />
                        {row.label}
                      </dt>
                      <dd className={row.highlight ? 'font-semibold text-[var(--accent-tint)]' : 'font-semibold'}>
                        {row.value}
                      </dd>
                    </div>
                    {row.hint && <p className="mt-1 text-[10px] leading-4 text-white/45">{row.hint}</p>}
                  </div>
                ))}
              </dl>

              <div className="mt-6 rounded-2xl bg-white/5 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
                  One panel&apos;s share
                </p>
                <p className="mt-1.5 text-sm leading-6 text-white/85">
                  A single {panel.wp} Wp module makes about{' '}
                  <strong className="font-semibold text-white">{panel.unitsPerDay} units a day</strong> — roughly{' '}
                  {panel.unitsPerMonth} units a month.
                </p>
              </div>

              <Link
                href="/enquiry"
                className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[var(--primary-bright)] px-5 py-3 text-sm font-semibold text-[var(--sidebar-bg)] transition-colors hover:bg-white"
              >
                Get this checked on my roof
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>

              <p className="mt-3 text-[10px] leading-5 text-white/45">{disclaimer}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-[var(--border-soft)]">
          {/* On a phone the six columns cannot fit, so the two that the result card above already states
              (units a month, saving a year) drop out below `sm` instead of being sliced at the edge. */}
          <table className="w-full text-left text-xs sm:min-w-[640px] sm:text-sm">
            <thead className="bg-[var(--surface-muted)] text-[10px] uppercase tracking-[0.08em] text-[var(--muted)] sm:text-[11px] sm:tracking-[0.1em]">
              <tr>
                <th className="px-2.5 py-3 font-semibold sm:px-4">System</th>
                <th className="px-2.5 py-3 font-semibold sm:px-4">Units / day</th>
                <th className="hidden px-2.5 py-3 font-semibold sm:table-cell sm:px-4">Units / month</th>
                <th className="px-2.5 py-3 font-semibold sm:px-4">Saving / month</th>
                <th className="hidden px-2.5 py-3 font-semibold sm:table-cell sm:px-4">Saving / year</th>
                <th className="px-2.5 py-3 font-semibold sm:px-4">Subsidy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-soft)] bg-white">
              {table.map((row) => (
                <tr key={row.sizeKW} className={row.sizeKW === size ? 'bg-[var(--primary-tint)]/40' : undefined}>
                  <td className="whitespace-nowrap px-2.5 py-3 font-semibold text-[var(--foreground)] sm:px-4">{row.sizeKW} kW</td>
                  <td className="whitespace-nowrap px-2.5 py-3 text-[var(--muted)] sm:px-4">
                    {row.unitsPerDay}–{row.unitsPerDayMax}
                  </td>
                  <td className="hidden whitespace-nowrap px-2.5 py-3 text-[var(--muted)] sm:table-cell sm:px-4">
                    {row.unitsPerMonth}–{row.unitsPerMonthMax}
                  </td>
                  <td className="whitespace-nowrap px-2.5 py-3 text-[var(--muted)] sm:px-4">
                    {inr(row.monthlySaving)}–{inr(row.monthlySavingMax)}
                  </td>
                  <td className="hidden whitespace-nowrap px-2.5 py-3 text-[var(--muted)] sm:table-cell sm:px-4">
                    {inr(row.yearlySaving)}–{inr(row.yearlySavingMax)}
                  </td>
                  <td className="whitespace-nowrap px-2.5 py-3 font-semibold text-[var(--accent)] sm:px-4">
                    {inr(scSt ? row.subsidyScSt : row.subsidy)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-[11px] leading-6 text-[var(--muted-soft)]">
          ইউনিটের হিসাব বছরের গড়ে ৪–৫ ইউনিট প্রতি কিলোওয়াট ধরে দেওয়া হয়েছে, তাই দুই প্রান্তে দুই সংখ্যা।
          ভর্তুকির কলামে কেন্দ্রীয় ভর্তুকি দেখানো হয়েছে — SC/ST পরিবারের জন্য উপরের বক্সে টিক দিলে রাজ্যের
          অতিরিক্ত ₹5,000 প্রতি কিলোওয়াট (সর্বোচ্চ ₹15,000) যোগ হয়ে যাবে।
        </p>
      </div>
    </section>
  );
}

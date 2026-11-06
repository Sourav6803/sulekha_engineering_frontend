import Link from 'next/link';
import { ArrowRight, Banknote, BadgeIndianRupee, Percent, ReceiptText } from 'lucide-react';
import SectionHeading from '@/components/site/SectionHeading';
import type { HomePayload } from '@/types/site';

const inr = (value: number) => `₹${value.toLocaleString('en-IN')}`;

/**
 * What the system costs, and what is left to pay once the subsidy lands.
 *
 * This is the question the calculator does not answer: how much money has to
 * leave the customer's account, and when. The ranges come from the API, which
 * derives the subsidy and the net figure from the same slab the calculator uses —
 * so the two sections on this page can never quote different numbers.
 *
 * No EMI figure is shown on purpose: it depends on the tenure the lender agrees,
 * and a monthly number printed here would be a promise the office cannot keep.
 */
export default function CostSection({ cost }: { cost: NonNullable<HomePayload['cost']> }) {
  const { rows, finance, note, financeNote } = cost;
  if (rows.length === 0) return null;

  const facts = [
    { icon: Banknote, value: `${finance.downPaymentPercent}%`, label: 'To book the work' },
    { icon: ReceiptText, value: `${finance.loanPercent}%`, label: 'Bank loan on the rest' },
    { icon: Percent, value: `${finance.interestRate}%`, label: 'Interest, per year' },
    { icon: BadgeIndianRupee, value: finance.collateralFree ? 'Nil' : '—', label: 'Security pledged' },
  ];

  return (
    <section id="cost" className="scroll-mt-24 bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="What it costs"
          title="The price, before and after the subsidy"
          description="A standard residential rooftop, quoted end to end — module, inverter, structure, protection, wiring and net metering. The subsidy is credited to your bank account after installation, so it comes off the price you finally pay."
        />

        {/* Phones get one card per size: a four-column money table cannot be read at 390px. */}
        <div className="mt-8 grid gap-3 sm:hidden">
          {rows.map((row) => (
            <div key={row.sizeKW} className="rounded-2xl border border-[var(--border-soft)] bg-white p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-[var(--foreground)]">{row.sizeKW} kW system</span>
                <span className="text-[11px] uppercase tracking-[0.1em] text-[var(--muted-soft)]">You pay</span>
              </div>
              <p className="mt-1 font-display text-xl font-semibold tracking-tight text-[var(--foreground)]">
                {inr(row.netFrom)} – {inr(row.netTo)}
              </p>
              <dl className="mt-3 space-y-1.5 text-xs">
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--muted)]">Installed price</dt>
                  <dd className="text-[var(--muted)]">
                    {inr(row.priceFrom)} – {inr(row.priceTo)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--muted)]">Central subsidy</dt>
                  <dd className="font-medium text-[var(--primary-active)]">− {inr(row.subsidy)}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>

        <div className="mt-8 hidden overflow-hidden rounded-2xl border border-[var(--border-soft)] sm:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--surface-muted)] text-[11px] uppercase tracking-[0.1em] text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 font-semibold">System</th>
                <th className="px-4 py-3 font-semibold">Installed price</th>
                <th className="px-4 py-3 font-semibold">Central subsidy</th>
                <th className="px-4 py-3 font-semibold">You pay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-soft)] bg-white">
              {rows.map((row) => (
                <tr key={row.sizeKW}>
                  <td className="whitespace-nowrap px-4 py-4 font-semibold text-[var(--foreground)]">
                    {row.sizeKW} kW
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-[var(--muted)]">
                    {inr(row.priceFrom)} – {inr(row.priceTo)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 font-medium text-[var(--primary-active)]">
                    − {inr(row.subsidy)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 font-semibold text-[var(--foreground)]">
                    {inr(row.netFrom)} – {inr(row.netTo)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs leading-6 text-[var(--muted-soft)]">{note}</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map((fact) => (
            <div
              key={fact.label}
              className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4"
            >
              <fact.icon className="h-4 w-4 text-[var(--primary-active)]" />
              <p className="mt-2 font-display text-lg font-semibold tracking-tight text-[var(--foreground)]">
                {fact.value}
              </p>
              <p className="text-[11px] leading-5 text-[var(--muted)]">{fact.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link href="/enquiry" className="brand-button">
            Get this in writing
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <p className="max-w-xl text-xs leading-6 text-[var(--muted)]">{financeNote}</p>
        </div>
      </div>
    </section>
  );
}

import { Fragment } from 'react';
import type { SiteMaterialGroup } from '@/types/site';

/**
 * "What exactly goes on my roof?" — grouped by function, not by catalogue.
 *
 * Each line explains the part in one sentence a non-engineer can follow, because
 * a material list without roles is just a bill of quantities. The three columns
 * are the three questions a customer actually asks: what is it, what will you fit,
 * and why do I need it.
 *
 * Below `sm` the table becomes stacked rows. A three-column table on a phone is
 * either unreadably small or scrolls sideways, and sideways scroll is where a
 * pricing page loses the reader.
 */
export default function MaterialsSection({ groups }: { groups: SiteMaterialGroup[] }) {
  if (groups.length === 0) return null;

  return (
    <section id="materials" className="scroll-mt-24 bg-[var(--surface)] py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--surface)]">
          <div
            className="flex flex-col gap-3 border-b border-[var(--border-soft)] px-6 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-7"
            style={{ background: 'linear-gradient(180deg, #F7F9F0, #FFFEF9)' }}
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
                Bill of material · বিল অফ ম্যাটেরিয়াল
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-[1.7rem]">
                Every part, and what it does
              </h2>
            </div>
            <p className="max-w-sm text-[11.5px] leading-6 text-[var(--muted)]">
              Indicative specification for a typical rooftop. The sizes and makes on your own quotation override this
              table wherever they differ.
            </p>
          </div>

          {/* Desktop: the table. */}
          <div className="hidden sm:block">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#FBFCF5]">
                  {['Item', 'What we fit (indicative)', 'Why it matters'].map((heading) => (
                    <th
                      key={heading}
                      className="border-b border-[var(--border-soft)] px-7 py-3 text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--muted-soft)]"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <Fragment key={group.group}>
                    <tr>
                      <td
                        colSpan={3}
                        className="border-b border-[var(--border-soft)] bg-[var(--primary-tint)]/35 px-7 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--primary-active)]"
                      >
                        {group.group}
                      </td>
                    </tr>
                    {group.items.map((item) => (
                      <tr key={`${group.group}-${item.name}`} className="transition-colors hover:bg-[#FBFCF4]">
                        <td className="w-[22%] border-b border-[#F2F4EC] px-7 py-3.5 align-top text-[12.5px] font-bold text-[var(--primary)]">
                          {item.name}
                        </td>
                        <td className="w-[44%] border-b border-[#F2F4EC] px-7 py-3.5 align-top text-[12.5px] leading-6 text-[#364D40]">
                          {item.note || item.role}
                        </td>
                        <td className="border-b border-[#F2F4EC] px-7 py-3.5 align-top text-[12px] leading-6 text-[var(--muted)]">
                          {item.note ? item.role : '—'}
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phone: the same rows, stacked with their own labels. */}
          <div className="sm:hidden">
            {groups.map((group) => (
              <div key={`m-${group.group}`}>
                <p className="border-y border-[var(--border-soft)] bg-[var(--primary-tint)]/35 px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--primary-active)]">
                  {group.group}
                </p>
                <ul>
                  {group.items.map((item) => (
                    <li key={`${group.group}-m-${item.name}`} className="border-b border-[#F2F4EC] px-5 py-4">
                      <p className="text-[13px] font-bold text-[var(--primary)]">{item.name}</p>
                      <p className="mt-1 text-[12.5px] leading-6 text-[#364D40]">{item.note || item.role}</p>
                      {item.note && <p className="mt-1 text-[11.5px] leading-6 text-[var(--muted)]">{item.role}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

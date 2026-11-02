import { Fragment } from 'react';
import SectionHeading from './SectionHeading';
import type { SiteMaterialGroup } from '@/types/site';

/**
 * "What exactly goes on my roof?" — the bill of material, grouped by function.
 *
 * The rows come from the supplied 4 kW RCC-rooftop BOM, so they keep the sheet's
 * own item names, section codes and sizes. Nothing here is invented: if the sheet
 * has no figure for a row, the cell stays empty rather than being filled with a
 * plausible-looking number.
 *
 * The four columns are the four questions a customer actually asks: what is it,
 * what size, how many, and is there a caveat. Below `sm` the table becomes
 * stacked rows — a four-column table on a phone either shrinks below reading size
 * or scrolls sideways, and sideways scroll is where a pricing page loses people.
 */
export default function MaterialsSection({ groups }: { groups: SiteMaterialGroup[] }) {
  if (groups.length === 0) return null;

  const total = groups.reduce((count, group) => count + group.items.length, 0);

  return (
    <section id="materials" className="scroll-mt-24 bg-[var(--surface)] py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-end gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <SectionHeading eyebrow="What we install · Built on the details" title="Every part. A clear purpose." />
          <p className="max-w-md text-sm leading-7 text-[var(--muted)] lg:pb-1">
            A solar system is more than panels. These are the materials customers ask about most, with the codes and
            sizes from your supplied BOM and a plain-language note on each.
          </p>
        </div>

        {/* The scope of the sheet matters more than any single row: it is one roof,
            and half its quantities were never filled in. */}
        <div className="mt-7 flex gap-3 rounded-[16px] border border-[#EBDDB4] bg-[#FBF4E2] px-4 py-3.5 sm:px-5">
          <svg aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[#A87C1B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinejoin="round" />
            <path d="M14 2v6h6" strokeLinejoin="round" />
          </svg>
          <div>
            <p className="text-[12.5px] font-semibold text-[#6B5312]">An example BOM — not a one-size-fits-all specification.</p>
            <p className="mt-1 text-[11.5px] leading-6 text-[#7A6428]">
              The sheet describes one 4 kW RCC-rooftop requirement. Quantities are blank and several structure entries
              need modification. Final equipment, cable sizing, quantities and structural details are confirmed in the
              approved design and your quotation.
            </p>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--surface)]">
          <div
            className="flex flex-col gap-2 border-b border-[var(--border-soft)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
            style={{ background: 'linear-gradient(180deg, #F7F9F0, #FFFEF9)' }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--primary)]">
              Bill of material · বিল অফ ম্যাটেরিয়াল
            </p>
            <p className="text-[11px] text-[var(--muted)]">
              {total} lines · {groups.length} categories
            </p>
          </div>

          {/* Desktop: the table. */}
          <div className="hidden sm:block">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#FBFCF5]">
                  {['Item', 'Specification', 'Qty', 'Note'].map((heading) => (
                    <th
                      key={heading}
                      className="border-b border-[var(--border-soft)] px-6 py-3 text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--muted-soft)]"
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
                        colSpan={4}
                        className="border-b border-[var(--border-soft)] bg-[var(--primary-tint)]/35 px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--primary-active)]"
                      >
                        {group.group}
                      </td>
                    </tr>
                    {/*
                      Keyed by position, not by name: a bill of material legitimately
                      repeats an item (AC CABLE appears twice with different cores,
                      EARTHING CABLE twice with different sizes), so the name alone is
                      not unique inside a group.
                    */}
                    {group.items.map((item, index) => (
                      <tr key={`${group.group}-${index}`} className="transition-colors hover:bg-[#FBFCF4]">
                        <td className="w-[38%] border-b border-[#F2F4EC] px-6 py-3 align-top text-[12.5px] font-semibold text-[var(--primary)]">
                          {item.name}
                        </td>
                        <td className="w-[26%] border-b border-[#F2F4EC] px-6 py-3 align-top text-[12px] leading-6 text-[#364D40]">
                          {item.spec || item.role || '—'}
                        </td>
                        <td className="w-[8%] border-b border-[#F2F4EC] px-6 py-3 align-top text-[12px] text-[var(--muted)]">
                          {item.quantity || '—'}
                        </td>
                        <td className="border-b border-[#F2F4EC] px-6 py-3 align-top text-[11.5px] leading-6 text-[var(--muted)]">
                          {item.note || '—'}
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
                  {group.items.map((item, index) => (
                    <li key={`${group.group}-m-${index}`} className="border-b border-[#F2F4EC] px-5 py-3.5">
                      <p className="text-[12.5px] font-semibold text-[var(--primary)]">{item.name}</p>
                      <p className="mt-1 text-[12px] leading-6 text-[#364D40]">
                        {[item.spec, item.quantity].filter(Boolean).join(' · ') || item.role || '—'}
                      </p>
                      {item.note && <p className="mt-1 text-[11px] leading-6 text-[var(--muted)]">{item.note}</p>}
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

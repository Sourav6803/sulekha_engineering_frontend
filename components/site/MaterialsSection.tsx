'use client';

import { useState } from 'react';
import { ChevronDown, ClipboardList } from 'lucide-react';
import SectionHeading from './SectionHeading';
import type { SiteMaterialGroup } from '@/types/site';

/** The detailed component list stays tucked away until a visitor asks for it. */
export default function MaterialsSection({ groups }: { groups: SiteMaterialGroup[] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (groups.length === 0) return null;

  const total = groups.reduce((count, group) => count + group.items.length, 0);

  return (
    <section id="materials" className="scroll-mt-24 bg-[var(--surface)] py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-end gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <SectionHeading eyebrow="What we install · Built on the details" title="Every part. A clear purpose." />
          <p className="max-w-md text-sm leading-7 text-[var(--muted)] lg:pb-1">
            A solar system is more than panels. Explore the main components and specifications used in a rooftop installation.
          </p>
        </div>

        <div className="mt-8 overflow-hidden rounded-[24px] border border-[var(--border)] bg-white shadow-[var(--shadow-card)]">
          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls="materials-details"
            onClick={() => setIsOpen((open) => !open)}
            className="group flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition-colors hover:bg-[#FBFCF5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--primary)] sm:px-7 sm:py-6"
          >
            <span className="flex min-w-0 items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary-tint)] text-[var(--primary-active)]">
                <ClipboardList className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-display text-base font-semibold text-[var(--foreground)] sm:text-lg">
                  Technical bill of materials
                </span>
                <span className="mt-1 block text-xs leading-5 text-[var(--muted)] sm:text-sm">
                  Optional component list · {total} items across {groups.length} categories
                </span>
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2 text-xs font-semibold text-[var(--primary-active)] sm:text-sm">
              <span className="hidden sm:inline">{isOpen ? 'Hide details' : 'View details'}</span>
              <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
            </span>
          </button>

          {isOpen && (
            <div id="materials-details" className="border-t border-[var(--border-soft)]">
              <div className="bg-[#FBF4E2] px-5 py-4 sm:px-7">
                <p className="text-[12.5px] font-semibold text-[#6B5312]">Example BOM — final system design is site-specific.</p>
                <p className="mt-1 text-[11.5px] leading-6 text-[#7A6428]">
                  This example describes one 4 kW RCC-rooftop requirement. Final equipment and sizing are confirmed in the approved design and quotation.
                </p>
              </div>

              <div className="px-4 py-4 sm:px-7 sm:py-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {groups.map((group) => (
                    <section key={group.group} className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--surface)]">
                      <h3 className="border-b border-[var(--border-soft)] bg-[#FBFCF5] px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[var(--primary-active)]">
                        {group.group}
                      </h3>
                      <ul className="divide-y divide-[#F2F4EC]">
                        {group.items.map((item, index) => (
                          <li key={`${group.group}-${index}`} className="px-4 py-3">
                            <p className="text-sm font-semibold leading-5 text-[var(--foreground)]">{item.name}</p>
                            {(item.spec || item.role) && (
                              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{item.spec || item.role}</p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

import SectionHeading from './SectionHeading';
import type { SiteMaterialGroup } from '@/types/site';

/**
 * "What exactly goes on my roof?" — grouped by function, not by catalogue.
 *
 * Each line explains the part in one sentence a non-engineer can follow, because
 * a material list without roles is just a bill of quantities.
 */
export default function MaterialsSection({ groups }: { groups: SiteMaterialGroup[] }) {
  if (groups.length === 0) return null;

  return (
    <section id="materials" className="scroll-mt-24 bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="What we install"
          title="Every part, and what it does"
          description="A solar system is more than panels. This is the full bill of material we fit on a typical rooftop — the same list appears on your quotation."
        />

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group, groupIndex) => (
            <div
              key={group.group}
              className={`rounded-[1.75rem] border border-[var(--border-soft)] p-6 ${
                groupIndex === 0 ? 'bg-[var(--primary-tint)]/45' : 'bg-[var(--background)]'
              }`}
            >
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--primary-active)]">
                {group.group}
              </h3>
              <ul className="mt-4 space-y-4">
                {group.items.map((item) => (
                  <li key={item.name}>
                    <p className="text-sm font-semibold text-[var(--foreground)]">{item.name}</p>
                    <p className="mt-0.5 text-sm leading-6 text-[var(--muted)]">{item.role}</p>
                    {item.note && <p className="mt-1 text-xs leading-5 text-[var(--muted-soft)]">{item.note}</p>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

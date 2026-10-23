import Image from 'next/image';
import { Award, Layers, ShieldCheck } from 'lucide-react';
import SectionHeading from './SectionHeading';
import { brandLogoPath } from '@/lib/site/brand-assets';
import type { SiteBrand } from '@/types/site';

/**
 * Panel brands, with what has actually been installed against each.
 *
 * The catalogue comes from the backend's content file; the counts come from
 * published projects, so a brand nobody has fitted yet reads "new to us" rather
 * than a fabricated number.
 */
export default function BrandsSection({ brands, others }: { brands: SiteBrand[]; others: { name: string; installedProjects: number }[] }) {
  return (
    <section id="brands" className="scroll-mt-24 border-y border-[var(--border-soft)] bg-[var(--surface-muted)] py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow="Panels we fit"
            title="Tier-1 modules, named on the quotation"
            description="The quotation always states the make and the Watt-peak. DCR modules are used where the subsidy requires them, and we say so before you pay."
          />
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-medium text-[var(--muted)] ring-1 ring-[var(--border)]">
            <ShieldCheck className="h-4 w-4 text-[var(--primary)]" />
            IEC & TUV certified
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {brands.map((brand) => {
            const logo = brandLogoPath(brand.slug);

            return (
            <article
              key={brand.slug}
              className="group flex h-full flex-col rounded-[1.75rem] border border-[var(--border-soft)] bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-[var(--primary-soft)] hover:shadow-[var(--shadow-card)]"
            >
              <div className="flex items-start justify-between gap-2">
                {/* The maker's own artwork when the office has dropped the file in,
                    a typographic mark otherwise — never a redrawn logo. */}
                {logo ? (
                  <span className="flex h-11 items-center">
                    <Image
                      src={logo}
                      alt={`${brand.name} logo`}
                      width={140}
                      height={44}
                      className="h-9 w-auto object-contain"
                    />
                  </span>
                ) : (
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary-tint)] font-display text-lg font-semibold text-[var(--primary-active)]">
                    {brand.name.charAt(0)}
                  </span>
                )}
                {brand.badge && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-tint)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--accent)]">
                    <Award className="h-3 w-3" />
                    {brand.badge}
                  </span>
                )}
              </div>

              <h3 className="mt-4 text-lg font-semibold text-[var(--foreground)]">{brand.name}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-[var(--muted)]">{brand.blurb}</p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {brand.panelTypes.map((type) => (
                  <span
                    key={type}
                    className="rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-[11px] font-medium text-[var(--muted)]"
                  >
                    {type}
                  </span>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-[var(--border-soft)] pt-4 text-xs">
                <span className="flex items-center gap-1.5 text-[var(--muted-soft)]">
                  <Layers className="h-3.5 w-3.5" />
                  Fitted by us
                </span>
                <span className="font-semibold text-[var(--foreground)]">
                  {brand.installedProjects > 0
                    ? `${brand.installedProjects} site${brand.installedProjects === 1 ? '' : 's'} · ${brand.installedKW} kW`
                    : 'On request'}
                </span>
              </div>
            </article>
            );
          })}
        </div>

        {others.length > 0 && (
          <p className="mt-6 text-xs leading-6 text-[var(--muted-soft)]">
            Also installed on request:{' '}
            {others.map((other, index) => (
              <span key={other.name}>
                {other.name} ({other.installedProjects})
                {index < others.length - 1 ? ', ' : ''}
              </span>
            ))}
            .
          </p>
        )}
      </div>
    </section>
  );
}

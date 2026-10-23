import Image from 'next/image';
import { BadgeIndianRupee, Landmark } from 'lucide-react';
import type { HomePayload, SiteBanner } from '@/types/site';

/**
 * The official scheme, at a glance.
 *
 * If the office has uploaded the government's own artwork it is shown here,
 * unmodified and linked where the artwork expects. Until then the same band
 * carries the subsidy slab, so the section is never an empty frame — and nothing
 * is redrawn or imitated: official artwork is only ever the uploaded file.
 */
export default function SchemeBand({
  banners,
  subsidy,
}: {
  banners: SiteBanner[];
  subsidy: HomePayload['savings']['subsidy'];
}) {
  return (
    <section className="bg-[var(--surface-muted)] py-14 sm:py-18">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--primary-active)] ring-1 ring-[var(--primary-soft)]">
              <Landmark className="h-3.5 w-3.5" />
              Government of India scheme
            </span>
            <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl">
              PM Surya Ghar: Muft Bijli Yojana
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-7 text-[var(--muted)]">
              A central scheme to give every household up to 300 free units a month from its own roof. The subsidy is
              paid into your bank account after the system is installed and the net meter is fitted — we file the
              application and follow it through.
            </p>
            <p className="mt-3 text-xs leading-6 text-[var(--muted-soft)]">{subsidy.note}</p>
          </div>

          {banners.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {banners.slice(0, 4).map((banner) => (
                <a
                  key={banner.id}
                  href={banner.linkUrl || '/enquiry'}
                  className="group relative block overflow-hidden rounded-2xl ring-1 ring-[var(--border)] transition-transform hover:-translate-y-0.5"
                >
                  <div className="relative aspect-[16/10] w-full bg-white">
                    <Image
                      src={banner.imageUrl}
                      alt={banner.altText}
                      fill
                      sizes="(max-width: 640px) 100vw, 320px"
                      className="object-contain p-1"
                    />
                  </div>
                  {banner.ctaLabel && (
                    <span className="absolute bottom-2 left-2 rounded-full bg-[var(--foreground)]/85 px-2.5 py-1 text-[10px] font-semibold text-white">
                      {banner.ctaLabel}
                    </span>
                  )}
                </a>
              ))}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { size: '1 kW', amount: subsidy.perKwFirstTwo, note: '₹30,000 per kW for the first two' },
                { size: '2 kW', amount: subsidy.perKwFirstTwo * 2, note: 'the most common home size' },
                { size: '3 kW & above', amount: subsidy.cap, note: 'capped, however large the system' },
              ].map((slab) => (
                <div
                  key={slab.size}
                  className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-xs)]"
                >
                  <div className="flex items-center gap-2 text-[var(--accent)]">
                    <BadgeIndianRupee className="h-4 w-4" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">{slab.size}</span>
                  </div>
                  <p className="mt-3 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                    ₹{slab.amount.toLocaleString('en-IN')}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{slab.note}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </section>
  );
}

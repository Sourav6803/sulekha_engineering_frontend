import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import type { HomePayload } from '@/types/site';

/**
 * A closing line, not a second sitemap.
 *
 * The footer used to be a four-column block with uppercase headings, an icon list
 * and a grey band — it read like the dashboard it shares components with, and it
 * pulled attention away from the enquiry card above it. One row of links, the
 * contact details in a single line, and the disclaimers where they belong: small,
 * at the very bottom.
 */
export default function SiteFooter({ company }: { company: HomePayload['company'] }) {
  const year = new Date().getFullYear();
  const tel = company.phone ? `tel:+91${company.phone}` : null;

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--background)] pb-6 pt-10">
      <div className="mx-auto max-w-[1180px] px-5 lg:px-8">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label={`${company.name} — home`}>
            <span className="relative h-11 w-11 shrink-0">
              <Image src="/logo-mark.png" alt="" fill sizes="44px" className="object-contain" />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-[15px] font-semibold tracking-[-0.01em] text-[var(--foreground)]">
                Sulekha Engineering
              </span>
              <span className="mt-0.5 block text-[10px] font-medium text-[var(--muted-soft)]">
                Solar today. Better tomorrow.
              </span>
            </span>
          </Link>

          <p className="max-w-sm text-[12.5px] leading-7 text-[var(--muted)]">
            Thoughtfully designed rooftop solar for homes across West Bengal. From the first survey to your first
            solar-powered day.
          </p>

          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-medium text-[var(--muted)] lg:max-w-[220px] lg:justify-end">
            <Link href="/#savings" className="transition-colors hover:text-[var(--foreground)]">Savings</Link>
            <Link href="/#panel-guide" className="transition-colors hover:text-[var(--foreground)]">Panel guide</Link>
            <Link href="/#materials" className="transition-colors hover:text-[var(--foreground)]">Materials</Link>
            <Link href="/#faq" className="transition-colors hover:text-[var(--foreground)]">FAQ</Link>
            <Link href="/enquiry" className="transition-colors hover:text-[var(--foreground)]">Contact</Link>
            <Link href="/projects" className="inline-flex items-center gap-0.5 transition-colors hover:text-[var(--foreground)]">
              Our work
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </nav>
        </div>

        {/* One line for the details a customer copies: number, mail, where we are. */}
        <div className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-[var(--muted)]">
          {tel && (
            <a href={tel} className="font-medium text-[var(--foreground)] transition-colors hover:text-[var(--primary)]">
              {company.phone}
            </a>
          )}
          {company.email && (
            <>
              <span aria-hidden className="text-[var(--border)]">•</span>
              <a href={`mailto:${company.email}`} className="transition-colors hover:text-[var(--foreground)]">
                {company.email}
              </a>
            </>
          )}
          {company.addressLines.length > 0 && (
            <>
              <span aria-hidden className="text-[var(--border)]">•</span>
              <span>{company.addressLines.join(', ')}</span>
            </>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-1.5 border-t border-[var(--border)] pt-4 text-[10px] leading-5 text-[var(--muted-soft)] sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <p>
            © {year} {company.name}. All rights reserved.
            {company.gstn ? ` · GSTIN ${company.gstn}` : ''}
          </p>
          <p>Illustrative pricing and generation. Scheme and bank terms require confirmation.</p>
        </div>
      </div>
    </footer>
  );
}

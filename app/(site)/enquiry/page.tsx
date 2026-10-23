import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Clock, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import LeadForm from '@/components/site/LeadForm';
import { OPENING_HOURS } from '@/lib/site/company-info';
import { getHomeCached } from '@/lib/site/server-data';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Book a free solar site survey | Sulekha Engineering',
  description:
    'Tell us the district and your monthly bill. We measure the roof, check the meter and send a written quotation with the PM Surya Ghar subsidy for your slab.',
  alternates: { canonical: '/enquiry' },
};

export default async function EnquiryPage() {
  const home = await getHomeCached();
  const company = home?.company ?? null;
  const districts = home?.districts.map((row) => row.district) ?? [];

  return (
    <>
      <section className="border-b border-[var(--border-soft)] bg-[var(--surface-muted)] pb-12 pt-28 sm:pt-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--primary)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to the site
          </Link>
          <h1 className="mt-5 max-w-3xl font-display text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-5xl">
            Book a free site survey
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">
            The visit is free and there is no obligation. We measure the shade-free area, check the meter and the wiring
            route, then send a written quotation with the subsidy already worked out for your slab.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:px-8">
        <div>
          <LeadForm
            districts={districts}
            title="Tell us where the roof is"
            subtitle="A person from the office calls you back — usually the same working day."
          />
        </div>

        <aside className="space-y-6">
          <div className="rounded-[1.5rem] border border-[var(--border-soft)] bg-white p-5 sm:p-6">
            <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">Rather talk to someone?</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              Call the office during working hours and ask for a survey. Mention your district and your average monthly
              bill — that is enough to size the system roughly before we visit.
            </p>

            <ul className="mt-5 space-y-3 text-sm">
              {company?.phone && (
                <li className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                  <a href={`tel:+91${company.phone}`} className="font-medium text-[var(--foreground)] hover:text-[var(--primary)]">
                    {company.phone}
                  </a>
                </li>
              )}
              {company?.altPhone && (
                <li className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                  <a href={`tel:+91${company.altPhone}`} className="font-medium text-[var(--foreground)] hover:text-[var(--primary)]">
                    {company.altPhone}
                  </a>
                </li>
              )}
              {company?.email && (
                <li className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                  <a href={`mailto:${company.email}`} className="break-all font-medium text-[var(--foreground)] hover:text-[var(--primary)]">
                    {company.email}
                  </a>
                </li>
              )}
              {company && company.addressLines.length > 0 && (
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                  <span className="text-[var(--muted)]">{company.addressLines.join(', ')}</span>
                </li>
              )}
              <li className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                <span className="text-[var(--muted)]">{OPENING_HOURS}</span>
              </li>
            </ul>
          </div>

          <div className="rounded-[1.5rem] border border-[var(--border-soft)] bg-[var(--primary-tint)] p-5 sm:p-6">
            <ShieldCheck className="h-5 w-5 text-[var(--primary-active)]" />
            <h3 className="mt-3 text-sm font-semibold text-[var(--foreground)]">What happens to your number</h3>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              It is stored with this enquiry so the office can call you back about the survey. Nothing is sold or shared,
              and a repeat submission is recognised rather than duplicated.
            </p>
          </div>
        </aside>
      </section>
    </>
  );
}

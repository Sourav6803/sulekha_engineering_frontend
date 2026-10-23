import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import LeadForm from './LeadForm';
import { OPENING_HOURS } from '@/lib/site/company-info';
import type { HomePayload } from '@/types/site';

/**
 * The last screen: the form, and a way to reach a person right now.
 *
 * Both are offered deliberately — a visitor who is ready to talk should not have
 * to fill in four fields first, and one who is not ready to talk should not have
 * to call.
 */
export default function ContactSection({
  company,
  districts,
}: {
  company: HomePayload['company'];
  districts: string[];
}) {
  return (
    <section id="contact" className="scroll-mt-24 border-t border-[var(--border-soft)] bg-[var(--surface-muted)] py-16 sm:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14 lg:px-8">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">Next step</span>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
            A free survey tells you exactly what your roof can carry
          </h2>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)] sm:text-base">
            We measure the shade-free area, check the meter and the wiring route, and give you a written quotation with
            the subsidy worked out for your slab. No obligation, and no charge for the visit.
          </p>

          <div className="mt-8 space-y-3">
            {company.phone && (
              <a
                href={`tel:+91${company.phone}`}
                className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white px-4 py-3.5 transition-colors hover:border-[var(--primary)]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-tint)] text-[var(--primary-active)]">
                  <Phone className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-soft)]">
                    Call the office
                  </span>
                  <span className="block text-sm font-semibold text-[var(--foreground)]">{company.phone}</span>
                </span>
              </a>
            )}

            {company.email && (
              <a
                href={`mailto:${company.email}`}
                className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white px-4 py-3.5 transition-colors hover:border-[var(--primary)]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-muted)] text-[var(--foreground)]">
                  <Mail className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-soft)]">
                    Email
                  </span>
                  <span className="block break-all text-sm font-semibold text-[var(--foreground)]">{company.email}</span>
                </span>
              </a>
            )}

            {company.addressLines.length > 0 && (
              <div className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-white px-4 py-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-muted)] text-[var(--foreground)]">
                  <MapPin className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-soft)]">
                    Office
                  </span>
                  <span className="block text-sm font-medium leading-6 text-[var(--foreground)]">
                    {company.addressLines.join(', ')}
                  </span>
                </span>
              </div>
            )}

            <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white px-4 py-3.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-muted)] text-[var(--foreground)]">
                <Clock className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-soft)]">
                  Visiting hours
                </span>
                <span className="block text-sm font-medium text-[var(--foreground)]">{OPENING_HOURS}</span>
              </span>
            </div>
          </div>
        </div>

        <div id="enquire" className="scroll-mt-24">
          <LeadForm districts={districts} />
        </div>
      </div>
    </section>
  );
}

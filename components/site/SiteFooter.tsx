import Link from 'next/link';
import Image from 'next/image';
import { Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import type { HomePayload } from '@/types/site';

export default function SiteFooter({ company }: { company: HomePayload['company'] }) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border-soft)] bg-[var(--surface-muted)]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <span className="relative h-11 w-11 shrink-0">
                <Image src="/logo-mark.png" alt={company.name} fill sizes="44px" className="object-contain" />
              </span>
              <div>
                <p className="font-display text-lg font-semibold text-[var(--foreground)]">{company.name}</p>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-soft)]">
                  Registered PM Surya Ghar vendor
                </p>
              </div>
            </div>
            <p className="mt-5 max-w-md text-sm leading-7 text-[var(--muted)]">
              Rooftop solar for homes and small businesses across West Bengal — survey, design, discom approval,
              installation, net metering and subsidy follow-up, handled end to end.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-3.5 py-1.5 text-xs font-medium text-[var(--muted)]">
              <ShieldCheck className="h-4 w-4 text-[var(--primary)]" />
              {company.gstn ? `GSTIN ${company.gstn}` : 'GST registered'}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-soft)]">Explore</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link href="/#process" className="text-[var(--muted)] hover:text-[var(--primary)]">How we install</Link></li>
              <li><Link href="/#savings" className="text-[var(--muted)] hover:text-[var(--primary)]">Savings calculator</Link></li>
              <li><Link href="/projects" className="text-[var(--muted)] hover:text-[var(--primary)]">Completed projects</Link></li>
              <li><Link href="/#brands" className="text-[var(--muted)] hover:text-[var(--primary)]">Panel brands</Link></li>
              <li><Link href="/enquiry" className="text-[var(--muted)] hover:text-[var(--primary)]">Book a survey</Link></li>
              <li><Link href="/login" className="text-[var(--muted-soft)] hover:text-[var(--primary)]">Staff login</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-soft)]">Contact</h3>
            <ul className="mt-4 space-y-3 text-sm text-[var(--muted)]">
              {company.phone && (
                <li className="flex items-start gap-2.5">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                  <a href={`tel:+91${company.phone}`} className="hover:text-[var(--primary)]">{company.phone}</a>
                </li>
              )}
              {company.altPhone && (
                <li className="flex items-start gap-2.5">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                  <a href={`tel:+91${company.altPhone}`} className="hover:text-[var(--primary)]">{company.altPhone}</a>
                </li>
              )}
              {company.email && (
                <li className="flex items-start gap-2.5">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                  <a href={`mailto:${company.email}`} className="break-all hover:text-[var(--primary)]">{company.email}</a>
                </li>
              )}
              {company.addressLines.length > 0 && (
                <li className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                  <span>{company.addressLines.join(', ')}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-[var(--border)] pt-6">
          <p className="text-xs leading-6 text-[var(--muted-soft)]">
            © {year} {company.name}. All rights reserved. Subsidy and generation figures are indicative and subject to
            the current PM Surya Ghar Muft Bijli Yojana guidelines; the subsidy is released after installation and net
            metering.
          </p>
        </div>
      </div>
    </footer>
  );
}

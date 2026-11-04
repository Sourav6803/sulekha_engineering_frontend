import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, Phone } from 'lucide-react';
import JsonLd from '@/components/site/JsonLd';
import { BUSINESS, TEL_HREF, WHATSAPP_HREF } from '@/lib/site/business';
import { SUBSIDY_PAGE } from '@/lib/site/landing';
import {
  breadcrumbSchema,
  faqSchema,
  graph,
  localBusinessSchema,
  serviceSchema,
  websiteSchema,
} from '@/lib/site/seo';

export const metadata: Metadata = {
  title: SUBSIDY_PAGE.metaTitle,
  description: SUBSIDY_PAGE.metaDescription,
  alternates: { canonical: SUBSIDY_PAGE.slug },
  openGraph: {
    title: SUBSIDY_PAGE.metaTitle,
    description: SUBSIDY_PAGE.metaDescription,
    type: 'article',
    url: SUBSIDY_PAGE.slug,
  },
};

const DOCUMENTS = [
  'Aadhaar card of the applicant',
  'PAN card',
  'Latest electricity bill (consumer number visible)',
  'Cancelled cheque or first page of the passbook',
  'Proof of roof ownership',
  'Photographs of the roof and the meter',
];

const STAGES = [
  {
    title: '1 · Register on the national portal',
    body: 'The application is filed in the applicant\'s name against the electricity connection. Name, Aadhaar and bank account have to match.',
  },
  {
    title: '2 · Feasibility and approval',
    body: 'The discom confirms the sanctioned load and the feasible system size for that connection.',
  },
  {
    title: '3 · Installation and inspection',
    body: 'The system goes up, then the discom inspects it before the meter is changed.',
  },
  {
    title: '4 · Net meter and disbursal',
    body: 'The bidirectional meter is fitted, the reading is recorded, and the subsidy is released to the bank account.',
  },
];

export default function SubsidyPage() {
  const trail = [
    { name: 'Home', path: '/' },
    { name: 'PM Surya Ghar subsidy', path: SUBSIDY_PAGE.slug },
  ];

  const schema = graph(
    localBusinessSchema(),
    websiteSchema(),
    serviceSchema({
      name: 'PM Surya Ghar subsidy application support',
      description: SUBSIDY_PAGE.metaDescription,
      areaServed: [...BUSINESS.areasServed],
      slug: SUBSIDY_PAGE.slug,
    }),
    breadcrumbSchema(trail),
    faqSchema(SUBSIDY_PAGE.faqs)
  );

  return (
    <>
      <JsonLd data={schema} />

      <section className="border-b border-[var(--border)] bg-[var(--background)]">
        <div className="mx-auto max-w-[1180px] px-5 pb-12 pt-10 lg:px-8 lg:pb-16 lg:pt-14">
          <nav aria-label="Breadcrumb" className="text-[11px] text-[var(--muted-soft)]">
            <Link href="/" className="hover:text-[var(--foreground)]">
              Home
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-[var(--muted)]">PM Surya Ghar subsidy</span>
          </nav>

          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
            PM Surya Ghar: Muft Bijli Yojana
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-[2rem] font-semibold leading-[1.1] tracking-[-0.02em] lg:text-[2.75rem]">
            {SUBSIDY_PAGE.h1}
          </h1>
          <p className="mt-5 max-w-2xl text-[14.5px] leading-7 text-[var(--muted)]">
            {SUBSIDY_PAGE.intro}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/enquiry" className="brand-button inline-flex items-center gap-2 px-5 py-2.5 text-[12.5px]">
              Check my subsidy <ArrowRight size={14} />
            </Link>
            <a
              href={TEL_HREF}
              className="inline-flex items-center gap-2 rounded-[9px] border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 text-[12.5px] font-semibold"
            >
              <Phone size={14} /> {BUSINESS.phone}
            </a>
            <a
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12.5px] font-semibold text-[var(--primary-active)] underline-offset-4 hover:underline"
            >
              WhatsApp us
            </a>
          </div>
        </div>
      </section>

      <section className="bg-[var(--surface)] py-14">
        <div className="mx-auto max-w-[1180px] px-5 lg:px-8">
          <h2 className="font-display text-[1.6rem] font-semibold tracking-[-0.02em]">
            What the central subsidy is
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {SUBSIDY_PAGE.slabs.map((slab) => (
              <div key={slab.size} className="rounded-[16px] border border-[var(--border)] bg-[var(--background)] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-soft)]">
                  {slab.size}
                </p>
                <p className="mt-2 font-display text-[1.6rem] font-semibold text-[var(--primary)]">
                  {slab.central}
                </p>
                <p className="mt-1 text-[11.5px] leading-5 text-[var(--muted)]">{slab.note}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-[var(--muted-soft)]">
            Indicative amounts under the current scheme. Eligibility, the state top-up and any
            change in rules are confirmed at the survey before you commit.
          </p>
        </div>
      </section>

      <section className="bg-[var(--background)] py-14">
        <div className="mx-auto grid max-w-[1180px] gap-10 px-5 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div>
            <h2 className="font-display text-[1.6rem] font-semibold tracking-[-0.02em]">
              The four stages, and where it usually stalls
            </h2>
            <ol className="mt-6 space-y-5">
              {STAGES.map((stage) => (
                <li key={stage.title}>
                  <p className="text-[13px] font-semibold">{stage.title}</p>
                  <p className="mt-1 text-[12.5px] leading-6 text-[var(--muted)]">{stage.body}</p>
                </li>
              ))}
            </ol>
            <p className="mt-5 rounded-[12px] border border-[#f0e0b8] bg-[#fbf4e2] p-4 text-[12px] leading-6 text-[#7a6320]">
              The step that delays most applications is the name mismatch between Aadhaar, the bank
              account and the electricity bill. Check that before anything else — it is cheaper than
              correcting it after installation.
            </p>
          </div>

          <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-6">
            <h2 className="font-display text-[1.15rem] font-semibold">Documents we collect</h2>
            <ul className="mt-4 space-y-2.5">
              {DOCUMENTS.map((doc) => (
                <li key={doc} className="flex gap-2.5 text-[12.5px] leading-6 text-[var(--muted)]">
                  <Check size={14} className="mt-1 shrink-0 text-[var(--primary)]" />
                  {doc}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[11.5px] leading-6 text-[var(--muted-soft)]">
              Share readable copies with our team. Never enter an OTP or a password on a link someone
              sends you — the portal logins stay with you.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[var(--surface-muted)] py-14">
        <div className="mx-auto max-w-[1180px] px-5 lg:px-8">
          <h2 className="font-display text-[1.6rem] font-semibold tracking-[-0.02em]">
            Subsidy questions
          </h2>
          <div className="mt-6 divide-y divide-[var(--border)] rounded-[16px] border border-[var(--border)] bg-[var(--surface)]">
            {SUBSIDY_PAGE.faqs.map((faq) => (
              <details key={faq.question} className="px-5 py-4">
                <summary className="cursor-pointer list-none text-[13.5px] font-semibold">
                  {faq.question}
                </summary>
                <p className="mt-2 text-[13px] leading-7 text-[var(--muted)]">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--primary)] py-14 text-[#f2f7ee]">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-6 px-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <h2 className="font-display text-[1.6rem] font-semibold tracking-[-0.02em]">
              Find out what your roof qualifies for
            </h2>
            <p className="mt-2 max-w-xl text-[13px] leading-7 text-[#c3d6c8]">
              A survey establishes the feasible size, the subsidy slab and the net amount. It costs
              nothing and there is no obligation to proceed.
            </p>
          </div>
          <Link
            href="/enquiry"
            className="inline-flex shrink-0 items-center gap-2 rounded-[9px] bg-[var(--accent)] px-5 py-3 text-[12.5px] font-bold text-[#2b2412]"
          >
            Book a free survey <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Check, Phone } from 'lucide-react';
import JsonLd from '@/components/site/JsonLd';
import { BUSINESS, SITE_URL, TEL_HREF, WHATSAPP_HREF } from '@/lib/site/business';
import { AREA_PAGES, SUBSIDY_PAGE } from '@/lib/site/landing';
import {
  breadcrumbSchema,
  faqSchema,
  graph,
  localBusinessSchema,
  serviceSchema,
  websiteSchema,
} from '@/lib/site/seo';

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return AREA_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const page = AREA_PAGES.find((entry) => entry.slug === slug);
  if (!page) return {};

  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: { canonical: `/solar/${page.slug}` },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      type: 'website',
      url: `/solar/${page.slug}`,
    },
  };
}

const STEPS = [
  { title: 'Free site survey', body: 'Roof measured, shadow path checked, slab and cable route noted.' },
  { title: 'Written quotation', body: 'System size, itemised bill of material, subsidy for your slab, net payable.' },
  { title: 'Application filed', body: 'We file the PM Surya Ghar application and the net-metering request.' },
  { title: 'Install and commission', body: 'Structure, modules, inverter, earthing, ACDB — then the discom inspection.' },
];

export default async function AreaPage({ params }: Params) {
  const { slug } = await params;
  const page = AREA_PAGES.find((entry) => entry.slug === slug);
  if (!page) notFound();

  const trail = [
    { name: 'Home', path: '/' },
    { name: 'Rooftop solar', path: '/projects' },
    { name: page.area, path: `/solar/${page.slug}` },
  ];

  const schema = graph(
    localBusinessSchema(),
    websiteSchema(),
    serviceSchema({
      name: `Rooftop solar installation in ${page.area}`,
      description: page.metaDescription,
      areaServed: [page.area, ...page.towns],
      slug: `/solar/${page.slug}`,
    }),
    breadcrumbSchema(trail),
    faqSchema(page.faqs)
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
            <span className="text-[var(--muted)]">Rooftop solar in {page.area}</span>
          </nav>

          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--primary-bright,var(--primary))]">
            {BUSINESS.name} · {page.area}
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-[2rem] font-semibold leading-[1.1] tracking-[-0.02em] lg:text-[2.75rem]">
            Rooftop solar in {page.area}
          </h1>
          <p className="mt-5 max-w-2xl text-[14.5px] leading-7 text-[var(--muted)]">{page.intro}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/enquiry"
              className="brand-button inline-flex items-center gap-2 px-5 py-2.5 text-[12.5px]"
            >
              Book a free survey <ArrowRight size={14} />
            </Link>
            <a
              href={TEL_HREF}
              className="inline-flex items-center gap-2 rounded-[9px] border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 text-[12.5px] font-semibold text-[var(--foreground)]"
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
        <div className="mx-auto grid max-w-[1180px] gap-10 px-5 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <h2 className="font-display text-[1.6rem] font-semibold tracking-[-0.02em]">
              What roofs here need
            </h2>
            <p className="mt-4 text-[13.5px] leading-7 text-[var(--muted)]">{page.local}</p>
            <p className="mt-4 text-[12px] text-[var(--muted-soft)]">
              Covering {page.towns.join(', ')}.
            </p>
          </div>

          <div className="rounded-[18px] border border-[var(--border)] bg-[var(--background)] p-6">
            <h2 className="font-display text-[1.15rem] font-semibold">How a job runs</h2>
            <ol className="mt-4 space-y-4">
              {STEPS.map((step, index) => (
                <li key={step.title} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary-tint)] text-[11px] font-bold text-[var(--primary)]">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold">{step.title}</p>
                    <p className="text-[12.5px] leading-6 text-[var(--muted)]">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="bg-[var(--background)] py-14">
        <div className="mx-auto max-w-[1180px] px-5 lg:px-8">
          <h2 className="font-display text-[1.6rem] font-semibold tracking-[-0.02em]">
            Central subsidy by system size
          </h2>
          <p className="mt-3 max-w-2xl text-[13.5px] leading-7 text-[var(--muted)]">
            Fixed by the scheme, not by the installer. Credited to the applicant&apos;s bank account
            after installation and net metering.{' '}
            <Link href={`/${SUBSIDY_PAGE.slug}`} className="font-semibold text-[var(--primary-active)] underline-offset-4 hover:underline">
              How the application works
            </Link>
            .
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {SUBSIDY_PAGE.slabs.map((slab) => (
              <div key={slab.size} className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-soft)]">
                  {slab.size}
                </p>
                <p className="mt-2 font-display text-[1.5rem] font-semibold text-[var(--primary)]">
                  {slab.central}
                </p>
                <p className="mt-1 text-[11.5px] leading-5 text-[var(--muted)]">{slab.note}</p>
              </div>
            ))}
          </div>

          <p className="mt-4 text-[11px] text-[var(--muted-soft)]">
            Scheme rules change. We confirm the applicable amount for your connection at the survey,
            and the final quotation separates the system cost from the subsidy.
          </p>
        </div>
      </section>

      <section className="bg-[var(--surface-muted)] py-14">
        <div className="mx-auto max-w-[1180px] px-5 lg:px-8">
          <h2 className="font-display text-[1.6rem] font-semibold tracking-[-0.02em]">
            Questions we get in {page.area}
          </h2>
          <div className="mt-6 divide-y divide-[var(--border)] rounded-[16px] border border-[var(--border)] bg-[var(--surface)]">
            {page.faqs.map((faq) => (
              <details key={faq.question} className="group px-5 py-4">
                <summary className="cursor-pointer list-none text-[13.5px] font-semibold marker:hidden">
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
              Survey first, quotation after
            </h2>
            <p className="mt-2 max-w-xl text-[13px] leading-7 text-[#c3d6c8]">
              We measure the roof before quoting a number. Book a visit in {page.area} and you get a
              written quotation with the bill of material and the subsidy for your slab.
            </p>
            <p className="mt-3 flex items-center gap-2 text-[12px] text-[#c3d6c8]">
              <Check size={14} /> {BUSINESS.openingHours.label} · {BUSINESS.phone}
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

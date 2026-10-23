import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Leaf } from 'lucide-react';
import Hero from '@/components/site/Hero';
import StatsBar from '@/components/site/StatsBar';
import SchemeBand from '@/components/site/SchemeBand';
import OurWork from '@/components/site/OurWork';
import SavingsCalculator from '@/components/site/SavingsCalculator';
import ProcessTimeline from '@/components/site/ProcessTimeline';
import BrandsSection from '@/components/site/BrandsSection';
import PanelGuide from '@/components/site/PanelGuide';
import EquipmentSection from '@/components/site/EquipmentSection';
import PmSchemeBanner from '@/components/site/PmSchemeBanner';
import MaterialsSection from '@/components/site/MaterialsSection';
import FaqSection from '@/components/site/FaqSection';
import ContactSection from '@/components/site/ContactSection';
import { getHomeCached } from '@/lib/site/server-data';

/**
 * The landing page.
 *
 * Server rendered from `/public/home` so the first paint already carries the
 * real numbers, brands and schemes — no spinner, no client fetch on load. The
 * only interactive sections (hero carousel, savings slider, enquiry form) are
 * the components that are marked `'use client'` themselves.
 *
 * `force-dynamic` is deliberate: the office publishes a project and expects it
 * on the site immediately, and rendering per request avoids baking the
 * "content unavailable" fallback into a static build if the API is down during
 * a deploy.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Rooftop solar in West Bengal | PM Surya Ghar vendor',
  description:
    'Sulekha Engineering installs rooftop solar across West Bengal as a registered PM Surya Ghar vendor — free survey, subsidy paperwork, net metering and after-sales support.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Rooftop solar in West Bengal | Sulekha Engineering',
    description:
      'Registered PM Surya Ghar vendor. Free site survey, written quotation with the subsidy for your slab, and installation by our own team.',
    type: 'website',
  },
};

export default async function HomePage() {
  const home = await getHomeCached();

  /**
   * The marketing page must still be a page when the API is unreachable.
   * Nothing here is invented: no phone number, no project count, no address —
   * only the one action that works without the backend.
   */
  if (!home) {
    return (
      <section className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-[var(--primary-tint)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary-active)]">
          <Leaf className="h-3.5 w-3.5" />
          PM Surya Ghar vendor
        </span>
        <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-5xl">
          Rooftop solar, installed by the team that surveyed it
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-[var(--muted)]">
          Our project gallery and savings figures could not be loaded just now. You can still book a free site survey
          and we will call you back.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/enquiry" className="brand-button">
            Book a free survey
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link href="/login" className="neutral-button">
            Staff sign in
          </Link>
        </div>
      </section>
    );
  }

  const districts = home.districts.map((row) => row.district);

  return (
    <>
      <Hero
        banners={home.banners.home_hero ?? []}
        phone={home.company.phone}
        subsidyCap={home.savings.subsidy.cap}
        unitsPerKWPerDay={home.savings.assumptions.unitsPerKWPerDay}
        unitsPerKWPerDayMax={home.savings.assumptions.unitsPerKWPerDayMax}
        projects={home.stats.projects}
        capacityKW={home.stats.capacityKW}
      />

      <StatsBar stats={home.stats} />

      <SchemeBand banners={home.banners.scheme_strip ?? []} subsidy={home.savings.subsidy} />

      {/* Evidence first: the districts worked in and the jobs that can be shown. */}
      <OurWork districts={home.districts} projects={home.recentProjects} totalProjects={home.stats.projects} />

      <SavingsCalculator
        table={home.savings.table}
        assumptions={home.savings.assumptions}
        panel={home.savings.panel}
        subsidy={home.savings.subsidy}
        disclaimer={home.savings.disclaimer}
      />

      <ProcessTimeline steps={home.process} />

      {/* After the process: the reader now knows what happens, so this answers
          "what actually gets bolted on". */}
      <EquipmentSection />

      <BrandsSection brands={home.brands} others={home.otherBrands} />

      {/* Sits after the brands: a visitor picks a technology first, then a maker. */}
      <PanelGuide />

      <MaterialsSection groups={home.materials} />

      <FaqSection faqs={home.faqs} />

      {/* Closing CTA. Carries the launch photograph when the office has put it
          in public/scheme-cover.jpg — see the note in the component. */}
      <PmSchemeBanner />

      <ContactSection company={home.company} districts={districts} />
    </>
  );
}

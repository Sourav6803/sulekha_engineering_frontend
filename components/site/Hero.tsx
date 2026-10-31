'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, Phone, Sun, Zap } from 'lucide-react';
import type { SiteBanner } from '@/types/site';

/**
 * Shown only while the office has not uploaded hero artwork.
 *
 * It used to point at a stock photograph of somebody else's installation, which
 * is not ours to show and left a grey frame behind while a third-party host
 * answered. This is a local illustration — it reads as a drawing, so it never
 * pretends to be one of our roofs. Drop a real site photo over
 * `public/hero-fallback.jpg` (same name) to replace it.
 */
const FALLBACK_IMAGE = '/hero-fallback.jpg';
const FALLBACK_ALT = 'Illustration of a rooftop solar array on a West Bengal home';

type Props = {
  banners: SiteBanner[];
  phone?: string | null;
  subsidyCap: number;
  unitsPerKWPerDay: number;
  unitsPerKWPerDayMax: number;
  projects: number;
  capacityKW: number;
};

/**
 * First screen.
 *
 * If the office has uploaded hero artwork (including the official scheme
 * banners), that is what shows; otherwise the page still has a complete hero
 * rather than a blank frame waiting for content.
 */
export default function Hero({
  banners,
  phone,
  subsidyCap,
  unitsPerKWPerDay,
  unitsPerKWPerDayMax,
  projects,
  capacityKW,
}: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = setInterval(() => setIndex((value) => (value + 1) % banners.length), 6000);
    return () => clearInterval(timer);
  }, [banners.length]);

  return (
    <section className="relative overflow-hidden bg-[var(--background)]">
      {/* Ambient wash, kept behind everything so text contrast never depends on it. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(1000px 520px at 10% -12%, rgba(57,118,82,0.16), transparent 62%), radial-gradient(880px 460px at 94% 4%, rgba(233,185,77,0.16), transparent 64%)',
        }}
      />

      {/*
       * Headline first, campaign artwork after it. The banner used to sit above
       * the copy and filled the whole first screen on a laptop, so the message
       * and both calls to action started below the fold. It now runs as a strip
       * under the hero — still the first thing you meet when you scroll, and the
       * 3:1 artwork is never cropped into a portrait frame.
       */}
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-8 lg:pb-24 lg:pt-16">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--primary-soft)] bg-white/80 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--primary-active)] backdrop-blur">
            <Sun className="h-3.5 w-3.5" />
            PM Surya Ghar Muft Bijli Yojana
          </span>

          <h1 className="mt-5 font-display text-[2.15rem] font-semibold leading-[1.08] tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-[3.4rem]">
            Your roof can pay
            <span className="relative ml-2 inline-block">
              <span className="relative z-10 text-[var(--primary)]">your bill.</span>
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-1 z-0 h-3 rounded-full bg-[var(--accent-tint)]"
              />
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-8 text-[var(--muted)] sm:text-lg">
            Rooftop solar for West Bengal homes — up to{' '}
            <strong className="font-semibold text-[var(--foreground)]">₹{subsidyCap.toLocaleString('en-IN')}</strong>{' '}
            central subsidy, around{' '}
            <strong className="font-semibold text-[var(--foreground)]">
              {unitsPerKWPerDay}–{unitsPerKWPerDayMax} units a day per kW
            </strong>,
            and a net meter that credits what you don&apos;t use. We handle the survey, the application, the
            installation and the subsidy follow-up.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="#savings" className="brand-button !px-6 !py-3">
              Calculate my savings
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href="/enquiry" className="neutral-button !px-6 !py-3">
              Book a free site survey
            </Link>
            {phone && (
              <a
                href={`tel:+91${phone}`}
                className="inline-flex items-center gap-2 px-2 py-3 text-sm font-semibold text-[var(--foreground)] hover:text-[var(--primary)]"
              >
                <Phone className="h-4 w-4 text-[var(--primary)]" />
                {phone}
              </a>
            )}
          </div>

          <dl className="mt-9 grid max-w-xl grid-cols-3 gap-4 border-t border-[var(--border)] pt-6">
            {[
              { label: 'Installations', value: projects > 0 ? `${projects}+` : 'On the way' },
              { label: 'Capacity built', value: capacityKW > 0 ? `${capacityKW} kW` : '—' },
              { label: 'Panel warranty', value: '25 years' },
            ].map((item) => (
              <div key={item.label}>
                <dd className="text-xl font-semibold tracking-tight text-[var(--foreground)]">{item.value}</dd>
                <dt className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-soft)]">
                  {item.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative">
          <div className="relative aspect-[4/3.4] w-full overflow-hidden rounded-[7rem_2rem_2rem_2rem] bg-[var(--primary-tint)] shadow-[var(--shadow)] ring-1 ring-black/5">
            <Image
              src={FALLBACK_IMAGE}
              alt={FALLBACK_ALT}
              fill
              sizes="(max-width: 1024px) 100vw, 560px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
          </div>

          {/* Floating proof cards — the two numbers a visitor actually asks about. */}
          <div className="absolute -left-3 top-6 rounded-2xl border border-[var(--border-soft)] bg-white/95 p-3.5 shadow-[var(--shadow-card)] backdrop-blur sm:-left-6">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-tint)] text-[var(--accent)]">
                <BadgeCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-soft)]">
                  Central subsidy
                </p>
                <p className="text-base font-semibold text-[var(--foreground)]">
                  up to ₹{subsidyCap.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          <div className="absolute -right-2 bottom-8 rounded-2xl border border-[var(--border-soft)] bg-white/95 p-3.5 shadow-[var(--shadow-card)] backdrop-blur sm:-right-5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary-tint)] text-[var(--primary-active)]">
                <Zap className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-soft)]">
                  Generation
                </p>
                <p className="text-base font-semibold text-[var(--foreground)]">
                  {unitsPerKWPerDay}–{unitsPerKWPerDayMax} units / kW / day
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {banners.length > 0 && (
        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-2 sm:px-6 lg:px-8 lg:pb-20">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[1.5rem] bg-white ring-1 ring-[var(--border-soft)] sm:aspect-[3/1]">
            {banners.map((banner, slideIndex) => (
              <Image
                key={banner.id}
                src={banner.imageUrl}
                alt={banner.altText || 'Sulekha Engineering scheme banner'}
                fill
                priority={slideIndex === 0}
                sizes="(max-width: 1024px) 100vw, 1216px"
                /* Contain, not cover: the artwork is 3:1 and carries the phone
                   numbers and the address along its edges. Cropping it to a phone
                   screen cut both ends off, so on a narrow screen the banner is
                   letterboxed instead. At >=640px the box is already 3:1, so this
                   makes no difference there. */
                className={`object-contain transition-opacity duration-700 ${
                  slideIndex === index ? 'opacity-100' : 'opacity-0'
                }`}
              />
            ))}

            {/* The artwork carries its own CTA ("ফ্রি সার্ভে", "যোগাযোগ করুন"), so
                the slide links where the record says. Below the dots in the stack,
                which stay clickable. */}
            {banners[index]?.linkUrl && (
              <Link
                href={banners[index].linkUrl as string}
                aria-label={banners[index].ctaLabel || banners[index].title}
                className="absolute inset-0 z-10"
              />
            )}

            {banners.length > 1 && (
              <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
                {banners.map((banner, slideIndex) => (
                  <button
                    key={banner.id}
                    type="button"
                    onClick={() => setIndex(slideIndex)}
                    aria-label={`Show banner ${slideIndex + 1}`}
                    className={`h-1.5 rounded-full transition-all ${
                      slideIndex === index ? 'w-6 bg-white shadow' : 'w-1.5 bg-white/60 hover:bg-white'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </section>
  );
}

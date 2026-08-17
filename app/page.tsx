'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sun, Zap, Shield, Users, TrendingUp, MapPin, Phone, Mail, ChevronRight } from 'lucide-react';

const HERO_SLIDES = [
  {
    id: '1',
    title: 'PM Surya Ghar Muft Bijli Yojana',
    subtitle: 'Free electricity up to 300 units/month for every household',
    description: 'Sulekha Engineering is a registered vendor helping West Bengal families access clean, affordable solar energy under the flagship government scheme.',
    image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1600&h=900&fit=crop',
    cta: 'Apply Now',
    href: '/dashboard',
  },
  {
    id: '2',
    title: 'Rooftop Solar for West Bengal Homes',
    subtitle: 'Up to 60% government subsidy on solar installations',
    description: 'From site survey to net metering, we handle everything. Join thousands of families across Purba Bardhaman and beyond.',
    image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1600&h=900&fit=crop',
    cta: 'Check Eligibility',
    href: '/dashboard',
  },
  {
    id: '3',
    title: 'End-to-End Solar Solutions',
    subtitle: 'Material supply, installation & after-sales support',
    description: 'As a PM Surya Ghar vendor, we provide complete solar rooftop solutions with authentic components and certified technicians.',
    image: 'https://images.unsplash.com/photo-1497440001374-f2699736c3d2?w=1600&h=900&fit=crop',
    cta: 'View Services',
    href: '/dashboard',
  },
];

const WB_STATS = [
  { label: 'Solar potential', value: '1.8 GW', icon: Sun },
  { label: 'Districts covered', value: '23', icon: MapPin },
  { label: 'Installations done', value: '500+', icon: TrendingUp },
  { label: 'Families benefited', value: '3000+', icon: Users },
];

const SERVICES = [
  {
    title: 'Site Survey & Feasibility',
    description: 'Free technical assessment of your rooftop for optimal solar panel placement and output estimation.',
    icon: MapPin,
  },
  {
    title: 'Documentation & Subsidy',
    description: 'Complete assistance with PM Surya Ghar portal registration, documentation, and subsidy claim processing.',
    icon: Shield,
  },
  {
    title: 'Quality Installation',
    description: 'Certified team with premium mounting structures, DC cables, and ACDB/DCDB setups for long-lasting performance.',
    icon: Zap,
  },
  {
    title: 'After-Sales Support',
    description: 'Dedicated service network for maintenance, cleaning, and performance monitoring after installation.',
    icon: Users },
];

const WHY_US = [
  'Registered vendor on PM Surya Ghar portal',
  'In-house material inventory with 77+ SKUs',
  'Transparent pricing with no hidden costs',
  'End-to-end project management',
  'Post-installation monitoring & support',
];

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* Hero Carousel */}
      <section className="relative h-[65vh] min-h-[400px] max-h-[600px] w-full overflow-hidden">
        {HERO_SLIDES.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              height={50}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
            <div className="relative z-10 flex h-full items-end">
              <div className="mx-auto max-w-7xl w-full px-4 pb-16 sm:px-6 lg:px-8">
                <div className="max-w-3xl">
                  <h1 className="text-2xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                    {slide.title}
                  </h1>
                  <p className="mt-4 text-xl text-white/90 sm:text-2xl">{slide.subtitle}</p>
                  <p className="mt-4 max-w-xl text-base leading-7 text-white/80">{slide.description}</p>
                  <div className="mt-8 flex flex-wrap gap-4">
                    <Link href={slide.href} className="brand-button">
                      {slide.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                    <Link href="/dashboard" className="neutral-button border-white/30 text-white bg-white/10">
                      View Dashboard
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Carousel controls */}
        <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {HERO_SLIDES.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2.5 rounded-full transition-all ${
                index === currentSlide ? 'w-8 bg-white' : 'w-2.5 bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b border-[var(--border-soft)] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {WB_STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary-tint)] text-[var(--primary-active)]">
                  <stat.icon className="h-6 w-6" />
                </div>
                <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">{stat.value}</p>
                <p className="text-sm text-[var(--muted)]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About PM Surya Ghar */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">
                About the Scheme
              </span>
              <h2 className="mt-4 text-3xl font-bold text-[var(--foreground)] sm:text-4xl">
                PM Surya Ghar Muft Bijli Yojana
              </h2>
              <p className="mt-6 text-base leading-7 text-[var(--muted)]">
                Launched by the Government of India, PM Surya Ghar aims to provide free electricity up to 300 units per month
                to households through rooftop solar installations. Beneficiaries receive central financial assistance of up to 60%
                for systems up to 6 kW capacity.
              </p>
              <p className="mt-4 text-base leading-7 text-[var(--muted)]">
                In West Bengal, the scheme has accelerated solar adoption across districts. Sulekha Engineering, based in Purba Bardhaman,
                is a registered vendor enabling families to access subsidies, quality installation, and reliable after-sales service.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <span className="badge-pill bg-[var(--primary-tint)] text-[var(--primary-active)]">Rooftop Solar</span>
                <span className="badge-pill bg-[var(--success-tint)] text-[var(--success)]">Free Electricity</span>
                <span className="badge-pill bg-[var(--primary-tint)] text-[var(--primary-active)]">60% Subsidy</span>
                <span className="badge-pill bg-[var(--success-tint)] text-[var(--success)]">Clean Energy</span>
              </div>
            </div>
            <div className="relative h-[400px] w-full overflow-hidden rounded-[2rem] lg:h-[500px]">
              <Image
                src="https://images.unsplash.com/photo-1558449028-b53a39d100fc?w=800&h=600&fit=crop"
                alt="Solar panels on rooftop"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="bg-[var(--surface-muted)] py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">What We Offer</span>
            <h2 className="mt-4 text-3xl font-bold text-[var(--foreground)] sm:text-4xl">End-to-End Solar Services</h2>
            <p className="mt-4 max-w-2xl mx-auto text-base text-[var(--muted)]">
              From site assessment to post-installation support, we manage the complete solar journey for your home.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((service) => (
              <div
                key={service.title}
                className="rounded-[2rem] border border-[var(--border-soft)] bg-white p-6 shadow-[var(--shadow-xs)] transition-shadow hover:shadow-[var(--shadow)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary-tint)] text-[var(--primary-active)]">
                  <service.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-[var(--foreground)]">{service.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="order-2 lg:order-1 relative h-[400px] w-full overflow-hidden rounded-[2rem] lg:h-[500px]">
              <Image
                src="https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&h=600&fit=crop"
                alt="Solar technician at work"
                fill
                className="object-cover"
              />
            </div>
            <div className="order-1 lg:order-2">
              <span className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">Why Sulekha Engineering</span>
              <h2 className="mt-4 text-3xl font-bold text-[var(--foreground)] sm:text-4xl">Trusted Solar Partner in West Bengal</h2>
              <p className="mt-6 text-base leading-7 text-[var(--muted)]">
                As a registered PM Surya Ghar vendor, we combine technical expertise, genuine materials, and transparent processes
                to deliver solar installations that perform for decades.
              </p>

              <ul className="mt-8 space-y-4">
                {WHY_US.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--success-tint)] text-[var(--success)]">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-sm font-medium text-[var(--foreground)]">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-10">
                <Link href="/dashboard" className="brand-button">
                  Start Your Solar Journey
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-[var(--foreground)] py-16 sm:py-24">
        <div className="absolute inset-0 opacity-10">
          <Image
            src="https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1600&h=600&fit=crop"
            alt=""
            fill
            className="object-cover"
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Ready to Go Solar?</h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-white/80">
              Join the PM Surya Ghar movement today. Get free electricity and reduce your carbon footprint with a rooftop solar system.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link href="/dashboard" className="brand-button">
                Check Eligibility
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <a href="tel:+917908104098" className="neutral-button border-white/30 text-white bg-white/10">
                <Phone className="mr-2 h-4 w-4" />
                Call Now
              </a>
            </div>
            <p className="mt-6 text-sm text-white/60">
              Or email us at{' '}
              <a href="mailto:sulekhaenginnering.com" className="text-white underline">
                sulekhaenginnering.com
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-soft)] bg-white/80 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 overflow-hidden rounded-full">
                  <img
                    src="/sulekha_engineering_logo.jpeg"
                    alt="Sulekha Engineering"
                    className="h-full w-full object-contain"
                    width={30}
                    height={30}
                  />
                </div>
                <div>
                  <p className="font-semibold text-[var(--foreground)]">Sulekha Engineering</p>
                  <p className="text-xs text-[var(--muted)]">PM Surya Ghar Vendor</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-[var(--muted)]">
                Registered vendor for PM Surya Ghar Muft Bijli Yojana in West Bengal. Providing complete solar rooftop solutions.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Quick Links</h3>
              <ul className="mt-4 space-y-2">
                <li><Link href="/dashboard" className="text-sm text-[var(--muted)] hover:text-[var(--primary)]">Dashboard</Link></li>
                <li><Link href="/customers" className="text-sm text-[var(--muted)] hover:text-[var(--primary)]">Customers</Link></li>
                <li><Link href="/installations" className="text-sm text-[var(--muted)] hover:text-[var(--primary)]">Installations</Link></li>
                <li><Link href="/materials" className="text-sm text-[var(--muted)] hover:text-[var(--primary)]">Materials</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Contact</h3>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center gap-2 text-sm text-[var(--muted)]">
                  <Phone className="h-4 w-4" />
                  <a href="tel:+917908104098">+91 7908104098</a>
                </li>
                <li className="flex items-center gap-2 text-sm text-[var(--muted)]">
                  <Mail className="h-4 w-4" />
                  <a href="mailto:souravbhukta8@gmail.com">souravbhukta8@gmail.com</a>
                </li>
                <li className="flex items-start gap-2 text-sm text-[var(--muted)]">
                  <MapPin className="mt-0.5 h-4 w-4" />
                  <span>Sonar Goria, Jamalpur, Purba Bardhaman, West Bengal - 713404</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-[var(--border-soft)] pt-8 text-center">
            <p className="text-xs text-[var(--muted-soft)]">
              © {new Date().getFullYear()} Sulekha Engineering. All rights reserved. | PM Surya Ghar Muft Bijli Yojana
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

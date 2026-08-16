'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Sun, Zap, Shield, Users, TrendingUp, MapPin, ChevronRight } from 'lucide-react';

const HERO_SLIDES = [
  {
    id: '1',
    title: 'PM Surya Ghar Muft Bijli Yojana',
    subtitle: 'Free electricity up to 300 units/month',
    description: 'Sulekha Engineering is a registered vendor helping West Bengal families access clean, affordable solar energy.',
    image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1600&h=900&fit=crop',
  },
  {
    id: '2',
    title: 'Up to 60% Government Subsidy',
    subtitle: 'On rooftop solar installations',
    description: 'Get central financial assistance for systems up to 6 kW. We handle documentation and net metering.',
    image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1600&h=900&fit=crop',
  },
  {
    id: '3',
    title: 'End-to-End Solar Solutions',
    subtitle: 'Material supply, installation & support',
    description: 'From site survey to after-sales service, we manage your complete solar journey.',
    image: 'https://images.unsplash.com/photo-1497440001374-f2699736c3d2?w=1600&h=900&fit=crop',
  },
];

const WB_STATS = [
  { label: 'Solar potential', value: '1.8 GW', icon: Sun },
  { label: 'Districts covered', value: '23', icon: MapPin },
  { label: 'Installations done', value: '500+', icon: TrendingUp },
  { label: 'Families benefited', value: '3000+', icon: Users },
];

const FEATURES = [
  { title: 'Registered Vendor', description: 'Official PM Surya Ghar vendor', icon: Shield },
  { title: 'Quality Materials', description: '77+ verified SKUs', icon: Zap },
  { title: 'Expert Installation', description: 'Certified technicians', icon: Users },
];

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';

  const { login, error, loading, isAuthenticated } = useAuth();
  const [activeSlide, setActiveSlide] = useState(0);
  const [form, setForm] = useState({ email: '', password: '' });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirectPath);
    }
  }, [isAuthenticated, redirectPath, router]);

  useEffect(() => {
    if (!loginSuccess) return;
    const timer = setTimeout(() => router.replace(redirectPath), 80);
    return () => clearTimeout(timer);
  }, [loginSuccess, redirectPath, router]);

  useEffect(() => {
    if (!error) return;
    toast.error('Sign in failed', { description: error });
  }, [error]);

  useEffect(() => {
    if (!validationError) return;
    toast.error('Sign in failed', { description: validationError });
  }, [validationError]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationError(null);

    if (!form.email.trim() || !form.password.trim()) {
      setValidationError('Email and password are required.');
      toast.error('Validation error', { description: 'Email and password are required.' });
      return;
    }

    try {
      await login({ email: form.email.trim(), password: form.password.trim() });
      toast.success('Welcome back', { description: 'You are now signed in to the Sulekha Engineering console.' });
      setLoginSuccess(true);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Invalid email or password';
      setValidationError(message);
      setTimeout(() => {
        toast.error('Sign in failed', { description: message, duration: 5000 });
      }, 50);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* Left - Visual Panel */}
        <div className="relative hidden lg:block lg:w-1/2 xl:w-[55%]">
          {/* Carousel */}
          <div className="absolute inset-0">
            {HERO_SLIDES.map((slide, index) => (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-700 ${
                  index === activeSlide ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
              </div>
            ))}
          </div>

          {/* Content Overlay */}
          <div className="relative z-10 flex h-full flex-col justify-between p-8 xl:p-12">
            <div>
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-xl">
                  <img
                    src="/sulekha_engineering_logo.jpeg"
                    alt="Sulekha Engineering"
                    className="h-full w-full object-contain"
                    width={48}
                    height={48}
                  />
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">Sulekha Engineering</p>
                  <p className="text-xs text-white/70">PM Surya Ghar Vendor</p>
                </div>
              </div>
            </div>

            <div className="max-w-xl">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-white sm:text-4xl">{HERO_SLIDES[activeSlide].title}</h2>
                <p className="mt-2 text-lg text-white/90">{HERO_SLIDES[activeSlide].subtitle}</p>
                <p className="mt-3 text-sm leading-7 text-white/80">{HERO_SLIDES[activeSlide].description}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {WB_STATS.map((stat) => (
                  <div key={stat.label} className="rounded-[1.25rem] border border-white/20 bg-white/10 p-4 text-center backdrop-blur-sm">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white">
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <p className="mt-2 text-xl font-semibold text-white">{stat.value}</p>
                    <p className="text-xs text-white/70">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Features */}
              <div className="mt-6 flex flex-wrap gap-3">
                {FEATURES.map((feature) => (
                  <div key={feature.title} className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">
                    <feature.icon className="h-4 w-4 text-white" />
                    <span className="text-sm text-white">{feature.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Carousel dots */}
            <div className="flex gap-2">
              {HERO_SLIDES.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveSlide(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === activeSlide ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
                  }`}
                  aria-label={`Slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right - Login Form */}
        <div className="flex w-full items-center justify-center bg-[var(--background)] p-6 sm:p-8 lg:w-1/2 lg:p-12 xl:w-[45%]">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="flex items-center gap-3 lg:hidden mb-8">
              <div className="relative h-10 w-10 overflow-hidden rounded-xl">
                <img
                  src="/sulekha_engineering_logo.jpeg"
                  alt="Sulekha Engineering"
                  className="h-full w-full object-contain"
                  width={40}
                  height={40}
                />
              </div>
              <div>
                <p className="font-semibold text-[var(--foreground)]">Sulekha Engineering</p>
                <p className="text-xs text-[var(--muted)]">PM Surya Ghar Vendor</p>
              </div>
            </div>

            {/* Mobile Carousel */}
            <div className="relative mb-8 h-48 w-full overflow-hidden rounded-[1.5rem] lg:hidden">
              {HERO_SLIDES.map((slide, index) => (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-opacity duration-700 ${
                    index === activeSlide ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <h3 className="text-lg font-semibold text-white">{slide.title}</h3>
                    <p className="text-xs text-white/80">{slide.subtitle}</p>
                  </div>
                </div>
              ))}
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                {HERO_SLIDES.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveSlide(index)}
                    className={`h-1.5 rounded-full transition-all ${
                      index === activeSlide ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
                    }`}
                    aria-label={`Slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Login Form */}
            <div className="space-y-6">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-[var(--primary)]">Admin Access</p>
                <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">Secure login</h1>
                <p className="mt-2 text-base text-[var(--muted)]">
                  Enter your credentials to access the Sulekha Engineering operations console.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {validationError && (
                  <div className="rounded-lg border border-[var(--error)] bg-[rgba(239,68,68,0.1)] p-4 text-sm text-[var(--error)]">
                    {validationError}
                  </div>
                )}
                {error && (
                  <div className="rounded-lg border border-[var(--error)] bg-[rgba(239,68,68,0.1)] p-4 text-sm text-[var(--error)]">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    placeholder="example@domain.com"
                    className="form-input"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                    placeholder="Enter your password"
                    className="form-input"
                    required
                  />
                </div>

                <button type="submit" className="brand-button w-full" disabled={loading}>
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>
              </form>

              {/* Mobile Stats */}
              <div className="grid grid-cols-2 gap-3 lg:hidden">
                {WB_STATS.map((stat) => (
                  <div key={stat.label} className="rounded-[1.25rem] border border-[var(--border-soft)] bg-white p-4 text-center">
                    <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary-tint)] text-[var(--primary-active)]">
                      <stat.icon className="h-4 w-4" />
                    </div>
                    <p className="mt-1.5 text-lg font-semibold text-[var(--foreground)]">{stat.value}</p>
                    <p className="text-xs text-[var(--muted)]">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Mobile Features */}
              <div className="space-y-3 lg:hidden">
                {FEATURES.map((feature) => (
                  <div key={feature.title} className="flex items-center gap-3 rounded-[1.25rem] border border-[var(--border-soft)] bg-white p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary-tint)] text-[var(--primary-active)]">
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--foreground)]">{feature.title}</p>
                      <p className="text-xs text-[var(--muted)]">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-[1.25rem] border border-[var(--border-soft)] bg-white p-5">
                <p className="text-sm font-semibold text-[var(--foreground)]">PM Surya Ghar Benefits</p>
                <ul className="mt-3 space-y-2">
                  <li className="flex items-start gap-2 text-sm text-[var(--muted)]">
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                    Free electricity up to 300 units/month
                  </li>
                  <li className="flex items-start gap-2 text-sm text-[var(--muted)]">
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                    Up to 60% subsidy on solar installations
                  </li>
                  <li className="flex items-start gap-2 text-sm text-[var(--muted)]">
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                    Easy registration on official portal
                  </li>
                </ul>
              </div>

              <p className="text-center text-xs text-[var(--muted-soft)]">
                Internal operations portal for Sulekha Engineering. Authorized access only.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, LayoutDashboard, LogIn, Menu, Phone, X } from 'lucide-react';
import { AuthSession } from '@/lib/auth/session';

const LINKS = [
  { href: '/#process', label: 'How we install' },
  { href: '/#savings', label: 'Savings' },
  { href: '/#brands', label: 'Panels' },
  { href: '/#panel-guide', label: 'Panel guide' },
  { href: '/#equipment', label: 'Equipment' },
  { href: '/projects', label: 'Our work' },
  { href: '/#faq', label: 'FAQ' },
];

/**
 * The public site's own header.
 *
 * Not the dashboard's: a visitor has no account, so there is no sidebar, no
 * notification bell and no sign-out. The only ask is the enquiry CTA.
 */
export default function SiteHeader({ phone }: { phone?: string | null }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  /**
   * Whether to show "Dashboard" or "Login".
   *
   * The session lives in storage with a cookie mirror, so it cannot be read while
   * rendering on the server. Starting at `false` and correcting after mount keeps
   * the markup identical on both sides — the alternative is a hydration mismatch
   * on every page load for a signed-in visitor. `repairSession()` first, because
   * the cookie may have expired while the token survived (see lib/auth/session.ts).
   */
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    AuthSession.repairSession();
    setSignedIn(AuthSession.isAuthenticated());

    // Signing out in another tab should take the dashboard button with it.
    const onStorage = () => setSignedIn(AuthSession.isAuthenticated());
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const tel = phone ? `tel:+91${phone}` : undefined;

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-[var(--border-soft)] bg-white/90 shadow-[var(--shadow-xs)] backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-20 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          {/* The old asset was a JPEG on a black field, so the square read as a
              dark tile with a logo lost inside it. This is the emblem alone, with
              a transparent background, contained rather than cropped. */}
          <span className="relative h-10 w-10 shrink-0">
            <Image src="/logo-mark.png" alt="Sulekha Engineering" fill sizes="40px" className="object-contain" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-[15px] font-semibold tracking-tight text-[var(--foreground)]">
              Sulekha Engineering
            </span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-soft)]">
              PM Surya Ghar vendor
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-[var(--muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Staff-facing entry point. A visitor sees Login; someone already
              signed in is offered the dashboard instead of a form they have
              no business filling in again. */}
          <Link
            href={signedIn ? '/dashboard' : '/login'}
            className="hidden items-center gap-2 rounded-full border border-[var(--border)] bg-white/70 px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--primary)] sm:inline-flex"
          >
            {signedIn ? (
              <LayoutDashboard className="h-4 w-4 text-[var(--primary)]" />
            ) : (
              <LogIn className="h-4 w-4 text-[var(--primary)]" />
            )}
            {signedIn ? 'Dashboard' : 'Login'}
          </Link>
          {tel && (
            <a
              href={tel}
              className="hidden items-center gap-2 rounded-full border border-[var(--border)] bg-white/70 px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--primary)] sm:inline-flex"
            >
              <Phone className="h-4 w-4 text-[var(--primary)]" />
              {phone}
            </a>
          )}
          <Link href="/enquiry" className="brand-button hidden !px-5 !py-2.5 text-sm sm:inline-flex">
            Free survey
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-soft)] bg-white text-[var(--foreground)] lg:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-[var(--border-soft)] bg-white px-4 pb-4 pt-2 lg:hidden">
          <nav className="flex flex-col">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={signedIn ? '/dashboard' : '/login'}
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-3 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
            >
              {signedIn ? 'Dashboard' : 'Login'}
            </Link>
            <Link href="/enquiry" onClick={() => setOpen(false)} className="brand-button mt-2 justify-center">
              Book a free site survey
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

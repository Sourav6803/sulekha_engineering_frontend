'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, LayoutDashboard, Menu, X } from 'lucide-react';
import { AuthSession } from '@/lib/auth/session';

/**
 * Nav is deliberately short. The page is long, but a visitor scanning the header
 * is deciding "is this about what I need", not looking for a table of contents —
 * seven labels at body size turned the bar into a second menu.
 */
const LINKS = [
  { href: '/projects', label: 'Our work' },
  { href: '/#savings', label: 'Savings' },
  { href: '/#equipment', label: 'Equipment' },
  { href: '/#panel-guide', label: 'Panel guide' },
  { href: '/#materials', label: 'Materials' },
  { href: '/#faq', label: 'FAQ' },
];

/**
 * The public site's own header.
 *
 * Not the dashboard's: a visitor has no account, so there is no sidebar, no
 * notification bell and no sign-out. The only ask is the enquiry CTA.
 *
 * The bar is solid from the first pixel. It used to start transparent and fill
 * in on scroll, which left the logo and links floating over the hero's gradient
 * and made the first screen look unfinished.
 */
export default function SiteHeader({ phone }: { phone?: string | null }) {
  const [open, setOpen] = useState(false);
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
    AuthSession.repairSession();
    setSignedIn(AuthSession.isAuthenticated());

    // Signing out in another tab should take the dashboard button with it.
    const onStorage = () => setSignedIn(AuthSession.isAuthenticated());
    window.addEventListener('storage', onStorage);

    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[rgba(250,249,243,0.96)] backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-[1180px] items-center justify-between gap-5 px-5 lg:h-[86px] lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Sulekha Engineering — home">
          {/* The old asset was a JPEG on a black field, so the square read as a
              dark tile with a logo lost inside it. This is the emblem alone, with
              a transparent background, contained rather than cropped. */}
          <span className="relative h-11 w-11 shrink-0">
            <Image src="/logo-mark.png" alt="" fill sizes="44px" className="object-contain" priority />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-[15px] font-semibold tracking-[-0.01em] text-[var(--foreground)]">
              Sulekha Engineering
            </span>
            <span className="mt-0.5 block text-[10px] font-medium text-[var(--muted-soft)]">
              Solar today. Better tomorrow.
            </span>
          </span>
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-6 lg:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[12px] font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {/* Staff entry point, kept as a quiet text link: it is not the audience
              the page is written for, so it should not compete with the CTA. */}
          <Link
            href={signedIn ? '/dashboard' : '/login'}
            className="hidden items-center gap-1 text-[12px] font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)] sm:inline-flex"
          >
            {signedIn ? 'Dashboard' : 'Staff login'}
            {signedIn ? (
              <LayoutDashboard className="h-3.5 w-3.5" />
            ) : (
              <ArrowUpRight className="h-3.5 w-3.5" />
            )}
          </Link>

          <Link href="/enquiry" className="brand-button hidden !rounded-[10px] !px-4 !py-2.5 text-[12.5px] sm:inline-flex">
            Book a free survey
            <ArrowRight className="ml-2 h-3.5 w-3.5" />
          </Link>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] lg:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-[var(--border)] bg-[var(--background)] px-5 pb-5 pt-2 lg:hidden">
          <nav aria-label="Mobile navigation" className="flex flex-col">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-[var(--border-soft)] px-1 py-3 text-sm font-medium text-[var(--foreground)]"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={signedIn ? '/dashboard' : '/login'}
              onClick={() => setOpen(false)}
              className="px-1 py-3 text-sm font-medium text-[var(--muted)]"
            >
              {signedIn ? 'Dashboard' : 'Staff login'}
            </Link>
            <Link
              href="/enquiry"
              onClick={() => setOpen(false)}
              className="brand-button mt-3 justify-center !rounded-[10px]"
            >
              Book a free survey
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            {phone && (
              <a href={`tel:+91${phone}`} className="mt-3 text-center text-[13px] font-medium text-[var(--muted)]">
                Call {phone}
              </a>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

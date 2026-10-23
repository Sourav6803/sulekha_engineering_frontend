import type { ReactNode } from 'react';
import SiteHeader from '@/components/site/SiteHeader';
import SiteFooter from '@/components/site/SiteFooter';
import { getHomeCached } from '@/lib/site/server-data';

/**
 * The public site's shell.
 *
 * A route group rather than a root layout change: the dashboard keeps its own
 * chrome, and a visitor never sees a sidebar, a notification bell or a sign-out.
 *
 * The company block is fetched here once and reused by every page under the
 * group, so the header phone number and the footer address are always the same
 * values the page itself renders.
 */
export default async function SiteLayout({ children }: { children: ReactNode }) {
  const home = await getHomeCached();
  const company = home?.company ?? null;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <SiteHeader phone={company?.phone ?? null} />
      <main className="flex-1">{children}</main>
      {company && <SiteFooter company={company} />}
    </div>
  );
}

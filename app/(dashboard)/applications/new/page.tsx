'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { PageContainer } from '@/components/shared/PageContainer';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { EmptyState } from '@/components/shared/EmptyState';
import { ApplicationWizard } from '@/components/features/applications/ApplicationWizard';
import { StartApplication } from '@/components/features/applications/StartApplication';
import { useAuth } from '@/hooks/useAuth';
import { canStartApplication } from '@/lib/permissions';

/**
 * `/applications/new` — two screens behind one URL.
 *
 *   ?id=<applicationId>  resume that draft (the server is the source of truth)
 *   ?customerId=<id>     opened from a customer record, already chosen
 *   bare                 choose the customer first
 *
 * Filing moved to the office: an agent collects the customer, the office checks
 * the papers and turns a verified customer into an application. The consumer's
 * identity is copied from the customer record at that moment, so the blank-form
 * entry that used to start here no longer exists.
 *
 * The `key` remounts the wizard when the target changes, so switching from the
 * "Continue your existing draft" banner actually reloads that application.
 */
function ApplicationFromParams() {
  const searchParams = useSearchParams();
  const applicationId = searchParams.get('id') ?? undefined;
  const customerId = searchParams.get('customerId') ?? undefined;

  if (applicationId) {
    return <ApplicationWizard key={applicationId} initialApplicationId={applicationId} />;
  }

  return <StartApplication key={customerId ?? 'pick'} initialCustomerId={customerId} />;
}

export default function NewApplicationPage() {
  const { user } = useAuth();
  const role = user?.role;
  const allowed = canStartApplication(role);

  if (role && !allowed) {
    return (
      <PageContainer className="canvas-warm">
        <Breadcrumbs
          items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Applications', href: '/applications' }, { label: 'New' }]}
        />
        <div className="panel">
          <EmptyState
            icon={ShieldAlert}
            title="The office files applications"
            description="A field agent collects the customer — KYC, bill and bank papers — under Customers. Once the office has checked those papers, the customer is turned into an application from here. Ask an admin or manager to file it, or open the customer to see where it stands."
            action={
              <Link href="/customers" className="neutral-button inline-flex items-center gap-1.5 px-4 py-2.5 text-sm">
                Go to customers
              </Link>
            }
          />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="canvas-warm">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Applications', href: '/applications' },
          { label: 'New application' },
        ]}
      />

      <div className="mt-3 min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--primary-active)]">
          Scheme application
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">New consumer application</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          Pick the verified customer, then work through the scheme steps. Every step saves as you go, so closing the tab
          does not cost you the draft.
        </p>
      </div>

      <div className="mt-4">
        {/* useSearchParams needs a Suspense boundary so the page can be
            prerendered without it. */}
        <Suspense fallback={<div className="skeleton h-64 w-full rounded-[1.25rem]" />}>
          <ApplicationFromParams />
        </Suspense>
      </div>
    </PageContainer>
  );
}

'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { PageContainer } from '@/components/shared/PageContainer';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { EmptyState } from '@/components/shared/EmptyState';
import { ApplicationWizard } from '@/components/features/applications/ApplicationWizard';
import { useAuth } from '@/hooks/useAuth';
import { canEditApplication } from '@/lib/permissions';

/**
 * The wizard, wired to the URL. `/applications/new?id=<applicationId>` resumes
 * an existing draft (the server is then the source of truth); a bare
 * `/applications/new` restores the entry saved on this device, if any.
 *
 * The `key` remounts the wizard when the target changes, so switching from the
 * "Continue your existing draft" banner actually reloads that application.
 */
function ApplicationWizardFromParams() {
  const searchParams = useSearchParams();
  const applicationId = searchParams.get('id') ?? undefined;

  return <ApplicationWizard key={applicationId ?? 'new'} initialApplicationId={applicationId} />;
}

/**
 * /applications/new — the field agent's intake wizard, and only theirs.
 *
 * The wizard writes consumer data (create / edit / upload / submit), and the
 * backend restricts every one of those routes to `agent`
 * (backend/src/routes/application.routes.js → FIELD_AGENT_ROLES). The office
 * (admin / manager) gets a clear explanation here rather than a form that would
 * only fail on its first save.
 */
export default function NewApplicationPage() {
  const { user } = useAuth();
  const role = user?.role;
  const allowed = canEditApplication(role);

  if (role && !allowed) {
    return (
      <PageContainer className="canvas-warm">
        <Breadcrumbs
          items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Applications', href: '/applications' }, { label: 'New' }]}
        />
        <div className="panel">
          <EmptyState
            icon={ShieldAlert}
            title="Only a field agent can draft an application"
            description="The office reads, reviews and moves applications along the workflow, but the consumer's data can only be written by the field agent who collected it — so the intake wizard is not available to the office role. Open an application to review it instead."
            action={
              <Link href="/applications" className="neutral-button inline-flex items-center gap-1.5 px-4 py-2.5 text-sm">
                Back to applications
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
          Field intake
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">New consumer application</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          Fill this in at the consumer&apos;s house. The draft is saved as you move between steps, so a weak signal never
          costs you the visit — you can close it and pick it up from your applications.
        </p>
      </div>

      <div className="mt-4">
        {/* useSearchParams needs a Suspense boundary so the page can be
            prerendered without it. */}
        <Suspense fallback={<div className="skeleton h-64 w-full rounded-[1.25rem]" />}>
          <ApplicationWizardFromParams />
        </Suspense>
      </div>
    </PageContainer>
  );
}

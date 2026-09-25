'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { PageContainer } from '@/components/shared/PageContainer';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { EmptyState } from '@/components/shared/EmptyState';
import { QuotationImportWizard } from '@/components/features/quotations/QuotationImportWizard';
import { useAuth } from '@/hooks/useAuth';
import { canImportQuotations } from '@/lib/permissions';

/**
 * One-off back-fill screen for the quotations that were made by hand before this
 * module existed. Admin only, matching the backend's import endpoints.
 */
export default function ImportQuotationsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const breadcrumbs = (
    <Breadcrumbs
      items={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Quotations', href: '/quotations' },
        { label: 'Import old quotations' },
      ]}
    />
  );

  if (!canImportQuotations(user?.role)) {
    return (
      <PageContainer>
        {breadcrumbs}
        <div className="mt-6">
          <EmptyState
            icon={ShieldAlert}
            title="Only an administrator can import old quotations"
            description="This screen writes to the quotation register, so it is restricted to admins."
            action={
              <button type="button" onClick={() => router.push('/quotations')} className="neutral-button">
                Back to quotations
              </button>
            }
          />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {breadcrumbs}

      <div className="mt-3 flex items-start gap-3">
        <button
          type="button"
          onClick={() => router.push('/quotations/serial')}
          className="mt-1 rounded p-1.5 text-[var(--secondary)] transition-colors hover:text-[var(--foreground)]"
          title="Back to the register"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Import old quotations</h1>
          <p className="text-sm text-[var(--muted)]">
            Bring the quotations you made manually into the register, keeping their existing numbers, and
            attach the scanned copies to them.
          </p>
        </div>
      </div>

      <div className="mt-4">
        <QuotationImportWizard />
      </div>
    </PageContainer>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/shared/PageContainer';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { EmptyState } from '@/components/shared/EmptyState';
import { QuotationForm } from '@/components/features/quotations/QuotationForm';
import { useQuotationDefaults, useQuotations } from '@/hooks/useQuotations';
import { useAuth } from '@/hooks/useAuth';
import { handleApiError } from '@/lib/errors/handleApiError';
import { canManageQuotations } from '@/lib/permissions';
import type { QuotationNextNumber, QuotationPayload } from '@/types/quotation';

export default function NewQuotationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const canEdit = canManageQuotations(user?.role);

  const { createQuotation, fetchNextNumber } = useQuotations();
  const { defaults } = useQuotationDefaults();

  const [nextNumber, setNextNumber] = useState<QuotationNextNumber | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNextNumber = useCallback(
    (schemeCode?: string) => {
      void fetchNextNumber({ schemeCode }).then(setNextNumber);
    },
    [fetchNextNumber]
  );

  // Preview the number the save will use. It is a preview only - the server
  // assigns the final number inside the create request.
  useEffect(() => {
    loadNextNumber();
  }, [loadNextNumber]);

  const handleSubmit = async (payload: QuotationPayload) => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await createQuotation(payload);
      toast.success('Quotation created', { description: response.message });
      router.push(`/quotations/${response.data._id}`);
    } catch (err) {
      const message = handleApiError(err);
      setError(message);
      toast.error('Could not create the quotation', { description: message });
    } finally {
      setSubmitting(false);
    }
  };

  if (!canEdit) {
    return (
      <PageContainer>
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Quotations', href: '/quotations' },
            { label: 'New' },
          ]}
        />
        <div className="mt-6">
          <EmptyState
            icon={ShieldAlert}
            title="You cannot create quotations"
            description="Only an administrator or manager can create and edit quotations. Ask an admin for access."
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
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Quotations', href: '/quotations' },
          { label: 'New' },
        ]}
      />

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push('/quotations')}
          className="rounded p-1.5 text-[var(--secondary)] transition-colors hover:text-[var(--foreground)]"
          title="Back to quotations"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">New quotation</h1>
          <p className="text-sm text-[var(--muted)]">
            The number is assigned automatically and appears in the register as soon as you save.
          </p>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--error)]">
          {error}
        </p>
      )}

      <div className="mt-4">
        <QuotationForm
          mode="create"
          submitting={submitting}
          nextNumber={nextNumber}
          defaults={defaults}
          onSchemeChange={loadNextNumber}
          onSubmit={handleSubmit}
        />
      </div>
    </PageContainer>
  );
}

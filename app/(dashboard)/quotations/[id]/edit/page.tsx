'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileQuestion, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/shared/PageContainer';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Modal } from '@/components/shared/Modal';
import { QuotationForm } from '@/components/features/quotations/QuotationForm';
import { quotationsApi } from '@/lib/api/quotations.api';
import { useAuth } from '@/hooks/useAuth';
import { useQuotationDefaults } from '@/hooks/useQuotations';
import { handleApiError } from '@/lib/errors/handleApiError';
import { canManageQuotations } from '@/lib/permissions';
import type { QuotationDocument, QuotationPayload } from '@/types/quotation';

export default function EditQuotationPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const { user } = useAuth();
  const canEdit = canManageQuotations(user?.role);
  const { defaults } = useQuotationDefaults();

  const [quotation, setQuotation] = useState<QuotationDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<QuotationPayload | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await quotationsApi.get(id);
      setQuotation(response.data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = (payload: QuotationPayload) => {
    setPending(payload);
    setConfirmOpen(true);
  };

  const confirmSave = async () => {
    if (!quotation || !pending) return;
    setSaving(true);
    try {
      const response = await quotationsApi.update(quotation._id, pending);
      const { warnings } = response.data;
      toast.success('Quotation updated', { description: response.message });
      warnings?.forEach((warning) => toast.warning('Please check', { description: warning }));
      router.push(`/quotations/${quotation._id}`);
    } catch (err) {
      toast.error('Could not save the changes', { description: handleApiError(err) });
      setConfirmOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const breadcrumbs = (
    <Breadcrumbs
      items={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Quotations', href: '/quotations' },
        { label: quotation?.quotationNo ?? 'Quotation', href: id ? `/quotations/${id}` : undefined },
        { label: 'Edit' },
      ]}
    />
  );

  if (loading) {
    return (
      <PageContainer>
        {breadcrumbs}
        <div className="mt-6">
          <LoadingSpinner label="Loading the quotation…" />
        </div>
      </PageContainer>
    );
  }

  if (!canEdit) {
    return (
      <PageContainer>
        {breadcrumbs}
        <div className="mt-6">
          <EmptyState
            icon={ShieldAlert}
            title="You cannot edit quotations"
            description="Only an administrator or manager can edit quotations."
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

  if (error || !quotation) {
    return (
      <PageContainer>
        {breadcrumbs}
        <div className="mt-6">
          <EmptyState
            icon={FileQuestion}
            title="Quotation not found"
            description={error ?? 'This quotation may have been removed.'}
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

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push(`/quotations/${quotation._id}`)}
          className="rounded p-1.5 text-[var(--secondary)] transition-colors hover:text-[var(--foreground)]"
          title="Back to the quotation"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Edit {quotation.quotationNo}</h1>
          <p className="text-sm text-[var(--muted)]">
            The number stays the same. Saving asks for confirmation first.
          </p>
        </div>
      </div>

      <div className="mt-4">
        <QuotationForm
          key={quotation._id}
          initial={quotation}
          mode="edit"
          // Records made before the business sheet existed carry no type, and
          // they are all consumer sheets.
          quotationType={quotation.quotationType ?? 'consumer'}
          submitting={saving}
          defaults={defaults}
          onSubmit={handleSubmit}
        />
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => {
          if (!saving) setConfirmOpen(false);
        }}
        title="Save changes?"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="neutral-button" disabled={saving} onClick={() => setConfirmOpen(false)}>
              Cancel
            </button>
            <button type="button" className="brand-button" disabled={saving} onClick={() => void confirmSave()}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-[var(--secondary)]">
          Save changes to <strong>{quotation.quotationNo}</strong> ({quotation.customerName})? The SL number
          register entry and the printed quotation will both show the new values.
        </p>
      </Modal>
    </PageContainer>
  );
}

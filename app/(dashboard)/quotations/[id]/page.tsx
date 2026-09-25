'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileQuestion } from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/shared/PageContainer';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { QuotationDetailView } from '@/components/features/quotations/QuotationDetailView';
import { DeleteQuotationDialog } from '@/components/features/quotations/DeleteQuotationDialog';
import { quotationsApi } from '@/lib/api/quotations.api';
import { useAuth } from '@/hooks/useAuth';
import { handleApiError } from '@/lib/errors/handleApiError';
import { canDeleteQuotation, canDownloadQuotationPdf, canManageQuotations } from '@/lib/permissions';
import type { QuotationDocument, QuotationStatus } from '@/types/quotation';

export default function QuotationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const { user } = useAuth();

  const canEdit = canManageQuotations(user?.role);
  const canDelete = canDeleteQuotation(user?.role);
  const canDownload = canDownloadQuotationPdf(user?.role);

  const [quotation, setQuotation] = useState<QuotationDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

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

  const handleStatusChange = async (status: QuotationStatus) => {
    if (!quotation) return;
    try {
      await quotationsApi.changeStatus(quotation._id, status);
      toast.success('Status updated', { description: `${quotation.quotationNo} is now ${status}.` });
      await load();
    } catch (err) {
      toast.error('Could not change the status', { description: handleApiError(err) });
    }
  };

  const confirmDelete = async () => {
    if (!quotation) return;
    setDeleteBusy(true);
    try {
      const response = await quotationsApi.remove(quotation._id);
      toast.success('Quotation deleted', { description: response.message });
      router.push('/quotations');
    } catch (err) {
      toast.error('Could not delete the quotation', { description: handleApiError(err) });
    } finally {
      setDeleteBusy(false);
      setDeleteOpen(false);
    }
  };

  const breadcrumbs = (
    <Breadcrumbs
      items={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Quotations', href: '/quotations' },
        { label: quotation?.quotationNo ?? 'Quotation' },
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
          onClick={() => router.push('/quotations')}
          className="rounded p-1.5 text-[var(--secondary)] transition-colors hover:text-[var(--foreground)]"
          title="Back to quotations"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-sm text-[var(--muted)]">Quotation details</span>
      </div>

      <div className="mt-4">
        <QuotationDetailView
          quotation={quotation}
          canEdit={canEdit}
          canDelete={canDelete}
          canDownload={canDownload}
          onEdit={() => router.push(`/quotations/${quotation._id}/edit`)}
          onDelete={() => setDeleteOpen(true)}
          onStatusChange={(status) => void handleStatusChange(status)}
          onRefresh={() => void load()}
        />
      </div>

      <DeleteQuotationDialog
        open={deleteOpen}
        quotationNo={quotation.quotationNo}
        customerName={quotation.customerName}
        busy={deleteBusy}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteOpen(false)}
      />
    </PageContainer>
  );
}

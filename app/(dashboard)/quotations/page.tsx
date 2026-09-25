'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, ListOrdered, Plus, RotateCcw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/shared/PageContainer';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { Modal } from '@/components/shared/Modal';
import { Pagination } from '@/components/shared/Pagination';
import { StatCard } from '@/components/shared/StatCard';
import { QuotationTable } from '@/components/features/quotations/QuotationTable';
import { QuotationForm } from '@/components/features/quotations/QuotationForm';
import { DeleteQuotationDialog } from '@/components/features/quotations/DeleteQuotationDialog';
import { useQuotationDefaults, useQuotations } from '@/hooks/useQuotations';
import { useAuth } from '@/hooks/useAuth';
import { quotationsApi } from '@/lib/api/quotations.api';
import { downloadBlob } from '@/lib/downloadBlob';
import { handleApiError } from '@/lib/errors/handleApiError';
import { formatINR } from '@/lib/format';
import { canDeleteQuotation, canDownloadQuotationPdf, canManageQuotations } from '@/lib/permissions';
import type { SortOrder } from '@/components/shared/DataTable';
import type {
  QuotationDocument,
  QuotationListQuery,
  QuotationStats,
  QuotationStatus,
} from '@/types/quotation';

const SCHEMES = ['PMSGY', 'GP', 'SOLAR', 'MBECL'];
const STATUSES: QuotationStatus[] = ['draft', 'sent', 'accepted', 'rejected', 'expired', 'converted'];

/** Current financial year and the two before it, newest first. */
const financialYearOptions = (): string[] => {
  const now = new Date();
  const startYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return [0, 1, 2].map((offset) => {
    const from = startYear - offset;
    return `${from}-${String(from + 1).slice(2)}`;
  });
};

export default function QuotationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const role = user?.role;
  const canEdit = canManageQuotations(role);
  const canDelete = canDeleteQuotation(role);
  const canDownload = canDownloadQuotationPdf(role);

  const {
    quotations,
    pagination,
    loading,
    fetchQuotations,
    updateQuotation,
    deleteQuotation,
    fetchStats,
  } = useQuotations();

  const { defaults } = useQuotationDefaults();

  const [query, setQuery] = useState<QuotationListQuery>({
    page: 1,
    limit: 20,
    sortBy: 'quotationSeq',
    sortOrder: 'desc',
  });
  const [searchInput, setSearchInput] = useState('');
  const [stats, setStats] = useState<QuotationStats | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery((prev) => ({ ...prev, search: searchInput.trim() || undefined, page: 1 }));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    void fetchQuotations(query).catch(() => undefined);
  }, [query, fetchQuotations]);

  useEffect(() => {
    void fetchStats({ financialYear: query.financialYear }).then(setStats);
  }, [fetchStats, query.financialYear]);

  const handleSort = (sortBy: string, sortOrder: SortOrder) => {
    setQuery((prev) => ({ ...prev, sortBy, sortOrder }));
  };

  // ---- Edit ----
  const [editing, setEditing] = useState<QuotationDocument | null>(null);
  const [updateConfirmOpen, setUpdateConfirmOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<Parameters<typeof updateQuotation>[1] | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleFormSubmit = (payload: Parameters<typeof updateQuotation>[1]) => {
    setFormError(null);
    setPendingPayload(payload);
    setUpdateConfirmOpen(true);
  };

  const confirmUpdate = async () => {
    if (!editing || !pendingPayload) return;
    setFormBusy(true);
    try {
      const response = await updateQuotation(editing._id, pendingPayload);
      await fetchQuotations(query);
      toast.success('Quotation updated', {
        description: `${response.data.quotation.quotationNo} — ${response.message}`,
      });
      setUpdateConfirmOpen(false);
      setEditing(null);
      setPendingPayload(null);
    } catch (err) {
      const message = handleApiError(err);
      setFormError(message);
      toast.error('Could not update the quotation', { description: message });
      setUpdateConfirmOpen(false);
    } finally {
      setFormBusy(false);
    }
  };

  // ---- Delete ----
  const [deleting, setDeleting] = useState<QuotationDocument | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      const response = await deleteQuotation(deleting._id);
      await fetchQuotations(query);
      toast.success('Quotation deleted', { description: response.message });
      setDeleting(null);
    } catch (err) {
      toast.error('Could not delete the quotation', { description: handleApiError(err) });
    } finally {
      setDeleteBusy(false);
    }
  };

  // ---- Document ----
  const handleDownloadPdf = useCallback(async (quotation: QuotationDocument) => {
    try {
      const buffer = await quotationsApi.downloadPdf(quotation._id);
      downloadBlob(
        buffer,
        `${quotation.quotationNo.replace(/[/\\]/g, '-')}-${quotation.customerName}`
          .replace(/[^\w.\- ]+/g, '')
          .slice(0, 120) + '.pdf'
      );
    } catch (err) {
      toast.error('Could not download the PDF', { description: handleApiError(err) });
    }
  }, []);

  const handlePrint = useCallback(async (quotation: QuotationDocument) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Allow pop-ups to print the quotation');
      return;
    }
    printWindow.document.write('<p style="font-family:Arial;padding:24px">Preparing the quotation…</p>');
    try {
      const html = await quotationsApi.printHtml(quotation._id);
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
    } catch (err) {
      printWindow.close();
      toast.error('Could not open the print view', { description: handleApiError(err) });
    }
  }, []);

  const resetFilters = () => {
    setSearchInput('');
    setQuery({ page: 1, limit: 20, sortBy: 'quotationSeq', sortOrder: 'desc' });
  };

  const filtersActive = Boolean(query.search || query.status || query.schemeCode || query.financialYear);

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Quotations' }]} />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Quotations</h1>
          <p className="text-sm text-[var(--muted)]">
            Every quotation shares one record with the SL number register — editing or deleting here
            updates both.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/quotations/serial"
            className="neutral-button inline-flex items-center gap-1.5 px-3 py-2 text-sm"
          >
            <ListOrdered className="h-4 w-4" /> SL number register
          </Link>
          {canEdit && (
            <Link href="/quotations/new" className="brand-button inline-flex items-center gap-1.5 px-4 py-2 text-sm">
              <Plus className="h-4 w-4" /> New quotation
            </Link>
          )}
        </div>
      </div>

      {stats && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Quotations this year" value={String(stats.totalQuotations)} icon={FileText} />
          <StatCard
            label="Value"
            value={`₹${formatINR(stats.totalAmount)}`}
            icon={FileText}
            hint={stats.financialYear}
          />
          <StatCard label="Accepted" value={String(stats.byStatus?.accepted ?? 0)} icon={FileText} />
          <StatCard
            label="Next number"
            value={stats.nextNumber.replace(/^.*\//, '/')}
            icon={ListOrdered}
            hint={stats.nextNumber.split('/').slice(0, 3).join('/')}
          />
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            className="form-input pl-9"
            placeholder="Search number, customer, consumer id or mobile"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>

        <select
          className="form-input w-auto"
          value={query.financialYear ?? ''}
          onChange={(event) =>
            setQuery((prev) => ({ ...prev, financialYear: event.target.value || undefined, page: 1 }))
          }
        >
          <option value="">All years</option>
          {financialYearOptions().map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        <select
          className="form-input w-auto"
          value={query.schemeCode ?? ''}
          onChange={(event) => setQuery((prev) => ({ ...prev, schemeCode: event.target.value || undefined, page: 1 }))}
        >
          <option value="">All schemes</option>
          {SCHEMES.map((scheme) => (
            <option key={scheme} value={scheme}>
              {scheme}
            </option>
          ))}
        </select>

        <select
          className="form-input w-auto"
          value={query.status ?? ''}
          onChange={(event) =>
            setQuery((prev) => ({
              ...prev,
              status: (event.target.value || undefined) as QuotationStatus | undefined,
              page: 1,
            }))
          }
        >
          <option value="">All statuses</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        {filtersActive && (
          <button type="button" onClick={resetFilters} className="neutral-button inline-flex items-center gap-1.5 px-3 py-2 text-sm">
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
        )}
      </div>

      <div className="mt-4">
        <QuotationTable
          quotations={quotations}
          loading={loading}
          sortBy={query.sortBy}
          sortOrder={query.sortOrder as SortOrder | undefined}
          onSort={handleSort}
          onEdit={canEdit ? (quotation) => setEditing(quotation) : undefined}
          onDelete={canDelete ? (quotation) => setDeleting(quotation) : undefined}
          onDownloadPdf={canDownload ? handleDownloadPdf : undefined}
          onPrint={handlePrint}
          canEdit={canEdit}
          canDelete={canDelete}
          canDownload={canDownload}
          emptyAction={
            canEdit ? (
              <button type="button" onClick={() => router.push('/quotations/new')} className="brand-button">
                New quotation
              </button>
            ) : null
          }
        />
      </div>

      <div className="px-4">
        <Pagination pagination={pagination} onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))} />
      </div>

      {/* Edit */}
      <Modal
        open={Boolean(editing)}
        onClose={() => {
          if (formBusy) return;
          setEditing(null);
          setFormError(null);
        }}
        title="Edit quotation"
        eyebrow={editing?.quotationNo}
        size="lg"
      >
        {formError && (
          <p role="alert" className="mb-3 rounded-lg bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--error)]">
            {formError}
          </p>
        )}
        {editing && (
          <QuotationForm
            key={editing._id}
            initial={editing}
            mode="edit"
            submitting={formBusy}
            defaults={defaults}
            onSubmit={handleFormSubmit}
          />
        )}
      </Modal>

      {/* Update confirmation — editing is deliberate, so it asks first */}
      <Modal
        open={updateConfirmOpen}
        onClose={() => {
          if (!formBusy) setUpdateConfirmOpen(false);
        }}
        title="Save changes?"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="neutral-button"
              disabled={formBusy}
              onClick={() => setUpdateConfirmOpen(false)}
            >
              Cancel
            </button>
            <button type="button" className="brand-button" disabled={formBusy} onClick={() => void confirmUpdate()}>
              {formBusy ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-[var(--secondary)]">
          Save changes to <strong>{editing?.quotationNo}</strong> ({editing?.customerName})? The SL number
          register entry and the printed quotation will both show the new values.
        </p>
      </Modal>

      {/* Delete */}
      <DeleteQuotationDialog
        open={Boolean(deleting)}
        quotationNo={deleting?.quotationNo ?? ''}
        customerName={deleting?.customerName ?? ''}
        busy={deleteBusy}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      />
    </PageContainer>
  );
}

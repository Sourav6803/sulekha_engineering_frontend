'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, FileText, Plus, RotateCcw, Search, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/shared/PageContainer';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { Pagination } from '@/components/shared/Pagination';
import { QuotationSerialTable } from '@/components/features/quotations/QuotationSerialTable';
import { DeleteQuotationDialog } from '@/components/features/quotations/DeleteQuotationDialog';
import { useQuotations } from '@/hooks/useQuotations';
import { useAuth } from '@/hooks/useAuth';
import { handleApiError } from '@/lib/errors/handleApiError';
import { canDeleteQuotation, canImportQuotations, canManageQuotations } from '@/lib/permissions';
import type { PaginationInfo } from '@/types/api';
import type { QuotationNextNumber, QuotationRegisterRow } from '@/types/quotation';

/** Current financial year and the two before it. */
const financialYearOptions = (): string[] => {
  const now = new Date();
  const startYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return [0, 1, 2].map((offset) => {
    const from = startYear - offset;
    return `${from}-${String(from + 1).slice(2)}`;
  });
};

/**
 * Quotation SL Number — the live version of the old "QUOTATION SL NUMBUR" sheet
 * (SL NO | QUOTATION NO | DETAILS | DATE). Deleting a row here removes the
 * quotation as well, because both views read the same record.
 */
export default function QuotationSerialPage() {
  const { user } = useAuth();
  const role = user?.role;
  const canEdit = canManageQuotations(role);
  const canDelete = canDeleteQuotation(role);
  const canImport = canImportQuotations(role);

  const { fetchRegister, fetchNextNumber, deleteQuotation } = useQuotations();

  const [rows, setRows] = useState<QuotationRegisterRow[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 50, total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);
  const [nextNumber, setNextNumber] = useState<QuotationNextNumber | null>(null);

  const [page, setPage] = useState(1);
  const [financialYear, setFinancialYear] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchRegister({
        page,
        limit: 50,
        financialYear: financialYear || undefined,
        search: search || undefined,
      });
      setRows(result.rows);
      setPagination(result.pagination);
    } catch (err) {
      toast.error('Could not load the register', { description: handleApiError(err) });
    } finally {
      setLoading(false);
    }
  }, [fetchRegister, page, financialYear, search]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void fetchNextNumber().then(setNextNumber);
  }, [fetchNextNumber]);

  // ---- Delete (same modal wording as the quotation sheet) ----
  const [deleting, setDeleting] = useState<QuotationRegisterRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      const response = await deleteQuotation(deleting.id);
      await load();
      void fetchNextNumber().then(setNextNumber);
      toast.success('Quotation deleted', { description: response.message });
      setDeleting(null);
    } catch (err) {
      toast.error('Could not delete the quotation', { description: handleApiError(err) });
    } finally {
      setDeleteBusy(false);
    }
  };

  const filtersActive = Boolean(search || financialYear);

  return (
    <PageContainer>
      <Breadcrumbs
        items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Quotations', href: '/quotations' }, { label: 'SL number' }]}
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Quotation SL Number</h1>
          <p className="text-sm text-[var(--muted)]">
            The serial register — the same four columns as your sheet, kept in step with the quotations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/quotations" className="neutral-button inline-flex items-center gap-1.5 px-3 py-2 text-sm">
            <FileText className="h-4 w-4" /> Quotations
          </Link>
          {canImport && (
            <Link
              href="/quotations/import"
              className="neutral-button inline-flex items-center gap-1.5 px-3 py-2 text-sm"
            >
              <Upload className="h-4 w-4" /> Import old quotations
            </Link>
          )}
          {canEdit && (
            <Link href="/quotations/new" className="brand-button inline-flex items-center gap-1.5 px-4 py-2 text-sm">
              <Plus className="h-4 w-4" /> New quotation
            </Link>
          )}
        </div>
      </div>

      {nextNumber && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3">
          <span className="text-sm text-[var(--secondary)]">Next quotation number</span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--foreground)]">
            <ArrowRight className="h-4 w-4 text-[var(--primary)]" />
            {nextNumber.quotationNo}
          </span>
          <span className="text-xs text-[var(--muted)]">
            highest in use: {nextNumber.basedOnMaxSequence ?? 0}
          </span>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            className="form-input pl-9"
            placeholder="Search quotation number or customer"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>

        <select
          className="form-input w-auto"
          value={financialYear}
          onChange={(event) => {
            setFinancialYear(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All years</option>
          {financialYearOptions().map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        {filtersActive && (
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              setFinancialYear('');
              setPage(1);
            }}
            className="neutral-button inline-flex items-center gap-1.5 px-3 py-2 text-sm"
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
        )}
      </div>

      <div className="mt-4">
        <QuotationSerialTable
          rows={rows}
          loading={loading}
          onDelete={canDelete ? (row) => setDeleting(row) : undefined}
          canEdit={canEdit}
          canDelete={canDelete}
          emptyAction={
            canEdit ? (
              <Link href="/quotations/new" className="brand-button">
                New quotation
              </Link>
            ) : null
          }
        />
      </div>

      <div className="px-4">
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      <p className="mt-2 px-4 text-xs text-[var(--muted)]">
        Deleting a row here deletes the quotation itself (soft delete) — it disappears from the quotation
        list too, and its number becomes free again if it was the highest of the year.
      </p>

      <DeleteQuotationDialog
        open={Boolean(deleting)}
        quotationNo={deleting?.quotationNo ?? ''}
        customerName={deleting?.details ?? ''}
        busy={deleteBusy}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      />
    </PageContainer>
  );
}

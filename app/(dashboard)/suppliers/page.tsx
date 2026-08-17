'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, RotateCcw, Search, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/shared/PageContainer';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { Modal } from '@/components/shared/Modal';
import { Pagination } from '@/components/shared/Pagination';
import { SupplierTable } from '@/components/features/suppliers/SupplierTable';
import { SupplierForm } from '@/components/features/suppliers/SupplierForm';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useAuth } from '@/hooks/useAuth';
import { handleApiError } from '@/lib/errors/handleApiError';
import { canDeleteSupplier, canManageSuppliers, canViewSuppliers } from '@/lib/permissions';
import type { SupplierListQuery } from '@/lib/api/suppliers.api';
import type { SupplierDocument, SupplierStatus, SupplierBusinessType } from '@/types/supplier';
import type { SortOrder } from '@/components/shared/DataTable';

const STATUSES: SupplierStatus[] = ['active', 'inactive', 'suspended', 'blacklisted'];
const BUSINESS_TYPES: SupplierBusinessType[] = ['manufacturer', 'distributor', 'wholesaler', 'retailer', 'importer'];

export default function SuppliersPage() {
  const { user } = useAuth();
  const role = user?.role;
  const canView = canViewSuppliers(role);
  const canEdit = canManageSuppliers(role);
  const canDelete = canDeleteSupplier(role);

  const { suppliers, pagination, loading, fetchSuppliers, createSupplier, updateSupplier, deleteSupplier } =
    useSuppliers();

  const [query, setQuery] = useState<SupplierListQuery>({ page: 1, limit: 20, sortBy: 'name', sortOrder: 'asc' });
  const [searchInput, setSearchInput] = useState('');

  const resetFilters = () => {
    setSearchInput('');
    setQuery({ page: 1, limit: 20, sortBy: 'name', sortOrder: 'asc' });
  };

  const handleSort = (sortBy: string, sortOrder: SortOrder) => {
    setQuery((prev) => ({ ...prev, sortBy, sortOrder }));
  };

  const handlePageChange = (page: number) => {
    setQuery((prev) => ({ ...prev, page }));
  };

  // Debounced search → query.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery((prev) => ({ ...prev, search: searchInput.trim() || undefined, page: 1 }));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  // Fetch the list whenever the query changes.
  useEffect(() => {
    const params: SupplierListQuery = {
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      status: query.status,
      businessType: query.businessType,
      category: query.category,
      search: query.search,
      hasGST: query.hasGST,
      minRating: query.minRating,
    };
    void fetchSuppliers(params);
  }, [query, fetchSuppliers]);

  const activeFilterCount = useMemo(
    () =>
      Number(Boolean(query.status)) +
      Number(Boolean(query.businessType)) +
      Number(Boolean(query.category)) +
      Number(Boolean(query.search)) +
      Number(Boolean(query.hasGST)) +
      Number(Boolean(query.minRating)),
    [query.status, query.businessType, query.category, query.search, query.hasGST, query.minRating]
  );

  // ---- Modals & mutations ----
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierDocument | null>(null);
  const [deleting, setDeleting] = useState<SupplierDocument | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const formOpen = createOpen || Boolean(editing);

  const openCreate = () => {
    setFormError(null);
    setCreateOpen(true);
  };

  const openEdit = (supplier: SupplierDocument) => {
    setFormError(null);
    setEditing(supplier);
  };

  const closeForm = () => {
    if (formBusy) return;
    setCreateOpen(false);
    setEditing(null);
    setFormError(null);
  };

  const handleFormSubmit = useCallback(
    async (payload: Parameters<typeof createSupplier>[0]) => {
      setFormBusy(true);
      setFormError(null);
      try {
        if (editing) {
          await updateSupplier(editing._id, payload);
          toast.success('Supplier updated', { description: `"${payload.name ?? editing.name}" has been saved.` });
        } else {
          await createSupplier(payload);
          toast.success('Supplier created', { description: `"${payload.name}" has been added.` });
        }
        await fetchSuppliers(query);
        setCreateOpen(false);
        setEditing(null);
      } catch (err) {
        const message = handleApiError(err);
        setFormError(message);
        toast.error('Could not save supplier', { description: message });
      } finally {
        setFormBusy(false);
      }
    },
    [editing, updateSupplier, createSupplier, fetchSuppliers, query]
  );

  const handleDelete = useCallback(async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    setActionError(null);
    try {
      await deleteSupplier(deleting._id);
      await fetchSuppliers(query);
      setDeleting(null);
      toast.success('Supplier deleted', { description: `"${deleting.name}" has been deactivated.` });
    } catch (err) {
      const message = handleApiError(err);
      setActionError(message);
      toast.error('Could not delete supplier', { description: message });
      setDeleting(null);
    } finally {
      setDeleteBusy(false);
    }
  }, [deleting, deleteSupplier, fetchSuppliers, query]);

  if (!canView) {
    return (
      <PageContainer>
        <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }]} />
        <div className="surface-card mt-8">
          <EmptyState
            icon={Building2}
            title="Access restricted"
            description="You do not have permission to view suppliers."
          />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      header={
        <div className="space-y-4">
          <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Suppliers' }]} />
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">Procurement</p>
              <h1 className="mt-2 text-3xl font-semibold text-[var(--foreground)]">Suppliers</h1>
              <p className="mt-2 max-w-2xl text-base text-[var(--muted)]">
                Manage vendor contacts, categories, payment terms and performance tracking for procurement operations.
              </p>
            </div>
            {canEdit && (
              <button type="button" className="brand-button" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                New supplier
              </button>
            )}
          </div>
        </div>
      }
    >
      {actionError && (
        <div role="alert" className="rounded-lg border border-[var(--error)] bg-[var(--error-tint)] p-4 text-sm text-[var(--error)]">
          {actionError}
        </div>
      )}

      {/* Filters */}
      <section className="surface-card overflow-hidden">
        <div className="border-b border-[var(--border-soft)] px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[var(--foreground)]">Filters</h2>
              <p className="text-xs text-[var(--muted-soft)]">
                {activeFilterCount > 0
                  ? `${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active`
                  : 'Search and filter suppliers'}
              </p>
            </div>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--error)] transition-colors hover:border-[var(--error)] hover:bg-[var(--error-tint)]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Clear filters
              </button>
            )}
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto_auto]">
            {/* Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-soft)]" />
              <input
                className="form-input !pl-10"
                placeholder="Search by name, phone, email, ID…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                aria-label="Search suppliers"
              />
            </div>

            {/* Status */}
            <div className="relative">
              <select
                className="form-input appearance-none pr-10"
                value={query.status ?? ''}
                onChange={(e) =>
                  setQuery((prev) => ({ ...prev, status: (e.target.value || undefined) as SupplierStatus | undefined, page: 1 }))
                }
                aria-label="Filter by status"
              >
                <option value="">All statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s[0].toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[var(--muted-soft)]">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </div>

            {/* Business type */}
            <div className="relative">
              <select
                className="form-input appearance-none pr-10"
                value={query.businessType ?? ''}
                onChange={(e) =>
                  setQuery((prev) => ({ ...prev, businessType: (e.target.value || undefined) as SupplierBusinessType | undefined, page: 1 }))
                }
                aria-label="Filter by business type"
              >
                <option value="">All types</option>
                {BUSINESS_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type[0].toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[var(--muted-soft)]">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </div>

            {/* Has GST toggle */}
            <label className="inline-flex cursor-pointer items-center gap-2.5 rounded-lg border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-all hover:border-[var(--primary)] hover:bg-[var(--surface-muted)]">
              <input
                type="checkbox"
                checked={Boolean(query.hasGST)}
                onChange={(e) => setQuery((prev) => ({ ...prev, hasGST: e.target.checked || undefined, page: 1 }))}
                className="h-4 w-4 rounded border-[var(--border)] accent-[var(--primary)]"
              />
              <span>Has GST</span>
            </label>
          </div>

          {/* Active filters */}
          {activeFilterCount > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-[var(--muted)]">Active:</span>
              {query.status && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-medium text-[var(--foreground)]">
                  Status: {query.status}
                  <button
                    type="button"
                    onClick={() => setQuery((prev) => ({ ...prev, status: undefined, page: 1 }))}
                    className="text-[var(--muted)] hover:text-[var(--error)]"
                    aria-label="Clear status filter"
                  >
                    ×
                  </button>
                </span>
              )}
              {query.businessType && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-medium text-[var(--foreground)]">
                  Type: {query.businessType}
                  <button
                    type="button"
                    onClick={() => setQuery((prev) => ({ ...prev, businessType: undefined, page: 1 }))}
                    className="text-[var(--muted)] hover:text-[var(--error)]"
                    aria-label="Clear business type filter"
                  >
                    ×
                  </button>
                </span>
              )}
              {query.category && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-medium text-[var(--foreground)]">
                  Category: {query.category}
                  <button
                    type="button"
                    onClick={() => setQuery((prev) => ({ ...prev, category: undefined, page: 1 }))}
                    className="text-[var(--muted)] hover:text-[var(--error)]"
                    aria-label="Clear category filter"
                  >
                    ×
                  </button>
                </span>
              )}
              {query.hasGST && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-medium text-[var(--foreground)]">
                  Has GST
                  <button
                    type="button"
                    onClick={() => setQuery((prev) => ({ ...prev, hasGST: undefined, page: 1 }))}
                    className="text-[var(--muted)] hover:text-[var(--error)]"
                    aria-label="Clear GST filter"
                  >
                    ×
                  </button>
                </span>
              )}
              {query.minRating != null && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-medium text-[var(--foreground)]">
                  Rating ≥ {query.minRating}
                  <button
                    type="button"
                    onClick={() => setQuery((prev) => ({ ...prev, minRating: undefined, page: 1 }))}
                    className="text-[var(--muted)] hover:text-[var(--error)]"
                    aria-label="Clear rating filter"
                  >
                    ×
                  </button>
                </span>
              )}
              {query.search && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-medium text-[var(--foreground)]">
                  Search: &ldquo;{query.search}&rdquo;
                  <button
                    type="button"
                    onClick={() => { setSearchInput(''); setQuery((prev) => ({ ...prev, search: undefined, page: 1 })); }}
                    className="text-[var(--muted)] hover:text-[var(--error)]"
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Table */}
      <section className="surface-card overflow-hidden p-2 sm:p-4">
        <SupplierTable
          suppliers={suppliers}
          loading={loading}
          sortBy={query.sortBy}
          sortOrder={query.sortOrder}
          onSort={handleSort}
          onEdit={canEdit ? openEdit : undefined}
          onDelete={canDelete ? setDeleting : undefined}
          canEdit={canEdit}
          canDelete={canDelete}
          emptyAction={
            canEdit ? (
              <button type="button" className="brand-button" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                New supplier
              </button>
            ) : undefined
          }
        />
        <div className="px-4">
          <Pagination pagination={pagination} onPageChange={handlePageChange} />
        </div>
      </section>

      {/* Create / Edit modal */}
      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? 'Edit supplier' : 'New supplier'}
        eyebrow={editing ? 'Update supplier record' : 'Add new supplier'}
        size="lg"
      >
        {formError && (
          <div role="alert" className="mb-5 rounded-lg border border-[var(--error)] bg-[var(--error-tint)] p-4 text-sm text-[var(--error)]">
            {formError}
          </div>
        )}
        <SupplierForm
          key={editing?._id ?? 'create'}
          initial={editing}
          mode={editing ? 'edit' : 'create'}
          submitting={formBusy}
          onSubmit={handleFormSubmit}
        />
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Deactivate supplier"
        message={`Are you sure you want to deactivate "${deleting?.name}"? This will mark the supplier as inactive. This cannot be undone.`}
        confirmLabel="Deactivate supplier"
        busy={deleteBusy}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </PageContainer>
  );
}

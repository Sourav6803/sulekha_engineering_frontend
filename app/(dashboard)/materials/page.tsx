'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, RotateCcw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/shared/PageContainer';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { Modal } from '@/components/shared/Modal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Pagination } from '@/components/shared/Pagination';
import { StockSummaryCards } from '@/components/features/materials/StockSummaryCards';
import { MaterialTable } from '@/components/features/materials/MaterialTable';
import { MaterialForm } from '@/components/features/materials/MaterialForm';
import { useMaterials } from '@/hooks/useMaterials';
import { useAuth } from '@/hooks/useAuth';
import { handleApiError } from '@/lib/errors/handleApiError';
import { canDeleteMaterial, canManageMaterials } from '@/lib/permissions';
import type { MaterialListQuery } from '@/lib/api/materials.api';
import type { MaterialDocument, MaterialStatus } from '@/types/material';
import type { SortOrder } from '@/components/shared/DataTable';

const STATUSES: MaterialStatus[] = ['active', 'inactive', 'discontinued'];

export default function MaterialsPage() {
  const { user } = useAuth();
  const role = user?.role;
  // console.log('User role:', role);
  const canEdit = canManageMaterials(role);
  // console.log('User role:', role, 'Can edit materials:', canEdit);
  const canDelete = canDeleteMaterial(role);

  const { materials, pagination, loading, fetchMaterials, createMaterial, updateMaterial, deleteMaterial, getSummary } =
    useMaterials();

  const [query, setQuery] = useState<MaterialListQuery>({ page: 1, limit: 20, sortBy: 'name', sortOrder: 'asc' });
  const [searchInput, setSearchInput] = useState('');

  const [summary, setSummary] = useState<Awaited<ReturnType<typeof getSummary>>>(null);

  // Debounced search → query.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery((prev) => ({ ...prev, search: searchInput.trim() || undefined, page: 1 }));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  // Fetch the list whenever the query changes.
  useEffect(() => {
    const params: MaterialListQuery = {
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      status: query.status,
      search: query.search,
      lowStock: query.lowStock ? true : undefined,
    };
    void fetchMaterials(params);
  }, [query, fetchMaterials]);

  // Load summary once.
  useEffect(() => {
    void getSummary().then(setSummary);
  }, [getSummary]);

  const activeFilterCount = useMemo(
    () =>
      Number(Boolean(query.status)) +
      Number(Boolean(query.search)) +
      Number(Boolean(query.lowStock)),
    [query.status, query.search, query.lowStock]
  );

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

  // ---- Modals & mutations ----
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<MaterialDocument | null>(null);
  const [deleting, setDeleting] = useState<MaterialDocument | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const formOpen = createOpen || Boolean(editing);

  const openCreate = () => {
    setFormError(null);
    setCreateOpen(true);
  };

  const openEdit = (material: MaterialDocument) => {
    setFormError(null);
    setEditing(material);
  };

  const closeForm = () => {
    if (formBusy) return;
    setCreateOpen(false);
    setEditing(null);
    setFormError(null);
  };

  const handleFormSubmit = useCallback(
    async (payload: Parameters<typeof createMaterial>[0]) => {
      setFormBusy(true);
      setFormError(null);
      try {
        if (editing) {
          await updateMaterial(editing._id, payload);
          toast.success('Material updated', { description: `"${payload.name ?? editing.name}" has been saved.` });
        } else {
          await createMaterial(payload);
          toast.success('Material created', { description: `"${payload.name}" has been added to inventory.` });
        }
        await fetchMaterials(query);
        setCreateOpen(false);
        setEditing(null);
      } catch (err) {
        const message = handleApiError(err);
        setFormError(message);
        toast.error('Could not save material', { description: message });
      } finally {
        setFormBusy(false);
      }
    },
    [editing, updateMaterial, createMaterial, fetchMaterials, query]
  );

  const handleDelete = useCallback(async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    setActionError(null);
    try {
      await deleteMaterial(deleting._id);
      await fetchMaterials(query);
      setDeleting(null);
      toast.success('Material deleted', { description: `"${deleting.name}" has been removed from inventory.` });
    } catch (err) {
      const message = handleApiError(err);
      setActionError(message);
      toast.error('Could not delete material', { description: message });
      setDeleting(null);
    } finally {
      setDeleteBusy(false);
    }
  }, [deleting, deleteMaterial, fetchMaterials, query]);

  return (
    <PageContainer
      header={
        <div className="space-y-4">
          <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Materials' }]} />
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">Inventory</p>
              <h1 className="mt-2 text-3xl font-semibold text-[var(--foreground)]">Materials</h1>
              <p className="mt-2 max-w-2xl text-base text-[var(--muted)]">
                Track stock, unit costs and re-order levels across every installation category.
              </p>
            </div>
            {canEdit && (
              <button type="button" className="brand-button" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                New material
              </button>
            )}
          </div>
        </div>
      }
    >
      <StockSummaryCards summary={summary} loading={!summary} />

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
                  : 'Search and filter inventory'}
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
          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto]">
              {/* Search */}
              <div className="relative sm:col-span-2 lg:col-span-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-soft)]" />
                <input
                  className="form-input !pl-10"
                  placeholder="Search by name, code, brand…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  aria-label="Search materials"
                />
              </div>

              {/* Status */}
              <div className="relative">
                <select
                  className="form-input appearance-none pr-10"
                  value={query.status ?? ''}
                  onChange={(e) =>
                    setQuery((prev) => ({ ...prev, status: (e.target.value || undefined) as MaterialStatus | undefined, page: 1 }))
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

              {/* Low stock toggle */}
              <label className="inline-flex cursor-pointer items-center gap-2.5 rounded-lg border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-all hover:border-[var(--primary)] hover:bg-[var(--surface-muted)]">
                <input
                  type="checkbox"
                  checked={Boolean(query.lowStock)}
                  onChange={(e) => setQuery((prev) => ({ ...prev, lowStock: e.target.checked, page: 1 }))}
                  className="h-4 w-4 rounded border-[var(--border)] accent-[var(--primary)]"
                />
                <span>Low stock</span>
                {query.lowStock && (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] font-bold text-white">
                    {summary?.lowStockCount ?? 0}
                  </span>
                )}
              </label>
            </div>
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
              {query.search && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-medium text-[var(--foreground)]">
                  Search: "{query.search}"
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
              {query.lowStock && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-medium text-[var(--foreground)]">
                  Low stock only
                  <button
                    type="button"
                    onClick={() => setQuery((prev) => ({ ...prev, lowStock: false, page: 1 }))}
                    className="text-[var(--muted)] hover:text-[var(--error)]"
                    aria-label="Clear low stock filter"
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
        <MaterialTable
          materials={materials}
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
                New material
              </button>
            ) : undefined
          }
        />
        <div className="px-4">
          <Pagination pagination={pagination} onPageChange={handlePageChange} />
        </div>
      </section>

      {/* Premium static content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Solar Components Guide */}
        <section className="lg:col-span-2 surface-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary-tint)] text-[var(--primary-active)]">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Solar Component Guide</h2>
          </div>
          <p className="text-sm text-[var(--muted)] mb-4">
            Essential materials for PM Surya Ghar rooftop installations. Ensure quality and compliance with scheme specifications.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { name: 'Solar Panels', desc: 'Adani/Topcon 620 Wp, BIS certified, 25-year warranty', icon: '☀️' },
              { name: 'Mounting Structure', desc: 'Galvanized iron, corrosion-resistant, wind-speed tested', icon: '🔩' },
              { name: 'Inverters', desc: 'String/micro inverters, 5-year warranty, IEC certified', icon: '⚡' },
              { name: 'Cabling & Wiring', desc: 'DC/AC cables, UV-stabilized, proper gauge for kW capacity', icon: '🔌' },
              { name: 'Earthing & Safety', desc: 'Lightning arrestors, surge protectors, earthing kits', icon: '🛡️' },
              { name: 'BOS Components', desc: 'ACDB/DCDB, MC4 connectors, fuse links, junction boxes', icon: '📦' },
            ].map((item) => (
              <div key={item.name} className="flex gap-3 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4">
                <span className="text-xl">{item.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{item.name}</p>
                  <p className="text-xs text-[var(--muted-soft)]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Stats / Tips */}
        <aside className="space-y-6">
          <div className="surface-card p-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Inventory Tips</h2>
            <ul className="space-y-3">
              {[
                'Maintain 15-20% buffer stock for peak season',
                'Check material certifications before purchase',
                'Update stock levels after each installation',
                'Flag expired or damaged items immediately',
                'Use batch tracking for solar panels',
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2.5">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--success-tint)] text-[var(--success)]">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span className="text-sm text-[var(--muted)]">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="surface-card overflow-hidden p-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">PM Surya Ghar</h2>
            <p className="text-sm text-[var(--muted)] mb-4">
              Ensure all materials meet the scheme's quality standards for subsidy approval.
            </p>
            <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-2">Key Requirements</p>
              <ul className="space-y-1.5 text-xs text-[var(--muted)]">
                <li>• BIS-certified solar panels</li>
                <li>• MNRE-approved inverters</li>
                <li>• 5-year performance warranty</li>
                <li>• Net metering compatibility</li>
              </ul>
            </div>
          </div>
        </aside>
      </div>

      {/* Create / Edit modal */}
      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? 'Edit material' : 'New material'}
        eyebrow={editing ? 'Update inventory record' : 'Add to inventory'}
        size="lg"
      >
        {formError && (
          <div role="alert" className="mb-5 rounded-lg border border-[var(--error)] bg-[var(--error-tint)] p-4 text-sm text-[var(--error)]">
            {formError}
          </div>
        )}
        <MaterialForm
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
        title="Delete material"
        message={`Are you sure you want to delete "${deleting?.name}"? This will mark it inactive. This cannot be undone.`}
        confirmLabel="Delete material"
        busy={deleteBusy}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </PageContainer>
  );
}

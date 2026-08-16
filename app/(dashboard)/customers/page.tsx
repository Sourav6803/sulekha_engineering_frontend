'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, RotateCcw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/shared/PageContainer';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { Modal } from '@/components/shared/Modal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Pagination } from '@/components/shared/Pagination';
import { CustomerTable } from '@/components/features/customers/CustomerTable';
import { CustomerForm } from '@/components/features/customers/CustomerForm';
import { useCustomers } from '@/hooks/useCustomers';
import { useAuth } from '@/hooks/useAuth';
import { handleApiError } from '@/lib/errors/handleApiError';
import { canDeleteCustomer, canManageCustomers } from '@/lib/permissions';
import type { CustomerListQuery } from '@/lib/api/customers.api';
import type { Customer, CustomerStatus, RoofType } from '@/types/customer';
import type { SortOrder } from '@/components/shared/DataTable';

const STATUSES: CustomerStatus[] = ['active', 'inactive', 'blocked', 'pending_verification'];
const ROOF_TYPES: RoofType[] = ['rcc_rooftop', 'tin_shed', 'ground_mount'];

const SORT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'name', label: 'Name' },
  { value: 'createdAt', label: 'Recently added' },
  { value: 'systemSizeKW', label: 'System size' },
];

export default function CustomersPage() {
  const { user } = useAuth();
  const role = user?.role;
  const canEdit = canManageCustomers(role);
  const canDelete = canDeleteCustomer(role);

  const { customers, pagination, loading, fetchCustomers, createCustomer, updateCustomer, deleteCustomer } =
    useCustomers();

  const [query, setQuery] = useState<CustomerListQuery>({ page: 1, limit: 20, sortBy: 'name', sortOrder: 'asc' });
  const [searchInput, setSearchInput] = useState('');

  // Debounced search → query.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery((prev) => ({ ...prev, search: searchInput.trim() || undefined, page: 1 }));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  // Fetch the list whenever the query changes.
  useEffect(() => {
    void fetchCustomers(query);
  }, [query, fetchCustomers]);

  const activeFilterCount = useMemo(
    () =>
      Number(Boolean(query.status)) +
      Number(Boolean(query.roofType)) +
      Number(Boolean(query.city)) +
      Number(Boolean(query.search)),
    [query.status, query.roofType, query.city, query.search]
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
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState<Customer | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const formOpen = createOpen || Boolean(editing);

  const openCreate = () => {
    setFormError(null);
    setCreateOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setFormError(null);
    setEditing(customer);
  };

  const closeForm = () => {
    if (formBusy) return;
    setCreateOpen(false);
    setEditing(null);
    setFormError(null);
  };

  const handleFormSubmit = useCallback(
    async (payload: Parameters<typeof createCustomer>[0]) => {
      setFormBusy(true);
      setFormError(null);
      try {
        if (editing) {
          await updateCustomer(editing._id, payload);
          toast.success('Customer updated', { description: `"${payload.name ?? editing.name}" has been saved.` });
        } else {
          await createCustomer(payload);
          toast.success('Customer created', { description: `"${payload.name}" has been added.` });
        }
        await fetchCustomers(query);
        setCreateOpen(false);
        setEditing(null);
      } catch (err) {
        const message = handleApiError(err);
        setFormError(message);
        toast.error('Could not save customer', { description: message });
      } finally {
        setFormBusy(false);
      }
    },
    [editing, updateCustomer, createCustomer, fetchCustomers, query]
  );

  const handleDelete = useCallback(async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    setActionError(null);
    try {
      await deleteCustomer(deleting._id);
      await fetchCustomers(query);
      setDeleting(null);
      toast.success('Customer deleted', { description: `"${deleting.name}" has been deactivated.` });
    } catch (err) {
      const message = handleApiError(err);
      setActionError(message);
      toast.error('Could not delete customer', { description: message });
      setDeleting(null);
    } finally {
      setDeleteBusy(false);
    }
  }, [deleting, deleteCustomer, fetchCustomers, query]);

  return (
    <PageContainer
      header={
        <div className="space-y-4">
          <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Customers' }]} />
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">CRM</p>
              <h1 className="mt-2 text-3xl font-semibold text-[var(--foreground)]">Customers</h1>
              <p className="mt-2 max-w-2xl text-base text-[var(--muted)]">
                Manage solar system customers, their contact details and installation preferences.
              </p>
            </div>
            {canEdit && (
              <button type="button" className="brand-button" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                New customer
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
      <section className="surface-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-soft)]" />
            <input
              className="form-input !pl-11"
              placeholder="Search by name, phone, ID or email…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search customers"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:w-auto lg:flex">
            <select
              className="form-input"
              value={query.status ?? ''}
              onChange={(e) =>
                setQuery((prev) => ({ ...prev, status: (e.target.value || undefined) as CustomerStatus | undefined, page: 1 }))
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

            <select
              className="form-input"
              value={query.roofType ?? ''}
              onChange={(e) =>
                setQuery((prev) => ({ ...prev, roofType: (e.target.value || undefined) as RoofType | undefined, page: 1 }))
              }
              aria-label="Filter by roof type"
            >
              <option value="">All roof types</option>
              {ROOF_TYPES.map((r) => (
                <option key={r} value={r}>
                  {r[0].toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>

            <input
              className="form-input"
              placeholder="City…"
              value={query.city ?? ''}
              onChange={(e) => setQuery((prev) => ({ ...prev, city: e.target.value.trim() || undefined, page: 1 }))}
              aria-label="Filter by city"
            />

            <select
              className="form-input"
              value={query.sortBy ?? 'name'}
              onChange={(e) => setQuery((prev) => ({ ...prev, sortBy: e.target.value || undefined, page: 1 }))}
              aria-label="Sort customers"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  Sort: {o.label}
                </option>
              ))}
            </select>
          </div>

          {activeFilterCount > 0 && (
            <button type="button" onClick={resetFilters} className="ghost-button shrink-0 !justify-center">
              <RotateCcw className="h-4 w-4" />
              Clear filters ({activeFilterCount})
            </button>
          )}
        </div>
      </section>

      {/* Table */}
      <section className="surface-card overflow-hidden p-2 sm:p-4">
        <CustomerTable
          customers={customers}
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
                New customer
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
        title={editing ? 'Edit customer' : 'New customer'}
        eyebrow={editing ? 'Update customer record' : 'Add to CRM'}
        size="lg"
      >
        {formError && (
          <div role="alert" className="mb-5 rounded-lg border border-[var(--error)] bg-[var(--error-tint)] p-4 text-sm text-[var(--error)]">
            {formError}
          </div>
        )}
        <CustomerForm
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
        title="Delete customer"
        message={`Are you sure you want to delete "${deleting?.name}"? This will deactivate the record. Customers with existing installations cannot be deleted.`}
        confirmLabel="Delete customer"
        busy={deleteBusy}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </PageContainer>
  );
}

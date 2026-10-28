'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileSignature, Plus, RotateCcw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/shared/PageContainer';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { Modal } from '@/components/shared/Modal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Pagination } from '@/components/shared/Pagination';
import { AgreementForm, type QuotationOption } from '@/components/features/agreements/AgreementForm';
import { AgreementTable } from '@/components/features/agreements/AgreementTable';
import { useAgreementDefaults, useAgreements } from '@/hooks/useAgreements';
import { useAuth } from '@/hooks/useAuth';
import { agreementsApi } from '@/lib/api/agreements.api';
import { applicationsApi } from '@/lib/api/applications.api';
import { quotationsApi } from '@/lib/api/quotations.api';
import { handleApiError } from '@/lib/errors/handleApiError';
import { canDeleteAgreement, canManageAgreements } from '@/lib/permissions';
import type { AgreementDocument, AgreementListQuery, AgreementPayload } from '@/types/agreement';

export default function AgreementsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const canEdit = canManageAgreements(user?.role);
  const canDelete = canDeleteAgreement(user?.role);

  const {
    agreements,
    pagination,
    loading,
    fetchAgreements,
    createAgreement,
    updateAgreement,
    deleteAgreement,
  } = useAgreements();
  const { defaults } = useAgreementDefaults();

  const [query, setQuery] = useState<AgreementListQuery>({
    page: 1,
    limit: 20,
    sortBy: 'agreementDate',
    sortOrder: 'desc',
  });
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AgreementDocument | null>(null);
  const [deleting, setDeleting] = useState<AgreementDocument | null>(null);
  const [busy, setBusy] = useState(false);
  const [quotationOptions, setQuotationOptions] = useState<QuotationOption[]>([]);

  const load = useCallback(() => fetchAgreements(query), [fetchAgreements, query]);

  useEffect(() => {
    void load();
  }, [load]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery((prev) => ({ ...prev, search: search.trim() || undefined, page: 1 }));
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Quotations the create form can prefill from
  useEffect(() => {
    void quotationsApi
      .list({ limit: 100, sortBy: 'quotationSeq', sortOrder: 'desc' })
      .then((response) => setQuotationOptions(Array.isArray(response.data) ? response.data : []))
      .catch(() => undefined);
  }, []);

  /**
   * `?applicationId=` — this agreement is being written for an application, so
   * saving has to link it there, file the PDF and tell the agent instead of just
   * returning to the list. `?new=1` / `?edit=<id>` let the application card open
   * the right form directly, since that is where the office starts from.
   */
  const [applicationId, setApplicationId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get('applicationId') ?? undefined;
    const editId = params.get('edit');
    const isNew = params.get('new') === '1';

    setApplicationId(id);
    if (isNew) setCreating(true);

    if (editId && id) {
      void agreementsApi
        .get(editId)
        .then((response) => setEditing(response.data))
        .catch(() => toast.error('Could not open that agreement'));
    }
  }, []);

  /** Link + render + file on the application, then go back to it. */
  const fileOnApplication = async (agreementId: string) => {
    if (!applicationId) return false;

    await applicationsApi.issueAgreement(applicationId, { agreementId });
    toast.success('Agreement filed on the application', {
      description: 'The PDF is on the file and the agent has been notified.',
    });
    router.push(`/applications/${applicationId}`);
    return true;
  };

  const handleCreate = async (payload: AgreementPayload) => {
    setBusy(true);
    try {
      const response = await createAgreement(payload);
      setCreating(false);

      // Written for an application: link, render and file it, then hand the
      // operator back to the application they started from.
      if (await fileOnApplication(response.data._id)) return;

      toast.success('Agreement created', { description: response.message });
      await load();
    } catch (err) {
      toast.error('Could not create the agreement', { description: handleApiError(err) });
    } finally {
      setBusy(false);
    }
  };

  const handleUpdate = async (payload: AgreementPayload) => {
    if (!editing) return;
    setBusy(true);
    try {
      const response = await updateAgreement(editing._id, payload);
      setEditing(null);

      // An edit changes what the consumer signs, so the copy on the application
      // is replaced now rather than when somebody remembers to re-issue.
      if (await fileOnApplication(editing._id)) return;

      toast.success('Agreement updated', { description: response.message });
      await load();
    } catch (err) {
      toast.error('Could not update the agreement', { description: handleApiError(err) });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      const response = await deleteAgreement(deleting._id);
      toast.success('Agreement deleted', { description: response.message });
      setDeleting(null);
      await load();
    } catch (err) {
      toast.error('Could not delete the agreement', { description: handleApiError(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageContainer>
      <Breadcrumbs
        items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Agreements' }]}
      />

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Agreements</h1>
          <p className="text-sm text-[var(--muted)]">
            The four page PM Surya Ghar consumer agreement. Page 1 carries the date and the consumer, page
            4 the amount and its 50 / 40 / 10 split.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/quotations" className="neutral-button px-3 py-2 text-sm">
            Quotations
          </Link>
          {canEdit && (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="brand-button inline-flex items-center gap-1.5 px-4 py-2 text-sm"
            >
              <Plus className="h-4 w-4" /> New agreement
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            className="form-input pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by consumer name, consumer ID, address or quotation no."
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setSearch('');
            setQuery({ page: 1, limit: 20, sortBy: 'agreementDate', sortOrder: 'desc' });
          }}
          className="neutral-button inline-flex items-center gap-1.5 px-3 py-2 text-sm"
        >
          <RotateCcw className="h-4 w-4" /> Reset
        </button>
      </div>

      <div className="mt-4">
        <AgreementTable
          agreements={agreements}
          loading={loading}
          sortBy={query.sortBy}
          sortOrder={query.sortOrder}
          onSort={(key) =>
            setQuery((prev) => ({
              ...prev,
              sortBy: key as AgreementListQuery['sortBy'],
              sortOrder: prev.sortBy === key && prev.sortOrder === 'desc' ? 'asc' : 'desc',
            }))
          }
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={(agreement) => setEditing(agreement)}
          onDelete={(agreement) => setDeleting(agreement)}
          emptyAction={
            canEdit ? (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="brand-button inline-flex items-center gap-1.5 px-4 py-2 text-sm"
              >
                <FileSignature className="h-4 w-4" /> New agreement
              </button>
            ) : undefined
          }
        />
      </div>

      {pagination.total > 0 && (
        <div className="mt-4">
          <Pagination
            pagination={pagination}
            onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))}
          />
        </div>
      )}

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="New agreement"
        eyebrow="PM Surya Ghar consumer agreement"
        size="lg"
      >
        <AgreementForm
          mode="create"
          submitting={busy}
          defaults={defaults}
          quotationOptions={quotationOptions}
          onSubmit={handleCreate}
        />
      </Modal>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Edit agreement"
        eyebrow={editing?.consumerName}
        size="lg"
      >
        {editing && (
          <AgreementForm
            key={editing._id}
            initial={editing}
            mode="edit"
            submitting={busy}
            defaults={defaults}
            onSubmit={handleUpdate}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this agreement?"
        message={
          deleting
            ? `${deleting.consumerName} ka agreement list se hat jayega. Record database me rahega (soft delete) — zaroorat pade to wapas laaya ja sakta hai.`
            : ''
        }
        confirmLabel="Delete"
        tone="danger"
        busy={busy}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleting(null)}
      />
    </PageContainer>
  );
}

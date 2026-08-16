'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, RotateCcw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/shared/PageContainer';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { Modal } from '@/components/shared/Modal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Pagination } from '@/components/shared/Pagination';
import { BOMTemplateForm } from '@/components/features/bom-templates/BOMTemplateForm';
import { BOMTemplateTable } from '@/components/features/bom-templates/BOMTemplateTable';
import { useBOMTemplates } from '@/hooks/useBOMTemplates';
import { useAuth } from '@/hooks/useAuth';
import { handleApiError } from '@/lib/errors/handleApiError';
import type { BOMTemplateDocument, BOMTemplateListQuery, RoofType } from '@/types/bomTemplate';
import type { BOMTemplateCreatePayload, BOMTemplateUpdatePayload } from '@/lib/api/bomTemplates.api';
import type { SortOrder } from '@/components/shared/DataTable';

const ROOF_TYPES: { value: RoofType; label: string }[] = [
  { value: 'rcc_rooftop', label: 'RCC Rooftop' },
  { value: 'tin_shed', label: 'Tin Shed' },
  { value: 'ground_mount', label: 'Ground Mount' },
];

export default function BOMTemplatesPage() {
  const { user } = useAuth();
  const role = user?.role;

  const {
    templates,
    pagination,
    loading,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    bulkCreate,
  } = useBOMTemplates();

  const [query, setQuery] = useState<BOMTemplateListQuery>({
    page: 1,
    limit: 20,
    sortBy: 'templateName',
    sortOrder: 'asc',
  });
  const sortBy = query.sortBy ?? 'templateName';
  const sortOrder = query.sortOrder ?? 'asc';
  const [searchInput, setSearchInput] = useState('');
  const [roofTypeFilter, setRoofTypeFilter] = useState<RoofType | ''>('');

  const canEdit = ['admin', 'manager', 'warehouse_staff', 'administration'].includes(role ?? '');
  const canDelete = ['admin', 'administration'].includes(role ?? '');

  useEffect(() => {
    const params: BOMTemplateListQuery = {
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      roofType: roofTypeFilter || undefined,
      search: query.search,
    };
    void fetchTemplates(params);
  }, [query, roofTypeFilter, fetchTemplates]);

  useEffect(() => {
    setQuery((prev) => ({ ...prev, search: searchInput.trim() || undefined, page: 1 }));
  }, [searchInput]);

  const activeFilterCount = useMemo(
    () => Number(Boolean(roofTypeFilter)) + Number(Boolean(query.search)),
    [roofTypeFilter, query.search]
  );

  const resetFilters = () => {
    setSearchInput('');
    setRoofTypeFilter('');
    setQuery({ page: 1, limit: 20, sortBy: 'templateName', sortOrder: 'asc' });
  };

  const handleSort = (sortBy: string, sortOrder: SortOrder) => {
    setQuery((prev) => ({ ...prev, sortBy, sortOrder }));
  };

  const handlePageChange = (page: number) => {
    setQuery((prev) => ({ ...prev, page }));
  };

  // ---- Modals & mutations ----
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<BOMTemplateDocument | null>(null);
  const [deleting, setDeleting] = useState<BOMTemplateDocument | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkJson, setBulkJson] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);

  const formOpen = createOpen || Boolean(editing);

  const openCreate = () => {
    setFormError(null);
    setCreateOpen(true);
  };

  const openEdit = (tpl: BOMTemplateDocument) => {
    setFormError(null);
    setEditing(tpl);
  };

  const closeForm = () => {
    if (formBusy) return;
    setCreateOpen(false);
    setEditing(null);
    setFormError(null);
  };

  const handleFormSubmit = useCallback(
    async (payload: BOMTemplateCreatePayload | BOMTemplateUpdatePayload) => {
      setFormBusy(true);
      setFormError(null);
      try {
        if (editing) {
          await updateTemplate(editing._id, payload);
          toast.success('Template updated', { description: `"${(payload as any).templateName}" has been saved.` });
        } else {
          await createTemplate(payload as BOMTemplateCreatePayload);
          toast.success('Template created', { description: `"${(payload as any).templateName}" has been added.` });
        }
        await fetchTemplates(query);
        setCreateOpen(false);
        setEditing(null);
      } catch (err) {
        const message = handleApiError(err);
        setFormError(message);
        toast.error('Could not save template', { description: message });
      } finally {
        setFormBusy(false);
      }
    },
    [editing, updateTemplate, createTemplate, fetchTemplates, query]
  );

  const handleDelete = useCallback(async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    setActionError(null);
    try {
      await deleteTemplate(deleting._id);
      await fetchTemplates(query);
      setDeleting(null);
      toast.success('Template deleted', { description: `"${deleting.templateName}" has been removed.` });
    } catch (err) {
      const message = handleApiError(err);
      setActionError(message);
      toast.error('Could not delete template', { description: message });
      setDeleting(null);
    } finally {
      setDeleteBusy(false);
    }
  }, [deleting, deleteTemplate, fetchTemplates, query]);

  const handleBulkImport = useCallback(async () => {
    setBulkBusy(true);
    setActionError(null);
    try {
      const parsed = JSON.parse(bulkJson);
      if (!Array.isArray(parsed.templates)) {
        throw new Error('Expected { templates: [...] }');
      }
      const result = await bulkCreate({ templates: parsed.templates });
      const data = result.data;
      toast.success('Bulk import complete', {
        description: `${data.summary.success} created, ${data.summary.failed} failed.`,
      });
      await fetchTemplates(query);
      setShowBulkImport(false);
      setBulkJson('');
    } catch (err) {
      const message = handleApiError(err);
      setActionError(message);
      toast.error('Bulk import failed', { description: message });
    } finally {
      setBulkBusy(false);
    }
  }, [bulkJson, bulkCreate, fetchTemplates, query]);

  return (
    <PageContainer
      header={
        <div className="space-y-4">
          <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'BOM Templates' }]} />
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">BOM Templates</p>
              <h1 className="mt-2 text-3xl font-semibold text-[var(--foreground)]">Bill of Materials Templates</h1>
              <p className="mt-2 max-w-2xl text-base text-[var(--muted)]">
                Define per-section item templates per roof type and system size. These drive the suggested BOM on new installations.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {canEdit && (
                <>
                  <button type="button" className="ghost-button" onClick={() => setShowBulkImport(true)}>
                    Bulk Import (JSON)
                  </button>
                  <button type="button" className="brand-button" onClick={openCreate}>
                    <Plus className="h-4 w-4" />
                    New template
                  </button>
                </>
              )}
            </div>
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
              placeholder="Search by template name or section…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search templates"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:w-auto lg:flex">
            <select
              className="form-input"
              value={roofTypeFilter}
              onChange={(e) => setRoofTypeFilter(e.target.value as RoofType | '')}
              aria-label="Filter by roof type"
            >
              <option value="">All roof types</option>
              {ROOF_TYPES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
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
        <BOMTemplateTable
          templates={templates}
          loading={loading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onEdit={canEdit ? openEdit : undefined}
          onDelete={canDelete ? setDeleting : undefined}
          canEdit={canEdit}
          canDelete={canDelete}
          emptyAction={
            canEdit ? (
              <button type="button" className="brand-button" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                New template
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
          title={editing ? 'Edit BOM template' : 'New BOM template'}
          eyebrow={editing ? 'Update template configuration' : 'Add a new BOM template'}
          size="lg"
        >
        {formError && (
          <div role="alert" className="mb-5 rounded-lg border border-[var(--error)] bg-[var(--error-tint)] p-4 text-sm text-[var(--error)]">
            {formError}
          </div>
        )}
        <BOMTemplateForm
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
        title="Delete BOM template"
        message={`Are you sure you want to delete "${deleting?.templateName}"? This will mark it inactive.`}
        confirmLabel="Delete template"
        busy={deleteBusy}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />

      {/* Bulk import modal */}
      <Modal
        open={showBulkImport}
        onClose={() => { setShowBulkImport(false); setBulkJson(''); }}
        title="Bulk import templates"
        eyebrow="Paste a JSON array of template objects"
        size="lg"
      >
        {actionError && (
          <div role="alert" className="mb-5 rounded-lg border border-[var(--error)] bg-[var(--error-tint)] p-4 text-sm text-[var(--error)]">
            {actionError}
          </div>
        )}
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted)]">
            Paste a JSON object with a <code className="font-mono">templates</code> array. Each item must match the BOM template schema.
          </p>
          <textarea
            className="form-input font-mono"
            rows={12}
            value={bulkJson}
            onChange={(e) => setBulkJson(e.target.value)}
            placeholder={`{ "templates": [
  {
    "templateName": "RCC Rooftop 5kW - Structure",
    "roofType": "rcc_rooftop",
    "systemSizeKW": 5,
    "section": "Structure",
    "sectionOrder": 1,
    "material": "<material-id>",
    "qtyFormula": { "type": "fixed", "value": 50 },
    "wastageFactor": 2,
    "priority": 1
  }
]}`}
          />
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="neutral-button"
              onClick={() => { setShowBulkImport(false); setBulkJson(''); }}
              disabled={bulkBusy}
            >
              Cancel
            </button>
            <button type="button" className="brand-button" disabled={bulkBusy} onClick={handleBulkImport}>
              {bulkBusy ? 'Importing…' : 'Import templates'}
            </button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}

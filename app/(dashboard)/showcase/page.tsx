'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { Images, Link2, Plus, RotateCcw, Search, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/shared/PageContainer';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { Modal } from '@/components/shared/Modal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Pagination } from '@/components/shared/Pagination';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import * as showcaseApi from '@/lib/api/showcase.api';
import { handleApiError } from '@/lib/errors/handleApiError';
import type { PaginationInfo } from '@/types/api';
import type { AdminProject } from '@/types/site';

const EMPTY_PAGINATION: PaginationInfo = { page: 1, limit: 20, total: 0, pages: 0 };

const SYSTEM_TYPES: { value: 'on-grid' | 'off-grid' | 'hybrid'; label: string }[] = [
  { value: 'on-grid', label: 'On grid' },
  { value: 'off-grid', label: 'Off grid' },
  { value: 'hybrid', label: 'Hybrid' },
];

type FormState = {
  title: string;
  summary: string;
  story: string;
  customerName: string;
  customerConsent: boolean;
  district: string;
  state: string;
  area: string;
  pincode: string;
  capacityKW: string;
  panelBrand: string;
  panelModel: string;
  panelCount: string;
  inverterBrand: string;
  systemType: 'on-grid' | 'off-grid' | 'hybrid';
  structureType: string;
  commissionedAt: string;
  tags: string;
  highlight: boolean;
  isPublished: boolean;
  seoTitle: string;
  seoDescription: string;
};

const emptyForm = (): FormState => ({
  title: '',
  summary: '',
  story: '',
  customerName: '',
  customerConsent: false,
  district: '',
  state: 'West Bengal',
  area: '',
  pincode: '',
  capacityKW: '',
  panelBrand: '',
  panelModel: '',
  panelCount: '',
  inverterBrand: '',
  systemType: 'on-grid',
  structureType: '',
  commissionedAt: '',
  tags: '',
  highlight: false,
  isPublished: false,
  seoTitle: '',
  seoDescription: '',
});

const toPayload = (form: FormState): showcaseApi.ProjectInput => ({
  title: form.title.trim(),
  summary: form.summary.trim(),
  story: form.story.trim(),
  customerName: form.customerName.trim() || undefined,
  customerConsent: form.customerConsent,
  location: {
    district: form.district.trim() || undefined,
    state: form.state.trim() || undefined,
    area: form.area.trim() || undefined,
    pincode: form.pincode.trim() || undefined,
  },
  capacityKW: Number(form.capacityKW) || 0,
  panelBrand: form.panelBrand.trim() || undefined,
  panelModel: form.panelModel.trim() || undefined,
  panelCount: form.panelCount ? Number(form.panelCount) : undefined,
  inverterBrand: form.inverterBrand.trim() || undefined,
  systemType: form.systemType,
  structureType: form.structureType.trim() || undefined,
  commissionedAt: form.commissionedAt ? new Date(form.commissionedAt).toISOString() : null,
  tags: form.tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean),
  highlight: form.highlight,
  isPublished: form.isPublished,
  seo: {
    title: form.seoTitle.trim() || undefined,
    description: form.seoDescription.trim() || undefined,
  },
});

export default function ShowcasePage() {
  const [items, setItems] = useState<AdminProject[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>(EMPTY_PAGINATION);
  const [counts, setCounts] = useState<{ drafts: number; published: number }>({ drafts: 0, published: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [publishedFilter, setPublishedFilter] = useState<'true' | 'false' | ''>('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProject | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleting, setDeleting] = useState<AdminProject | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [coverBusy, setCoverBusy] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaBusy, setMediaBusy] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await showcaseApi.listAdmin({
        page,
        limit: 20,
        search: search || undefined,
        isPublished: publishedFilter || undefined,
      });
      setItems(data.items);
      setPagination(data.pagination);
      setCounts(data.counts);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, publishedFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormError(null);
    setMediaUrl('');
    setFormOpen(true);
  };

  const openEdit = (project: AdminProject) => {
    setEditing(project);
    setForm({
      title: project.title,
      summary: project.summary ?? '',
      story: project.story ?? '',
      customerName: project.customerName ?? '',
      customerConsent: project.customerConsent,
      district: project.location.district ?? '',
      state: project.location.state ?? '',
      area: project.location.area ?? '',
      pincode: project.location.pincode ?? '',
      capacityKW: String(project.capacityKW ?? ''),
      panelBrand: project.panelBrand ?? '',
      panelModel: project.panelModel ?? '',
      panelCount: project.panelCount ? String(project.panelCount) : '',
      inverterBrand: project.inverterBrand ?? '',
      systemType: project.systemType,
      structureType: project.structureType ?? '',
      commissionedAt: project.commissionedAt ? project.commissionedAt.slice(0, 10) : '',
      tags: project.tags.join(', '),
      highlight: project.highlight,
      isPublished: project.isPublished,
      seoTitle: project.seo.title ?? '',
      seoDescription: project.seo.description ?? '',
    });
    setFormError(null);
    setMediaUrl('');
    setFormOpen(true);
  };

  const handleSave = async () => {
    setFormError(null);
    if (!form.title.trim()) {
      setFormError('A title is required.');
      return;
    }
    if (!Number(form.capacityKW)) {
      setFormError('Enter the system size in kW.');
      return;
    }
    if (!form.customerConsent && form.isPublished) {
      setFormError('A story can only be published once the customer has given consent.');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        const updated = await showcaseApi.update(editing.id, toPayload(form));
        setEditing(updated);
        toast.success('Story saved');
        await load();
      } else {
        const created = await showcaseApi.create(toPayload(form));
        setEditing(created);
        toast.success('Story created', { description: 'Add photos below, then publish when it is ready.' });
        await load();
      }
    } catch (err) {
      const message = handleApiError(err);
      setFormError(message);
      toast.error('Could not save the story', { description: message });
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublished = async (project: AdminProject) => {
    try {
      await showcaseApi.setPublished(project.id, !project.isPublished);
      toast.success(project.isPublished ? 'Story unpublished' : 'Story published');
      await load();
    } catch (err) {
      toast.error('Could not change publication', { description: handleApiError(err) });
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await showcaseApi.remove(deleting.id);
      toast.success('Story deleted');
      setDeleting(null);
      await load();
    } catch (err) {
      toast.error('Could not delete the story', { description: handleApiError(err) });
    } finally {
      setDeleteBusy(false);
    }
  };

  const refreshEditing = async () => {
    if (!editing) return;
    try {
      setEditing(await showcaseApi.getAdmin(editing.id));
    } catch {
      /* the modal keeps its current copy; the next save reports the real error */
    }
  };

  const handleCover = async (file: File | null) => {
    if (!editing || !file) return;
    setCoverBusy(true);
    try {
      await showcaseApi.uploadCover(editing.id, file);
      await refreshEditing();
      await load();
      toast.success('Cover updated');
    } catch (err) {
      toast.error('Could not upload the cover', { description: handleApiError(err) });
    } finally {
      setCoverBusy(false);
    }
  };

  const handleAddMediaLink = async () => {
    if (!editing || !mediaUrl.trim()) return;
    setMediaBusy(true);
    try {
      await showcaseApi.addMediaLink(editing.id, { url: mediaUrl.trim() });
      setMediaUrl('');
      await refreshEditing();
      toast.success('Media added');
    } catch (err) {
      toast.error('Could not add that link', { description: handleApiError(err) });
    } finally {
      setMediaBusy(false);
    }
  };

  const handleMediaFiles = async (files: FileList | null) => {
    if (!editing || !files || files.length === 0) return;
    setMediaBusy(true);
    try {
      for (const file of Array.from(files)) {
        await showcaseApi.addMediaFile(editing.id, file);
      }
      await refreshEditing();
      toast.success(`${files.length} file${files.length === 1 ? '' : 's'} uploaded`);
    } catch (err) {
      toast.error('Could not upload the photos', { description: handleApiError(err) });
    } finally {
      setMediaBusy(false);
    }
  };

  const handleRemoveMedia = async (mediaId: string) => {
    if (!editing) return;
    setMediaBusy(true);
    try {
      await showcaseApi.removeMedia(editing.id, mediaId);
      await refreshEditing();
      toast.success('Photo removed');
    } catch (err) {
      toast.error('Could not remove it', { description: handleApiError(err) });
    } finally {
      setMediaBusy(false);
    }
  };

  const columns: Array<DataTableColumn<AdminProject>> = [
    {
      key: 'title',
      header: 'Story',
      render: (project) => (
        <div className="flex items-center gap-3">
          <span className="relative h-11 w-16 shrink-0 overflow-hidden rounded-lg bg-[var(--surface-muted)]">
            {project.coverImage ? (
              <Image src={project.coverImage} alt="" fill sizes="64px" className="object-cover" />
            ) : (
              <Images className="absolute inset-0 m-auto h-4 w-4 text-[var(--muted-soft)]" />
            )}
          </span>
          <div className="min-w-0">
            <button type="button" className="block truncate text-left font-semibold text-[var(--foreground)] hover:text-[var(--primary)]" onClick={() => openEdit(project)}>
              {project.title}
            </button>
            <span className="mt-0.5 block truncate text-xs text-[var(--muted-soft)]">
              {project.location.district ?? 'No district'} · {project.media.length} media
            </span>
          </div>
        </div>
      ),
    },
    { key: 'capacityKW', header: 'Size', className: 'text-right', render: (project) => `${project.capacityKW} kW` },
    {
      key: 'commissionedAt',
      header: 'Commissioned',
      hideOnMobile: true,
      render: (project) =>
        project.commissionedAt
          ? new Date(project.commissionedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
          : '—',
    },
    {
      key: 'isPublished',
      header: 'Status',
      render: (project) => (
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${
            project.isPublished ? 'bg-[var(--success-tint)] text-[var(--success)]' : 'bg-[var(--warning-tint)] text-[var(--warning)]'
          }`}
        >
          {project.isPublished ? 'Published' : 'Draft'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (project) => (
        <div className="flex justify-end gap-2">
          <button type="button" className="ghost-button !px-3 !py-1.5 text-xs" onClick={() => void handleTogglePublished(project)}>
            {project.isPublished ? 'Unpublish' : 'Publish'}
          </button>
          <button
            type="button"
            className="ghost-button !px-3 !py-1.5 text-xs text-[var(--error)]"
            onClick={() => setDeleting(project)}
            aria-label={`Delete ${project.title}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      header={
        <div className="space-y-4">
          <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Website' }, { label: 'Project stories' }]} />
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">Website</p>
              <h1 className="mt-2 text-3xl font-semibold text-[var(--foreground)]">Project stories</h1>
              <p className="mt-2 max-w-2xl text-base text-[var(--muted)]">
                What the gallery on the public site is built from. A story is a draft until it is published, and it can
                only be published with the customer&apos;s consent recorded.
              </p>
            </div>
            <button type="button" className="brand-button" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              New story
            </button>
          </div>
        </div>
      }
    >
      {error && (
        <div role="alert" className="rounded-lg border border-[var(--error)] bg-[var(--error-tint)] p-4 text-sm text-[var(--error)]">
          {error}
        </div>
      )}

      <section className="surface-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-soft)]" />
            <input
              className="form-input !pl-11"
              placeholder="Search by title or customer…"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              aria-label="Search stories"
            />
          </div>
          <select
            className="form-input max-w-xs"
            value={publishedFilter}
            onChange={(event) => {
              setPublishedFilter(event.target.value as 'true' | 'false' | '');
              setPage(1);
            }}
            aria-label="Filter by publication"
          >
            <option value="">All stories</option>
            <option value="true">Published ({counts.published})</option>
            <option value="false">Drafts ({counts.drafts})</option>
          </select>
          {(search || publishedFilter) && (
            <button
              type="button"
              className="ghost-button shrink-0 !justify-center"
              onClick={() => {
                setSearchInput('');
                setPublishedFilter('');
                setPage(1);
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>
      </section>

      <section className="surface-card overflow-hidden p-2 sm:p-4">
        <DataTable
          columns={columns}
          data={items}
          keyField="id"
          loading={loading}
          emptyState={{
            icon: Images,
            title: 'No stories yet',
            description: 'Add the first installation and it appears in the public gallery once published.',
            action: (
              <button type="button" className="brand-button" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                New story
              </button>
            ),
          }}
        />
        <div className="px-4">
          <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      </section>

      <Modal
        open={formOpen}
        onClose={() => !saving && setFormOpen(false)}
        title={editing ? editing.title : 'New project story'}
        eyebrow={editing ? 'Edit the story, its photos and its publication' : 'A draft is created first, photos come next'}
        size="lg"
      >
        {formError && (
          <div role="alert" className="mb-4 rounded-lg border border-[var(--error)] bg-[var(--error-tint)] p-3 text-sm text-[var(--error)]">
            {formError}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="form-label" htmlFor="story-title">
              Title
            </label>
            <input
              id="story-title"
              className="form-input"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="5 kW rooftop in Kalna — Tin shed"
            />
          </div>

          <div>
            <label className="form-label" htmlFor="story-summary">
              One-line summary
            </label>
            <input
              id="story-summary"
              className="form-input"
              value={form.summary}
              onChange={(event) => setForm((prev) => ({ ...prev, summary: event.target.value }))}
              placeholder="Shown on the card in the gallery"
            />
          </div>

          <div>
            <label className="form-label" htmlFor="story-story">
              The story
            </label>
            <textarea
              id="story-story"
              rows={6}
              className="form-input"
              value={form.story}
              onChange={(event) => setForm((prev) => ({ ...prev, story: event.target.value }))}
              placeholder="What the roof was like, what was fitted, what the customer said afterwards. Blank lines separate paragraphs."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="form-label" htmlFor="story-kw">
                Size (kW)
              </label>
              <input
                id="story-kw"
                type="number"
                step="0.5"
                className="form-input"
                value={form.capacityKW}
                onChange={(event) => setForm((prev) => ({ ...prev, capacityKW: event.target.value }))}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="story-type">
                System type
              </label>
              <select
                id="story-type"
                className="form-input"
                value={form.systemType}
                onChange={(event) => setForm((prev) => ({ ...prev, systemType: event.target.value as FormState['systemType'] }))}
              >
                {SYSTEM_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label" htmlFor="story-commissioned">
                Commissioned
              </label>
              <input
                id="story-commissioned"
                type="date"
                className="form-input"
                value={form.commissionedAt}
                onChange={(event) => setForm((prev) => ({ ...prev, commissionedAt: event.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="form-label" htmlFor="story-district">
                District
              </label>
              <input
                id="story-district"
                className="form-input"
                value={form.district}
                onChange={(event) => setForm((prev) => ({ ...prev, district: event.target.value }))}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="story-area">
                Area / village
              </label>
              <input
                id="story-area"
                className="form-input"
                value={form.area}
                onChange={(event) => setForm((prev) => ({ ...prev, area: event.target.value }))}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="story-state">
                State
              </label>
              <input
                id="story-state"
                className="form-input"
                value={form.state}
                onChange={(event) => setForm((prev) => ({ ...prev, state: event.target.value }))}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="story-pincode">
                PIN code
              </label>
              <input
                id="story-pincode"
                className="form-input"
                value={form.pincode}
                onChange={(event) => setForm((prev) => ({ ...prev, pincode: event.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="form-label" htmlFor="story-panel-brand">
                Panel brand
              </label>
              <input
                id="story-panel-brand"
                className="form-input"
                value={form.panelBrand}
                onChange={(event) => setForm((prev) => ({ ...prev, panelBrand: event.target.value }))}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="story-panel-model">
                Panel model
              </label>
              <input
                id="story-panel-model"
                className="form-input"
                value={form.panelModel}
                onChange={(event) => setForm((prev) => ({ ...prev, panelModel: event.target.value }))}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="story-panel-count">
                Module count
              </label>
              <input
                id="story-panel-count"
                type="number"
                className="form-input"
                value={form.panelCount}
                onChange={(event) => setForm((prev) => ({ ...prev, panelCount: event.target.value }))}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="story-inverter">
                Inverter brand
              </label>
              <input
                id="story-inverter"
                className="form-input"
                value={form.inverterBrand}
                onChange={(event) => setForm((prev) => ({ ...prev, inverterBrand: event.target.value }))}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="story-structure">
                Structure
              </label>
              <input
                id="story-structure"
                className="form-input"
                value={form.structureType}
                onChange={(event) => setForm((prev) => ({ ...prev, structureType: event.target.value }))}
                placeholder="Elevated GI, tin shed…"
              />
            </div>
            <div>
              <label className="form-label" htmlFor="story-tags">
                Tags
              </label>
              <input
                id="story-tags"
                className="form-input"
                value={form.tags}
                onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
                placeholder="residential, tin shed, kalna"
              />
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border-soft)] p-4">
            <label className="flex items-start gap-3 text-sm text-[var(--foreground)]">
              <input
                type="checkbox"
                checked={form.customerConsent}
                onChange={(event) => setForm((prev) => ({ ...prev, customerConsent: event.target.checked }))}
                className="mt-0.5 h-4 w-4 rounded border-[var(--border)] text-[var(--primary)]"
              />
              <span>
                The customer has agreed to this story and their photos being published.
                <span className="mt-0.5 block text-xs text-[var(--muted)]">
                  Required before a story can go live — the site never publishes a name or photo without it.
                </span>
              </span>
            </label>

            <div className="mt-3 flex flex-wrap gap-5">
              <label className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(event) => setForm((prev) => ({ ...prev, isPublished: event.target.checked }))}
                  className="h-4 w-4 rounded border-[var(--border)] text-[var(--primary)]"
                />
                Published
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                <input
                  type="checkbox"
                  checked={form.highlight}
                  onChange={(event) => setForm((prev) => ({ ...prev, highlight: event.target.checked }))}
                  className="h-4 w-4 rounded border-[var(--border)] text-[var(--primary)]"
                />
                Feature on the home page
              </label>
            </div>
          </div>

          {/* Media — only meaningful once the story has an id to attach to. */}
          {editing ? (
            <div className="rounded-xl border border-[var(--border-soft)] p-4">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">Photos and video</h3>
              <p className="mt-1 text-xs text-[var(--muted)]">
                The first photo can be used as the card cover. Links to YouTube or Drive are accepted as video.
              </p>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={(event) => void handleMediaFiles(event.target.files)}
                  className="form-input file:mr-3 file:rounded-full file:border-0 file:bg-[var(--primary-tint)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[var(--primary-active)]"
                />
                <button
                  type="button"
                  className="neutral-button shrink-0 justify-center"
                  disabled={coverBusy}
                  onClick={() => document.getElementById('cover-input')?.click()}
                >
                  <Upload className="h-4 w-4" />
                  {coverBusy ? 'Uploading…' : 'Set cover'}
                </button>
                <input
                  id="cover-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => void handleCover(event.target.files?.[0] ?? null)}
                />
              </div>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  className="form-input"
                  value={mediaUrl}
                  onChange={(event) => setMediaUrl(event.target.value)}
                  placeholder="https://youtu.be/…"
                  aria-label="Media URL"
                />
                <button type="button" className="brand-button shrink-0 justify-center" onClick={() => void handleAddMediaLink()} disabled={mediaBusy || !mediaUrl.trim()}>
                  <Link2 className="h-4 w-4" />
                  Add link
                </button>
              </div>

              {editing.media.length > 0 && (
                <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {editing.media.map((media) => (
                    <li key={media.id} className="relative overflow-hidden rounded-xl border border-[var(--border-soft)]">
                      <div className="relative aspect-square bg-[var(--surface-muted)]">
                        {media.kind === 'image' ? (
                          <Image src={media.thumbnailUrl ?? media.url} alt={media.caption ?? ''} fill sizes="120px" className="object-cover" />
                        ) : (
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold uppercase text-[var(--muted)]">
                            Video
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleRemoveMedia(media.id)}
                        className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1.5 text-white backdrop-blur hover:bg-[var(--error)]"
                        aria-label="Remove media"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <p className="rounded-xl bg-[var(--surface-muted)] p-3 text-xs text-[var(--muted)]">
              Save the story first — photos and the cover can be added once it exists.
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="form-label" htmlFor="story-seo-title">
                SEO title (optional)
              </label>
              <input
                id="story-seo-title"
                className="form-input"
                value={form.seoTitle}
                onChange={(event) => setForm((prev) => ({ ...prev, seoTitle: event.target.value }))}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="story-seo-description">
                SEO description (optional)
              </label>
              <input
                id="story-seo-description"
                className="form-input"
                value={form.seoDescription}
                onChange={(event) => setForm((prev) => ({ ...prev, seoDescription: event.target.value }))}
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button type="button" className="neutral-button" onClick={() => setFormOpen(false)} disabled={saving}>
              Close
            </button>
            <button type="button" className="brand-button" onClick={() => void handleSave()} disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save story' : 'Create draft'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete story"
        message={`Delete "${deleting?.title}"? It is removed from the gallery immediately.`}
        confirmLabel="Delete story"
        busy={deleteBusy}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </PageContainer>
  );
}

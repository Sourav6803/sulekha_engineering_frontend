'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Download, ImagePlus, Link2, Plus, QrCode, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/shared/PageContainer';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { Modal } from '@/components/shared/Modal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import * as bannerApi from '@/lib/api/banners.api';
import { handleApiError } from '@/lib/errors/handleApiError';
import { buildCampaignUrl, downloadDataUrl, makeQrDataUrl } from '@/lib/site/qr';
import type { AdminBanner, BannerPlacement } from '@/types/site';

const PLACEMENTS: { value: BannerPlacement; label: string; hint: string }[] = [
  { value: 'home_hero', label: 'Home hero', hint: 'The first screen, behind the headline' },
  { value: 'scheme_strip', label: 'Scheme strip', hint: 'The official scheme artwork band' },
  { value: 'home_popup', label: 'Home popup', hint: 'Shown once per visit' },
  { value: 'footer', label: 'Footer', hint: 'Below the contact block' },
  { value: 'other', label: 'Other', hint: 'Anything else — link it manually' },
];

type FormState = {
  title: string;
  altText: string;
  imageUrl: string;
  publicId: string;
  linkUrl: string;
  ctaLabel: string;
  placement: BannerPlacement;
  campaign: string;
  order: string;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
};

const emptyForm = (): FormState => ({
  title: '',
  altText: '',
  imageUrl: '',
  publicId: '',
  linkUrl: '',
  ctaLabel: '',
  placement: 'home_hero',
  campaign: '',
  order: '0',
  isActive: true,
  startsAt: '',
  endsAt: '',
});

export default function BannersPage() {
  const [items, setItems] = useState<AdminBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [placementFilter, setPlacementFilter] = useState<BannerPlacement | ''>('');
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminBanner | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleting, setDeleting] = useState<AdminBanner | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [qrBanner, setQrBanner] = useState<AdminBanner | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrLink, setQrLink] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bannerApi.listAdmin(placementFilter ? { placement: placementFilter } : {});
      setItems(data.items);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, [placementFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setFile(null);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (banner: AdminBanner) => {
    setEditing(banner);
    setForm({
      title: banner.title,
      altText: banner.altText,
      imageUrl: banner.imageUrl,
      publicId: '',
      linkUrl: banner.linkUrl ?? '',
      ctaLabel: banner.ctaLabel ?? '',
      placement: banner.placement,
      campaign: banner.campaign ?? '',
      order: String(banner.order),
      isActive: banner.isActive,
      startsAt: banner.startsAt ? banner.startsAt.slice(0, 10) : '',
      endsAt: banner.endsAt ? banner.endsAt.slice(0, 10) : '',
    });
    setFile(null);
    setFormError(null);
    setFormOpen(true);
  };

  const handleSave = async () => {
    setFormError(null);
    setSaving(true);
    try {
      let imageUrl = form.imageUrl;
      let publicId = form.publicId;

      // Upload first, save second: a failed save never leaves an orphan record,
      // and a re-used image is not uploaded twice.
      if (file) {
        const uploaded = await bannerApi.uploadImage(file);
        imageUrl = uploaded.url;
        publicId = uploaded.publicId;
      }

      if (!imageUrl) {
        setFormError('Choose an image file first.');
        return;
      }
      if (!form.title.trim() || !form.altText.trim()) {
        setFormError('Title and alt text are both required.');
        return;
      }

      const payload: bannerApi.BannerInput = {
        title: form.title.trim(),
        altText: form.altText.trim(),
        imageUrl,
        ...(publicId ? { publicId } : {}),
        linkUrl: form.linkUrl.trim() || null,
        ctaLabel: form.ctaLabel.trim() || null,
        placement: form.placement,
        campaign: form.campaign.trim() || null,
        order: Number(form.order) || 0,
        isActive: form.isActive,
        startsAt: form.startsAt || null,
        endsAt: form.endsAt || null,
      };

      if (editing) {
        await bannerApi.update(editing.id, payload);
        toast.success('Banner updated');
      } else {
        await bannerApi.create(payload);
        toast.success('Banner added');
      }

      setFormOpen(false);
      await load();
    } catch (err) {
      const message = handleApiError(err);
      setFormError(message);
      toast.error('Could not save the banner', { description: message });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (banner: AdminBanner) => {
    try {
      await bannerApi.setActive(banner.id, !banner.isActive);
      setItems((current) =>
        current.map((row) => (row.id === banner.id ? { ...row, isActive: !row.isActive } : row))
      );
      toast.success(banner.isActive ? 'Banner hidden from the site' : 'Banner is live');
    } catch (err) {
      toast.error('Could not change the banner', { description: handleApiError(err) });
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await bannerApi.remove(deleting.id);
      toast.success('Banner deleted');
      setDeleting(null);
      await load();
    } catch (err) {
      toast.error('Could not delete the banner', { description: handleApiError(err) });
    } finally {
      setDeleteBusy(false);
    }
  };

  const openQr = async (banner: AdminBanner) => {
    setQrBanner(banner);
    setQrDataUrl('');
    const origin = typeof window === 'undefined' ? '' : window.location.origin;
    const link = buildCampaignUrl(origin, banner.campaign || banner.title);
    setQrLink(link);
    try {
      setQrDataUrl(await makeQrDataUrl(link, { size: 640 }));
    } catch {
      toast.error('Could not generate the QR code');
    }
  };

  const grouped = useMemo(
    () => PLACEMENTS.map((place) => ({ ...place, count: items.filter((row) => row.placement === place.value).length })),
    [items]
  );

  return (
    <PageContainer
      header={
        <div className="space-y-4">
          <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Website' }, { label: 'Banners' }]} />
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">Website</p>
              <h1 className="mt-2 text-3xl font-semibold text-[var(--foreground)]">Banners</h1>
              <p className="mt-2 max-w-2xl text-base text-[var(--muted)]">
                The artwork the public site shows — including the government scheme banner, which is only ever the
                uploaded file, never a redrawn copy.
              </p>
            </div>
            <button type="button" className="brand-button" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Upload banner
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
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="form-input max-w-xs"
            value={placementFilter}
            onChange={(event) => setPlacementFilter(event.target.value as BannerPlacement | '')}
            aria-label="Filter by placement"
          >
            <option value="">All placements</option>
            {PLACEMENTS.map((place) => (
              <option key={place.value} value={place.value}>
                {place.label} ({items.filter((row) => row.placement === place.value).length})
              </option>
            ))}
          </select>
          <p className="text-sm text-[var(--muted)]">
            {items.length} banner{items.length === 1 ? '' : 's'} ·{' '}
            {items.filter((row) => row.isActive).length} live
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {grouped.map((place) => (
            <span
              key={place.value}
              className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-medium text-[var(--muted)]"
              title={place.hint}
            >
              {place.label}: {place.count}
            </span>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="skeleton h-64 w-full" />
      ) : items.length === 0 ? (
        <section className="surface-card p-6">
          <EmptyState
            icon={ImagePlus}
            title="No banners yet"
            description="Upload the hero artwork, or the official scheme banner, and it appears on the site straight away."
            action={
              <button type="button" className="brand-button" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Upload the first banner
              </button>
            }
          />
        </section>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((banner) => (
            <article key={banner.id} className="surface-card overflow-hidden">
              <div className="relative aspect-[16/9] bg-[var(--surface-muted)]">
                <Image src={banner.imageUrl} alt={banner.altText} fill sizes="(min-width: 1280px) 30vw, 50vw" className="object-cover" />
                <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur">
                  {PLACEMENTS.find((place) => place.value === banner.placement)?.label ?? banner.placement}
                </span>
                <span
                  className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                    banner.isActive ? 'bg-[var(--success)] text-white' : 'bg-white/85 text-[var(--muted)]'
                  }`}
                >
                  {banner.isActive ? 'Live' : 'Hidden'}
                </span>
              </div>

              <div className="space-y-3 p-4">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--foreground)]">{banner.title}</h2>
                  <p className="mt-0.5 line-clamp-2 text-xs text-[var(--muted)]">{banner.altText}</p>
                </div>

                <dl className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <dt className="text-[var(--muted-soft)]">Campaign</dt>
                    <dd className="font-medium text-[var(--foreground)]">{banner.campaign ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--muted-soft)]">Order</dt>
                    <dd className="font-medium text-[var(--foreground)]">{banner.order}</dd>
                  </div>
                </dl>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button type="button" className="neutral-button !px-3 !py-2 text-xs" onClick={() => openEdit(banner)}>
                    Edit
                  </button>
                  <button type="button" className="ghost-button !px-3 !py-2 text-xs" onClick={() => handleToggle(banner)}>
                    {banner.isActive ? 'Hide' : 'Publish'}
                  </button>
                  <button
                    type="button"
                    className="ghost-button !px-3 !py-2 text-xs"
                    onClick={() => openQr(banner)}
                    title="QR code for a printed banner"
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    QR
                  </button>
                  <button
                    type="button"
                    className="ghost-button !px-3 !py-2 text-xs text-[var(--error)]"
                    onClick={() => setDeleting(banner)}
                    aria-label={`Delete ${banner.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Upload / edit */}
      <Modal
        open={formOpen}
        onClose={() => !saving && setFormOpen(false)}
        title={editing ? 'Edit banner' : 'Upload banner'}
        eyebrow={editing ? 'Change the artwork or where it appears' : 'Artwork is uploaded first, then saved'}
        size="lg"
      >
        {formError && (
          <div role="alert" className="mb-4 rounded-lg border border-[var(--error)] bg-[var(--error-tint)] p-3 text-sm text-[var(--error)]">
            {formError}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="form-label" htmlFor="banner-file">
              Image
            </label>
            <input
              id="banner-file"
              type="file"
              accept="image/*"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="form-input file:mr-3 file:rounded-full file:border-0 file:bg-[var(--primary-tint)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[var(--primary-active)]"
            />
            {editing && !file && (
              <p className="mt-1.5 text-xs text-[var(--muted)]">Leave empty to keep the current artwork.</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="form-label" htmlFor="banner-title">
                Title
              </label>
              <input
                id="banner-title"
                className="form-input"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Monsoon offer 2026"
              />
            </div>
            <div>
              <label className="form-label" htmlFor="banner-placement">
                Placement
              </label>
              <select
                id="banner-placement"
                className="form-input"
                value={form.placement}
                onChange={(event) => setForm((prev) => ({ ...prev, placement: event.target.value as BannerPlacement }))}
              >
                {PLACEMENTS.map((place) => (
                  <option key={place.value} value={place.value}>
                    {place.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="form-label" htmlFor="banner-alt">
              Alt text
            </label>
            <input
              id="banner-alt"
              className="form-input"
              value={form.altText}
              onChange={(event) => setForm((prev) => ({ ...prev, altText: event.target.value }))}
              placeholder="Describe what the banner shows, for screen readers"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="form-label" htmlFor="banner-link">
                Link (optional)
              </label>
              <input
                id="banner-link"
                className="form-input"
                value={form.linkUrl}
                onChange={(event) => setForm((prev) => ({ ...prev, linkUrl: event.target.value }))}
                placeholder="/projects or https://…"
              />
            </div>
            <div>
              <label className="form-label" htmlFor="banner-cta">
                Button label (optional)
              </label>
              <input
                id="banner-cta"
                className="form-input"
                value={form.ctaLabel}
                onChange={(event) => setForm((prev) => ({ ...prev, ctaLabel: event.target.value }))}
                placeholder="See the projects"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="form-label" htmlFor="banner-campaign">
                Campaign tag
              </label>
              <input
                id="banner-campaign"
                className="form-input"
                value={form.campaign}
                onChange={(event) => setForm((prev) => ({ ...prev, campaign: event.target.value }))}
                placeholder="puja-2026"
              />
              <p className="mt-1 text-xs text-[var(--muted)]">Used in the printed banner&apos;s QR link.</p>
            </div>
            <div>
              <label className="form-label" htmlFor="banner-order">
                Order
              </label>
              <input
                id="banner-order"
                type="number"
                className="form-input"
                value={form.order}
                onChange={(event) => setForm((prev) => ({ ...prev, order: event.target.value }))}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                  className="h-4 w-4 rounded border-[var(--border)] text-[var(--primary)]"
                />
                Live on the site
              </label>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="form-label" htmlFor="banner-start">
                Starts (optional)
              </label>
              <input
                id="banner-start"
                type="date"
                className="form-input"
                value={form.startsAt}
                onChange={(event) => setForm((prev) => ({ ...prev, startsAt: event.target.value }))}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="banner-end">
                Ends (optional)
              </label>
              <input
                id="banner-end"
                type="date"
                className="form-input"
                value={form.endsAt}
                onChange={(event) => setForm((prev) => ({ ...prev, endsAt: event.target.value }))}
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button type="button" className="neutral-button" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="brand-button" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Upload banner'}
            </button>
          </div>
        </div>
      </Modal>

      {/* QR for print */}
      <Modal
        open={Boolean(qrBanner)}
        onClose={() => setQrBanner(null)}
        title="QR code for print"
        eyebrow="Scanning this lands on the enquiry form, already tagged"
      >
        <div className="space-y-4">
          {qrDataUrl ? (
            <div className="flex flex-col items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="Campaign QR code" className="h-56 w-56 rounded-xl border border-[var(--border-soft)]" />
              <button
                type="button"
                className="brand-button"
                onClick={() => downloadDataUrl(qrDataUrl, `qr-${qrBanner?.campaign || 'banner'}.png`)}
              >
                <Download className="h-4 w-4" />
                Download PNG
              </button>
            </div>
          ) : (
            <div className="skeleton h-56 w-56 mx-auto" />
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-soft)]">Scans open</p>
            <p className="mt-1 break-all rounded-lg bg-[var(--surface-muted)] p-3 font-mono text-xs text-[var(--foreground)]">
              {qrLink}
            </p>
          </div>

          <p className="flex items-start gap-2 text-xs leading-6 text-[var(--muted)]">
            <Link2 className="mt-1 h-3.5 w-3.5 shrink-0" />
            The code carries <code className="font-mono">utm_source</code> and <code className="font-mono">utm_campaign</code>,
            so enquiries from this poster are labelled with the campaign instead of arriving as a bare phone number.
          </p>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete banner"
        message={`Delete "${deleting?.title}"? The artwork file stays in storage but the banner is removed from the site.`}
        confirmLabel="Delete banner"
        busy={deleteBusy}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </PageContainer>
  );
}

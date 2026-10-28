'use client';

import { useMemo, useRef, useState } from 'react';
import { Camera, CheckCircle2, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { InstallationDocument } from '@/types/installation';
import { installationsApi } from '@/lib/api/installations.api';

interface InstallationEvidenceCardProps {
  installation: InstallationDocument;
  /** Reload the installation after a save. */
  onChanged: () => Promise<void> | void;
  /** The crew and the office both write evidence; a read-only view is for others. */
  editable?: boolean;
}

/** The same rules the server applies before it will call a job complete. */
const gapsFor = (installation: InstallationDocument): string[] => {
  const gaps: string[] = [];
  const panels = installation.panelUnits ?? [];

  if (panels.length === 0) {
    gaps.push('Add the panels and their serial numbers');
  } else {
    const noSerial = panels.filter((panel) => !String(panel.serial || '').trim()).length;
    const noPhoto = panels.filter((panel) => !panel.photoUrl).length;
    if (noSerial) gaps.push(`${noSerial} panel(s) without a serial`);
    if (noPhoto) gaps.push(`${noPhoto} panel(s) without a photo`);
  }

  if (!installation.sitePhotos?.panels?.url) gaps.push('Site photo of the panels');
  if (!installation.sitePhotos?.meter?.url) gaps.push('Site photo with the new meter');
  if (!installation.inverter?.brand) gaps.push('Inverter brand');
  if (!installation.inverter?.serial) gaps.push('Inverter serial');
  if (!installation.inverter?.photoUrl) gaps.push('Photo of the inverter');

  return gaps;
};

export function InstallationEvidenceCard({
  installation,
  onChanged,
  editable = true,
}: InstallationEvidenceCardProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [panelCount, setPanelCount] = useState<number>(() =>
    Math.max(1, Math.ceil(((installation.systemSizeKW ?? 3) * 1000) / 580))
  );

  const photoInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const panels = installation.panelUnits ?? [];
  const gaps = useMemo(() => gapsFor(installation), [installation]);

  const run = async (key: string, work: () => Promise<unknown>) => {
    setBusy(key);
    setError(null);
    try {
      await work();
      await onChanged();
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Something went wrong.';
      setError(message);
    } finally {
      setBusy(null);
    }
  };

  const uploadPhoto = async (slot: string, file: File | null, panelId?: string) => {
    if (!file) return;

    await run(`${slot}:${panelId ?? ''}`, () =>
      installationsApi.uploadEvidencePhoto(
        installation._id,
        file,
        slot === 'panel' ? { slot: 'panel', panelId } : { slot: slot as 'panels' | 'meter' | 'inverter' | 'marketing' }
      )
    );
  };

  const PhotoSlot = ({
    slot,
    label,
    url,
    hint,
  }: {
    slot: 'panels' | 'meter' | 'marketing';
    label: string;
    url?: string;
    hint?: string;
  }) => (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-soft)]">{label}</p>

      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mt-1 block truncate text-xs font-semibold text-[var(--primary-active)] underline-offset-2 hover:underline"
        >
          View photo
        </a>
      ) : (
        <p className="mt-1 text-xs text-[var(--muted)]">Not attached</p>
      )}

      {hint && <p className="mt-0.5 text-[11px] text-[var(--muted-soft)]">{hint}</p>}

      {editable && (
        <>
          <input
            ref={(node) => {
              photoInputs.current[slot] = node;
            }}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => void uploadPhoto(slot, event.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-3 py-1 text-[11px] font-semibold text-[var(--foreground)] disabled:opacity-50"
            disabled={busy !== null}
            onClick={() => photoInputs.current[slot]?.click()}
          >
            {busy === `${slot}:` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
            {url ? 'Replace' : 'Add photo'}
          </button>
        </>
      )}
    </div>
  );

  return (
    <section className="surface-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-[var(--foreground)]">Site evidence</h2>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
            Panel serials with a photo of each panel, the two site photographs, and the inverter that went in.
          </p>
        </div>
        <span
          className={
            gaps.length === 0
              ? 'badge-pill badge-success'
              : 'badge-pill bg-[var(--surface-muted)] text-[var(--muted)]'
          }
        >
          {gaps.length === 0 ? 'Documented' : `${gaps.length} missing`}
        </span>
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-[var(--error-tint)] px-3 py-2 text-xs text-[var(--error)]">
          {error}
        </p>
      )}

      {/* Panels */}
      <div className="mt-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Panels ({panels.length})</h3>

          {editable && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={60}
                value={panelCount}
                onChange={(event) => setPanelCount(Number(event.target.value) || 1)}
                className="form-input w-16 !py-1 text-xs"
                aria-label="How many panels"
              />
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-3 py-1 text-[11px] font-semibold text-[var(--foreground)] disabled:opacity-50"
                disabled={busy !== null}
                onClick={() =>
                  run('add-panels', () => installationsApi.addPanel(installation._id, { count: panelCount }))
                }
              >
                <ImagePlus className="h-3 w-3" /> Add rows
              </button>
            </div>
          )}
        </div>

        {panels.length === 0 ? (
          <p className="mt-2 rounded-lg bg-[var(--surface-muted)] px-3 py-2 text-xs leading-5 text-[var(--muted)]">
            No panels recorded yet. Add rows above — one row per panel — then type each serial off the sticker and
            photograph that panel.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {panels.map((panel, index) => (
              <li
                key={panel._id}
                className="flex flex-wrap items-center gap-2 rounded-[0.75rem] border border-[var(--border-soft)] px-3 py-2"
              >
                <span className="w-8 shrink-0 text-xs text-[var(--muted-soft)]">#{index + 1}</span>

                <input
                  className="form-input min-w-0 flex-1 !py-1.5 text-xs"
                  placeholder="Panel serial number"
                  defaultValue={panel.serial ?? ''}
                  disabled={!editable || busy !== null}
                  onBlur={(event) => {
                    const value = event.target.value.trim();
                    if (value === (panel.serial ?? '')) return;
                    void run(`serial:${panel._id}`, () =>
                      installationsApi.updatePanel(installation._id, panel._id, value)
                    );
                  }}
                />

                <input
                  ref={(node) => {
                    photoInputs.current[`panel:${panel._id}`] = node;
                  }}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(event) => void uploadPhoto('panel', event.target.files?.[0] ?? null, panel._id)}
                />

                {panel.photoUrl ? (
                  <a
                    href={panel.photoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-semibold text-[var(--primary-active)] underline-offset-2 hover:underline"
                  >
                    Photo
                  </a>
                ) : null}

                {editable && (
                  <>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-3 py-1 text-[11px] font-semibold text-[var(--foreground)] disabled:opacity-50"
                      disabled={busy !== null}
                      onClick={() => photoInputs.current[`panel:${panel._id}`]?.click()}
                    >
                      {busy === `panel:${panel._id}` ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Camera className="h-3 w-3" />
                      )}
                      {panel.photoUrl ? 'Replace' : 'Photo'}
                    </button>

                    <button
                      type="button"
                      className="text-[var(--error)] disabled:opacity-50"
                      disabled={busy !== null}
                      aria-label={`Remove panel ${index + 1}`}
                      onClick={() =>
                        run(`remove:${panel._id}`, () =>
                          installationsApi.removePanel(installation._id, panel._id)
                        )
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Site photos */}
      <div className="mt-5 grid gap-4 border-t border-[var(--border-soft)] pt-4 sm:grid-cols-3">
        <PhotoSlot slot="panels" label="Site — panels" url={installation.sitePhotos?.panels?.url} />
        <PhotoSlot
          slot="meter"
          label="Site — new meter"
          url={installation.sitePhotos?.meter?.url}
          hint="The meter installed with the system."
        />
        <PhotoSlot
          slot="marketing"
          label="With the customer"
          url={installation.marketingPhoto?.url}
          hint="Optional — for the shop's own use."
        />
      </div>

      {/* Inverter */}
      <div className="mt-5 border-t border-[var(--border-soft)] pt-4">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Inverter</h3>
        <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-soft)]">
              Brand
            </span>
            <input
              className="form-input mt-1 w-full !py-1.5 text-xs"
              placeholder="e.g. Growatt"
              defaultValue={installation.inverter?.brand ?? ''}
              disabled={!editable || busy !== null}
              onBlur={(event) => {
                const value = event.target.value.trim();
                if (value === (installation.inverter?.brand ?? '')) return;
                void run('inverter-brand', () =>
                  installationsApi.updateInverter(installation._id, { brand: value })
                );
              }}
            />
          </label>

          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-soft)]">
              Serial number
            </span>
            <input
              className="form-input mt-1 w-full !py-1.5 text-xs"
              placeholder="Inverter serial"
              defaultValue={installation.inverter?.serial ?? ''}
              disabled={!editable || busy !== null}
              onBlur={(event) => {
                const value = event.target.value.trim();
                if (value === (installation.inverter?.serial ?? '')) return;
                void run('inverter-serial', () =>
                  installationsApi.updateInverter(installation._id, { serial: value })
                );
              }}
            />
          </label>

          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-soft)]">
              Capacity (kW)
            </span>
            <input
              type="number"
              min={0.1}
              max={100}
              step="0.1"
              inputMode="decimal"
              className="form-input mt-1 w-full !py-1.5 text-xs"
              placeholder="e.g. 3"
              defaultValue={installation.inverterCapacity ?? ''}
              disabled={!editable || busy !== null}
              onBlur={(event) => {
                const raw = event.target.value.trim();
                const current = installation.inverterCapacity;
                // Nothing typed and nothing stored: no request to make.
                if (raw === '' && current == null) return;
                if (raw !== '' && Number(raw) === current) return;

                if (raw !== '' && (Number(raw) <= 0 || Number(raw) > 100)) {
                  toast.error('Inverter capacity must be between 0.1 and 100 kW');
                  event.target.value = current != null ? String(current) : '';
                  return;
                }

                void run('inverter-capacity', () =>
                  installationsApi.updateInverter(installation._id, {
                    capacityKW: raw === '' ? null : Number(raw),
                  })
                );
              }}
            />
          </label>

          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-soft)]">
              Photo
            </span>
            <div className="mt-1">
              {installation.inverter?.photoUrl ? (
                <a
                  href={installation.inverter.photoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-[var(--primary-active)] underline-offset-2 hover:underline"
                >
                  View photo
                </a>
              ) : (
                <p className="text-xs text-[var(--muted)]">Not attached</p>
              )}
            </div>

            {editable && (
              <>
                <input
                  ref={(node) => {
                    photoInputs.current.inverter = node;
                  }}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(event) => void uploadPhoto('inverter', event.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-3 py-1 text-[11px] font-semibold text-[var(--foreground)] disabled:opacity-50"
                  disabled={busy !== null}
                  onClick={() => photoInputs.current.inverter?.click()}
                >
                  {busy === 'inverter:' ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Camera className="h-3 w-3" />
                  )}
                  {installation.inverter?.photoUrl ? 'Replace' : 'Add photo'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Completion */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-soft)] pt-4">
        <div className="min-w-0">
          {gaps.length === 0 ? (
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--success)]">
              <CheckCircle2 className="h-4 w-4" /> Every panel, photo and the inverter are recorded.
            </p>
          ) : (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-soft)]">
                Still missing
              </p>
              <ul className="mt-1 list-inside list-disc text-xs text-[var(--muted)]">
                {gaps.map((gap) => (
                  <li key={gap}>{gap}</li>
                ))}
              </ul>
            </>
          )}
        </div>

        {editable && installation.status !== 'completed' && (
          <button
            type="button"
            className="brand-button disabled:opacity-50"
            disabled={busy !== null || gaps.length > 0}
            onClick={() => run('complete', () => installationsApi.complete(installation._id))}
          >
            {busy === 'complete' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Mark installation complete
          </button>
        )}
      </div>
    </section>
  );
}

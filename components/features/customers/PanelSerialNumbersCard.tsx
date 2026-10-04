'use client';

import { useState } from 'react';
import { Hash, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { formatNumber } from '@/lib/format';
import { handleApiError } from '@/lib/errors/handleApiError';
import { PANEL_WATT_PEAK, suggestPanelCount } from './panelSpec';

interface PanelSerialNumbersCardProps {
  /** What is saved, in the order it was recorded. */
  serials: string[];
  systemSizeKW: number;
  canEdit: boolean;
  onSave: (serials: string[]) => Promise<void>;
}

/**
 * The serials read off the panels at installation, one row each.
 *
 * Typed rather than photographed because the same list is needed later, when the
 * DCR and net-metering paperwork is filed and someone has to read the numbers back
 * out. A partly filled row is a normal state, so blanks are dropped on save
 * instead of being refused.
 */
export function PanelSerialNumbersCard({
  serials,
  systemSizeKW,
  canEdit,
  onSave,
}: PanelSerialNumbersCardProps) {
  /** `null` while reading the saved list; an array while editing it. */
  const [draft, setDraft] = useState<string[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggested = suggestPanelCount(systemSizeKW);
  const editing = draft !== null;

  /* "6 of about 6" is the question an installer actually has when they open
     this card, so it leads rather than sitting in fine print underneath. */
  const recordedSummary =
    suggested > 0
      ? `${formatNumber(systemSizeKW)} kW system · ${serials.length} of about ${suggested} panels recorded`
      : `${serials.length} panel${serials.length === 1 ? '' : 's'} recorded`;

  const startEditing = () => {
    setError(null);
    /*
     * Opened from what is saved, padded out to the number of panels the system
     * size implies — so a first entry already has the right number of rows to type
     * into rather than one and a hunt for "add".
     */
    const rows = [...serials];
    while (rows.length < suggested) rows.push('');
    setDraft(rows);
  };

  const updateRow = (index: number, value: string) =>
    setDraft((current) => (current ? current.map((row, index2) => (index2 === index ? value : row)) : current));

  const addRow = () => setDraft((current) => [...(current ?? []), '']);

  const removeRow = (index: number) =>
    setDraft((current) => (current ? current.filter((_, index2) => index2 !== index) : current));

  const save = async () => {
    if (!draft) return;

    setSaving(true);
    setError(null);

    try {
      await onSave(draft.map((value) => value.trim()).filter(Boolean));
      setDraft(null);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card-luxe wash-violet p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(140deg,#6D5BD0_0%,#4635A3_100%)] text-white shadow-[var(--shadow-sm)]">
            <Hash className="h-5 w-5" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Panel serial numbers</h2>
              {suggested > 0 && (
                <span className="badge-pill bg-white/70 text-[var(--muted)]">
                  {PANEL_WATT_PEAK} Wp module
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-[var(--muted)]">{recordedSummary}</p>
          </div>
        </div>

        {canEdit && !editing && (
          <button type="button" className="neutral-button" onClick={startEditing}>
            <Pencil className="h-4 w-4" />
            {serials.length > 0 ? 'Edit serials' : 'Add serials'}
          </button>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-[var(--error)] bg-[var(--error-tint)] p-3 text-sm text-[var(--error)]"
        >
          {error}
        </div>
      )}

      {!editing ? (
        serials.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--muted)]">No panel serial numbers recorded yet.</p>
        ) : (
          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {serials.map((serial, index) => (
              <li
                key={`${serial}-${index}`}
                className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--border-soft)] bg-white/75 px-3 py-2"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary-tint)] text-[0.625rem] font-bold text-[var(--primary-active)]">
                  {index + 1}
                </span>
                <span className="truncate font-mono text-sm text-[var(--foreground)]" title={serial}>
                  {serial}
                </span>
              </li>
            ))}
          </ul>
        )
      ) : (
        <div className="mt-4 space-y-3">
          {draft.map((row, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-xs text-[var(--muted)]">Panel {index + 1}</span>
              <input
                value={row}
                onChange={(event) => updateRow(index, event.target.value)}
                placeholder="Serial number"
                aria-label={`Panel ${index + 1} serial number`}
                maxLength={60}
                className="form-input font-mono"
              />
              <button
                type="button"
                onClick={() => removeRow(index)}
                aria-label={`Remove panel ${index + 1}`}
                className="ghost-button !p-2 text-[var(--muted)] hover:text-[var(--error)]"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          {draft.length === 0 && (
            <p className="text-sm text-[var(--muted)]">
              No rows left — add one, or cancel to keep what is saved.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button type="button" onClick={addRow} className="neutral-button">
              <Plus className="h-4 w-4" />
              Add panel
            </button>
            <button type="button" onClick={save} disabled={saving} className="brand-button">
              <Save className="h-4 w-4" />
              {saving ? 'Saving…' : 'Save serials'}
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(null);
                setError(null);
              }}
              disabled={saving}
              className="ghost-button"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

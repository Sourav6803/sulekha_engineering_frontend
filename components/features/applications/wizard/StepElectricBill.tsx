'use client';

import { useRef, useState } from 'react';
import { CheckCircle2, Copy, ExternalLink, Loader2, Upload } from 'lucide-react';
import { StepSection, TextField } from './WizardFields';
import type { ApplicationChecklist, ApplicationDocument } from '@/types/application';
import type { DocumentExtrasForm } from './StepDocuments';
import type { WizardStepProps } from './wizardTypes';

interface StepElectricBillProps extends WizardStepProps {
  checklist: ApplicationChecklist | null;
  application: ApplicationDocument | null;
  onUpload: (kind: 'electricBill', file: File, extras: DocumentExtrasForm) => Promise<string | null>;
  onDelete: (documentId: string) => Promise<string | null>;
  onCopy: (label: string, value: string) => void;
}

/**
 * Step 5 — the electricity bill.
 *
 * There is no separate endpoint for the bill file: the agent downloads it from
 * the WBSEDCL portal using the Consumer ID and Installation ID, and the
 * downloaded file is uploaded through the documents endpoint with
 * `kind: 'electricBill'`. The portal URL comes from the checklist, never a
 * hardcoded link.
 */
export function StepElectricBill({
  form,
  setForm,
  errors,
  disabled,
  checklist,
  application,
  onUpload,
  onDelete,
  onCopy,
}: StepElectricBillProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const portalUrl = checklist?.billPortalUrl ?? '';
  const billFiles = (application?.documents ?? []).filter((entry) => entry.kind === 'electricBill');
  const billAttached = Boolean(application?.electricBill?.fileUrl) || billFiles.length > 0;

  // No clarity gate here either — see the note in StepDocuments.tsx. A bill
  // downloaded from the portal is a PDF and was never pixel-checked anyway.
  const handlePick = (picked: File | null) => {
    setActionError(null);
    setFile(picked);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setActionError(null);
    try {
      const failure = await onUpload(
        'electricBill',
        file,
        { accountNumber: '', ifsc: '', branchName: '', accountType: '' }
      );
      if (failure) {
        setActionError(failure);
        return;
      }
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
    } finally {
      setUploading(false);
    }
  };

  const bothIds = [form.electricBill.consumerId.trim(), form.electricBill.installationNo.trim()]
    .filter(Boolean)
    .join(' / ');

  return (
    <div className="space-y-4">
      <StepSection
        title="Consumer ID & Installation ID"
        description="Both are printed on the electricity bill. They are stored in capitals."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="bill-consumer-id"
            label="Consumer ID"
            required
            value={form.electricBill.consumerId}
            onValueChange={(value) =>
              setForm((prev) => ({ ...prev, electricBill: { ...prev.electricBill, consumerId: value } }))
            }
            placeholder="From the bill"
            maxLength={40}
            error={errors['electricBill.consumerId']}
            disabled={disabled}
          />

          <TextField
            id="bill-installation-no"
            label="Installation ID"
            required
            value={form.electricBill.installationNo}
            onValueChange={(value) =>
              setForm((prev) => ({ ...prev, electricBill: { ...prev.electricBill, installationNo: value } }))
            }
            placeholder="From the bill"
            maxLength={40}
            error={errors['electricBill.installationNo']}
            disabled={disabled}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="neutral-button px-3 py-2 text-xs"
            onClick={() => onCopy('Consumer ID', form.electricBill.consumerId.trim())}
            disabled={!form.electricBill.consumerId.trim()}
          >
            <Copy className="h-3.5 w-3.5" /> Copy Consumer ID
          </button>
          <button
            type="button"
            className="neutral-button px-3 py-2 text-xs"
            onClick={() => onCopy('Installation ID', form.electricBill.installationNo.trim())}
            disabled={!form.electricBill.installationNo.trim()}
          >
            <Copy className="h-3.5 w-3.5" /> Copy Installation ID
          </button>
          <button
            type="button"
            className="neutral-button px-3 py-2 text-xs"
            onClick={() => onCopy('Consumer ID / Installation ID', bothIds)}
            disabled={!bothIds}
          >
            <Copy className="h-3.5 w-3.5" /> Copy both
          </button>
        </div>
      </StepSection>

      <StepSection
        title="Download the bill, then upload it here"
        description="Open the WBSEDCL portal, paste the two IDs, download the bill and attach the downloaded file below."
      >
        <div className="flex flex-wrap items-center gap-2">
          {portalUrl ? (
            <a
              href={portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="brand-button px-4 py-2 text-xs"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Open WBSEDCL portal
            </a>
          ) : (
            <span className="rounded-[1rem] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-2 text-[11px] text-[var(--muted)]">
              The portal link will appear once the checklist has loaded.
            </span>
          )}

          <span className="text-[11px] leading-4 text-[var(--muted)]">
            The portal opens in a new tab — come back here once the bill is saved on the phone.
          </span>
        </div>

        <p className="mt-3 rounded-[1rem] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-2.5 text-[11px] leading-5 text-[var(--muted)]">
          The bill is not verified from the portal by the app: you download it, and the downloaded file is the
          electricity-bill document on the file. The office later confirms the IDs on it.
        </p>

        {billAttached ? (
          <div className="mt-3 space-y-2">
            <p className="flex items-center gap-2 rounded-[1rem] border border-[var(--success)] bg-[var(--success-tint)] px-3 py-2.5 text-xs font-medium text-[var(--success)]">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Bill attached
              {application?.electricBill?.fileName ? (
                <span className="truncate font-normal">• {application.electricBill.fileName}</span>
              ) : null}
            </p>

            {billFiles.length > 0 && (
              <ul className="space-y-2">
                {billFiles.map((entry) => (
                  <li
                    key={entry._id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-[1rem] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-2"
                  >
                    <span className="min-w-0 truncate text-xs text-[var(--foreground)]">
                      {entry.fileName ?? 'Bill file'}
                    </span>
                    <button
                      type="button"
                      className="text-[11px] font-semibold text-[var(--error)] hover:underline"
                      onClick={() => {
                        void onDelete(entry._id).then((failure) => {
                          if (failure) setActionError(failure);
                        });
                      }}
                      disabled={disabled}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <p className="mt-3 text-[11px] leading-4 text-[var(--muted)]">
            No bill attached yet — this one is mandatory before the file can be submitted.
          </p>
        )}

        <div className="mt-3 space-y-2">
          <input
            ref={inputRef}
            id="bill-file"
            type="file"
            accept="image/*,application/pdf"
            capture="environment"
            disabled={disabled || uploading}
            onChange={(event) => handlePick(event.target.files?.[0] ?? null)}
            className="block w-full cursor-pointer rounded-[var(--radius-sm)] border border-dashed border-[var(--border)] bg-white/60 px-3 py-2.5 text-xs text-[var(--muted)] file:mr-3 file:rounded-[var(--radius-full)] file:border-0 file:bg-[var(--primary-tint)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[var(--primary-active)]"
          />

          {file && (
            <button
              type="button"
              className="brand-button px-4 py-2 text-xs"
              onClick={() => void handleUpload()}
              disabled={uploading || disabled}
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {uploading ? 'Uploading…' : 'Upload bill'}
            </button>
          )}

          {actionError && (
            <p role="alert" className="text-[11px] leading-4 text-[var(--error)] [overflow-wrap:anywhere]">
              {actionError}
            </p>
          )}
        </div>
      </StepSection>
    </div>
  );
}

export default StepElectricBill;

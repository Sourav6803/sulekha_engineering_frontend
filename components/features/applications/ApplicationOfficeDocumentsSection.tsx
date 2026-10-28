'use client';

import { useRef, useState } from 'react';
import { FileText, Loader2, Trash2, Upload } from 'lucide-react';
import type { ApplicationChecklist } from '@/types/application';
import type { ApplicationDocumentFile, ApplicationDocumentKind } from '@/types/application';

/** The paperwork the office holds but the field never does. */
const PAPERWORK_KINDS: ApplicationDocumentKind[] = [
  'issuedQuotation',
  'issuedAgreement',
  'signedQuotation',
  'signedAgreement',
];

interface ApplicationOfficeDocumentsSectionProps {
  checklist: ApplicationChecklist | null;
  files: ApplicationDocumentFile[];
  /** POST /applications/:id/documents — office only for these kinds. */
  onUpload: (file: File, kind: ApplicationDocumentKind) => Promise<string | null>;
  onRemove?: (documentId: string) => Promise<string | null>;
}

/**
 * The scheme paperwork: feasibility report, RTS report, loan letter, DCR, eToken,
 * net-metering agreement, acknowledgement.
 *
 * These come from the DISCOM, the lender and the portal — the office holds them and
 * the agent never does, so the checklist used to hide them entirely and there was
 * nowhere to upload one. They are listed here instead: present or missing, with a
 * replace and a remove, and no verdict attached, because there is nothing to
 * approve — a DCR certificate either exists or it does not.
 */
export function ApplicationOfficeDocumentsSection({
  checklist,
  files,
  onUpload,
  onRemove,
}: ApplicationOfficeDocumentsSectionProps) {
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [pendingKind, setPendingKind] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const kinds = (checklist?.documents ?? []).filter(
    (doc) => doc.filedBy === 'office' && !PAPERWORK_KINDS.includes(doc.kind)
  );

  if (kinds.length === 0) return null;

  const fileFor = (kind: ApplicationDocumentKind) => files.find((file) => file.kind === kind) ?? null;

  const handleFile = async (kind: ApplicationDocumentKind, file: File | null) => {
    if (!file) return;

    setPendingKind(kind);
    setError(null);
    try {
      const failure = await onUpload(file, kind);
      if (failure) setError(failure);
      else if (inputRefs.current[kind]) inputRefs.current[kind]!.value = '';
    } finally {
      setPendingKind(null);
    }
  };

  const attached = kinds.filter((doc) => fileFor(doc.kind)).length;

  return (
    <section className="surface-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-[var(--foreground)]">Scheme documents</h2>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
            Feasibility, RTS report, loan letter, DCR, eToken, net metering and acknowledgement — uploaded here as
            they arrive.
          </p>
        </div>
        <span className="badge-pill bg-[var(--surface-muted)] text-[var(--muted)]">
          {attached} of {kinds.length}
        </span>
      </div>

      <ul className="mt-4 space-y-2">
        {kinds.map((doc) => {
          const file = fileFor(doc.kind);
          const busy = pendingKind === doc.kind;

          return (
            <li
              key={doc.kind}
              className="flex flex-wrap items-center justify-between gap-2 rounded-[0.75rem] border border-[var(--border-soft)] px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-sm font-medium text-[var(--foreground)]">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-[var(--muted-soft)]" />
                  <span className="truncate">{doc.label}</span>
                </p>
                <p className="mt-0.5 truncate text-[11px] text-[var(--muted)]">
                  {file ? file.fileName || 'Attached' : 'Not attached'}
                </p>
              </div>

              <div className="flex min-w-0 flex-wrap items-center gap-2">
                {file && (
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-semibold text-[var(--primary-active)] underline-offset-2 hover:underline"
                  >
                    Open
                  </a>
                )}

                <input
                  ref={(node) => {
                    inputRefs.current[doc.kind] = node;
                  }}
                  type="file"
                  accept="application/pdf,image/*"
                  className="hidden"
                  onChange={(event) => void handleFile(doc.kind, event.target.files?.[0] ?? null)}
                />

                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-3 py-1 text-[11px] font-semibold text-[var(--foreground)] disabled:opacity-50"
                  disabled={busy}
                  onClick={() => inputRefs.current[doc.kind]?.click()}
                >
                  {busy ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Upload className="h-3 w-3" />
                  )}
                  {file ? 'Replace' : 'Upload'}
                </button>

                {file && onRemove && (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--error)] disabled:opacity-50"
                    disabled={busy}
                    onClick={async () => {
                      setPendingKind(doc.kind);
                      setError(null);
                      try {
                        const failure = await onRemove(file._id);
                        if (failure) setError(failure);
                      } finally {
                        setPendingKind(null);
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {error && (
        <p role="alert" className="mt-2 text-[11px] leading-4 text-[var(--error)] [overflow-wrap:anywhere]">
          {error}
        </p>
      )}
    </section>
  );
}

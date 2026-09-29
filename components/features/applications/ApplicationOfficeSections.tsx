'use client';

import { useRef, useState } from 'react';
import { FileText, Info, Loader2, ShieldCheck, Undo2, Upload, XCircle } from 'lucide-react';
import { ApplicationStatusBadge } from './ApplicationStatusBadge';
import { DocumentDownload, DocumentPreview } from './DocumentPreview';
import { documentDisplayName } from './documentExtras';
import { formatDateTime } from '@/lib/format';
import type { ApplicationStatusMeta } from './applicationDisplay';
import type { ApplicationViewMode } from './ApplicationDocumentsSection';
import type {
  ApplicationChecklist,
  ApplicationDocument,
  ApplicationDocumentFile,
  ApplicationDocumentKind,
  ApplicationReviewPayload,
  ApplicationStatus,
  ApplicationStatusUpdatePayload,
} from '@/types/application';

interface OfficeDecisionPanelProps {
  application: ApplicationDocument;
  /** Status options from GET /applications/checklist — never hardcoded. */
  statuses?: ApplicationChecklist['statuses'];
  statusMeta: ApplicationStatusMeta;
  /** PATCH /applications/:id/status */
  onUpdateStatus: (payload: ApplicationStatusUpdatePayload) => Promise<string | null>;
  /** PATCH /applications/:id/review — send back for correction / reject. */
  onReview: (payload: ApplicationReviewPayload) => Promise<string | null>;
}

/**
 * The office's workflow controls: move the file with the checklist's own status
 * list, or send it back / reject it with a reason the agent has to act on. The
 * reason is required by the server for both of the refusal paths, so it is
 * required here too — and the server's own wording is shown on any refusal.
 */
export function OfficeDecisionPanel({
  application,
  statuses,
  statusMeta,
  onUpdateStatus,
  onReview,
}: OfficeDecisionPanelProps) {
  const options = statuses ?? [];
  const [status, setStatus] = useState<ApplicationStatus>(application.status);
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');

  const [pending, setPending] = useState<'status' | 'correction' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const statusLabel = statusMeta[application.status]?.label;

  const run = async (action: 'status' | 'correction' | 'reject') => {
    setPending(action);
    setError(null);
    try {
      const failure =
        action === 'status'
          ? await onUpdateStatus({ status, note: note.trim() || undefined })
          : await onReview({
              status: action === 'correction' ? 'correction_required' : 'rejected',
              rejectionReason: reason.trim() || undefined,
            });
      if (failure) {
        setError(failure);
        return;
      }
      setNote('');
      setReason('');
    } finally {
      setPending(null);
    }
  };

  const reasonMissing = reason.trim().length === 0;

  return (
    <section className="panel p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-[var(--foreground)]">Office decision</h2>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
            Move the file along the workflow, or send it back to the agent for correction. The office never edits the
            consumer&apos;s answers — the reason travels back to whoever collected them.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-soft)]">
            Current status
          </span>
          <ApplicationStatusBadge
            status={application.status}
            label={statusLabel}
            tone={statusMeta[application.status]?.tone}
          />
        </div>
      </div>

      {options.length === 0 && (
        <p className="mt-4 rounded-[1rem] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-2.5 text-[11px] leading-5 text-[var(--muted)]">
          The status list could not be loaded from the checklist, so the workflow controls are unavailable. Reload the
          page to try again.
        </p>
      )}

      {options.length > 0 && (
        <>
      {/* --- Move the file along the workflow --- */}
      <div className="mt-4 rounded-[1rem] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-3">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <label className="min-w-0">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-soft)]">
              Set status
            </span>
            <select
              className="form-input w-full"
              value={status}
              onChange={(event) => setStatus(event.target.value as ApplicationStatus)}
              disabled={pending !== null}
            >
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-0">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-soft)]">
              Note (optional)
            </span>
            <input
              className="form-input w-full"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Saved with the status change"
              disabled={pending !== null}
            />
          </label>
        </div>
        <button
          type="button"
          className="brand-button mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-xs"
          onClick={() => void run('status')}
          disabled={pending !== null}
        >
          {pending === 'status' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
          Update status
        </button>
      </div>

      {/* --- Send back / reject, each needing a reason --- */}
      <div className="mt-3 rounded-[1rem] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-3">
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-soft)]">
            Reason (required to send back or reject)
          </span>
          <textarea
            className="form-input min-h-[72px] w-full"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Tell the agent exactly what to fix or why the application is being rejected."
            disabled={pending !== null}
          />
        </label>
        <p className="mt-1 flex items-start gap-1.5 text-[11px] leading-4 text-[var(--muted)]">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          The server refuses these two actions without a reason, and the agent only sees what is written here.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="neutral-button inline-flex items-center gap-1.5 px-4 py-2 text-xs"
            onClick={() => void run('correction')}
            disabled={pending !== null || reasonMissing}
            title={reasonMissing ? 'Add a reason first' : undefined}
          >
            {pending === 'correction' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Undo2 className="h-3.5 w-3.5" />
            )}
            Send back for correction
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-full)] bg-[var(--error)] px-4 py-2 text-xs font-semibold text-white shadow-[var(--shadow-sm)] transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => void run('reject')}
            disabled={pending !== null || reasonMissing}
            title={reasonMissing ? 'Add a reason first' : undefined}
          >
            {pending === 'reject' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <XCircle className="h-3.5 w-3.5" />
            )}
            Reject
          </button>
        </div>
      </div>
        </>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-[0.75rem] border border-[var(--error)] bg-[var(--error-tint)] px-3 py-2 text-[11px] leading-4 text-[var(--error)] [overflow-wrap:anywhere]">
          {error}
        </p>
      )}

      {application.review?.reviewedAt && (
        <p className="mt-3 text-[11px] leading-4 text-[var(--muted)]">
          Last reviewed {formatDateTime(application.review.reviewedAt)}
          {application.review.reviewedBySnapshot ? ` by ${application.review.reviewedBySnapshot}` : ''}.
        </p>
      )}
    </section>
  );
}

interface QuotationAgreementSectionProps {
  /**
   * The form definition from GET /applications/checklist. The office-filed kinds
   * (`filedBy === 'office'`) and their labels are read from here, never hardcoded.
   */
  checklist: ApplicationChecklist | null;
  /** Already-uploaded signed quotation / agreement documents. */
  files: ApplicationDocumentFile[];
  /** `field` — view / download only. `office` — the office files them. */
  mode: ApplicationViewMode;
  /**
   * POST /applications/:id/signed-document — multipart `file` plus the chosen
   * `kind`. Office only; the field mode renders no upload path at all.
   */
  onUpload?: (file: File, kind: ApplicationDocumentKind) => Promise<string | null>;
}

const SIGNED_KIND_LABEL: Record<string, string> = {
  signedQuotation: 'Signed quotation',
  signedAgreement: 'Signed agreement',
};

/**
 * Quotation & agreement — the consumer-signed quotation and agreement.
 *
 * These are the office's paperwork: the consumer signs the printed quotation or
 * agreement, the office scans it back to PDF and files it here, stored as its own
 * document so the generated PDF is never overwritten. The office picks which one
 * it is filing; the field agent only ever views and downloads them.
 */
export function QuotationAgreementSection({
  checklist,
  files,
  mode,
  onUpload,
}: QuotationAgreementSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedKind, setSelectedKind] = useState<ApplicationDocumentKind | ''>('');

  const office = mode === 'office';

  // The office-filed kinds come straight off the checklist. The fallback keeps a
  // kind already on the file visible if the checklist has not arrived yet.
  const officeDocs = (checklist?.documents ?? []).filter((doc) => doc.filedBy === 'office');
  const groups: Array<{ kind: ApplicationDocumentKind; label: string }> =
    officeDocs.length > 0
      ? officeDocs.map((doc) => ({ kind: doc.kind, label: doc.label }))
      : Array.from(new Set(files.map((file) => file.kind))).map((kind) => ({
          kind,
          label: SIGNED_KIND_LABEL[kind] ?? 'Signed copy',
        }));

  const activeKind: ApplicationDocumentKind | null = selectedKind || groups[0]?.kind || null;

  const handleFileChosen = async (file: File | null) => {
    if (!file || !onUpload || !activeKind) return;
    setPending(true);
    setError(null);
    try {
      const failure = await onUpload(file, activeKind);
      if (failure) {
        setError(failure);
        return;
      }
      if (inputRef.current) inputRef.current.value = '';
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="panel p-4 sm:p-5">
      <h2 className="text-base font-semibold text-[var(--foreground)]">Quotation &amp; agreement</h2>
      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
        {office
          ? 'File the scanned, consumer-signed quotation or agreement here. It is kept as its own document, so the generated PDF is never overwritten.'
          : 'The office files the signed quotation and the signed agreement. You can view and download them once they are on the file.'}
      </p>

      {!office && (
        <p className="mt-3 flex items-start gap-2 rounded-[1rem] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-2.5 text-[11px] leading-5 text-[var(--muted)]">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="min-w-0 [overflow-wrap:anywhere]">
            These are filed by the office. They appear here as soon as they are on the file, and you can view and
            download each one.
          </span>
        </p>
      )}

      <div className="mt-3 space-y-3">
        {groups.length === 0 && (
          <p className="rounded-[1rem] border border-dashed border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2.5 text-[11px] leading-5 text-[var(--muted)]">
            No signed copy on file yet.
          </p>
        )}

        {groups.map((group) => {
          const groupFiles = files.filter((file) => file.kind === group.kind);

          return (
            <div key={group.kind} className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-soft)]">
                {group.label}
              </p>

              {groupFiles.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {groupFiles.map((file) => (
                    <li
                      key={file._id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-[1rem] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-xs font-medium text-[var(--foreground)]">
                          <FileText className="h-3.5 w-3.5 shrink-0 text-[var(--primary-active)]" aria-hidden="true" />
                          <span className="truncate">{documentDisplayName(file)}</span>
                        </p>
                        <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                          {SIGNED_KIND_LABEL[file.kind] ?? 'Signed copy'}
                          {file.uploadedAt ? ` • ${formatDateTime(file.uploadedAt)}` : ''}
                        </p>
                      </div>
                      {/* Same reason as the checklist rows: the action group must be
                          able to shrink and wrap, or it overflows the card edge. */}
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <DocumentPreview file={file} />
                        <DocumentDownload file={file} />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 rounded-[1rem] border border-dashed border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2.5 text-[11px] leading-5 text-[var(--muted)]">
                  No signed copy on file yet.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* The upload is the office's move — the field mode renders no input at all. */}
      {office && onUpload && (
        <div className="mt-3 space-y-2">
          {groups.length > 0 && (
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-soft)]">
                File as
              </span>
              <select
                className="form-input w-full"
                value={activeKind ?? ''}
                onChange={(event) => setSelectedKind(event.target.value as ApplicationDocumentKind)}
                disabled={pending}
              >
                {groups.map((group) => (
                  <option key={group.kind} value={group.kind}>
                    {group.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          <input
            ref={inputRef}
            id="application-signed-copy"
            type="file"
            accept="application/pdf,image/*"
            disabled={pending}
            onChange={(event) => void handleFileChosen(event.target.files?.[0] ?? null)}
            className="block w-full cursor-pointer rounded-[var(--radius-sm)] border border-dashed border-[var(--border)] bg-white/60 px-3 py-2.5 text-xs text-[var(--muted)] file:mr-3 file:rounded-[var(--radius-full)] file:border-0 file:bg-[var(--primary-tint)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[var(--primary-active)]"
          />
          <button
            type="button"
            className="brand-button inline-flex items-center gap-1.5 px-4 py-2 text-xs"
            onClick={() => inputRef.current?.click()}
            disabled={pending}
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {files.length === 0 ? 'Upload signed copy' : 'Upload another'}
          </button>
          {error && (
            <p role="alert" className="text-[11px] leading-4 text-[var(--error)] [overflow-wrap:anywhere]">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

/** Which documents count as the consumer-signed copy. */
const SIGNED_KINDS: ApplicationDocumentFile['kind'][] = ['signedQuotation', 'signedAgreement'];

export const signedCopyDocuments = (application: ApplicationDocument): ApplicationDocumentFile[] =>
  (application.documents ?? []).filter((file) => SIGNED_KINDS.includes(file.kind));

'use client';

import { useRef, useState } from 'react';
import { FileText, Loader2, RefreshCw, Trash2, Upload, X } from 'lucide-react';
import { SelectField, TextField } from './wizard/WizardFields';
import { humaniseEnum } from './applicationDisplay';
import { formatDateShort } from '@/lib/format';
import { DocumentDownload, DocumentPreview } from './DocumentPreview';
import { extrasFromDocument, extrasSeedKey, latestDocument } from './documentExtras';
import type { DocumentExtrasForm } from './documentExtras';
import type {
  ApplicationAccountType,
  ApplicationChecklist,
  ApplicationChecklistDocument,
  ApplicationDocument,
  ApplicationDocumentFile,
  ApplicationDocumentKind,
  ApplicationDocumentReviewPayload,
  ApplicationDocumentsSummary,
} from '@/types/application';

/** Values the backend accepts for `accountType` (application.validation.js). */
const ACCOUNT_TYPE_OPTIONS = [
  { value: 'savings', label: 'Savings' },
  { value: 'current', label: 'Current' },
  { value: 'cash_credit', label: 'Cash credit' },
  { value: 'other', label: 'Other' },
];

/** Which half of the workflow this screen is rendering. */
export type ApplicationViewMode = 'field' | 'office';

export type ReviewDocumentHandler = (
  documentId: string,
  payload: ApplicationDocumentReviewPayload
) => Promise<string | null>;

interface ApplicationDocumentsSectionProps {
  checklist: ApplicationChecklist | null;
  application: ApplicationDocument;
  /** The server's per-kind ledger + what is still missing. */
  summary: ApplicationDocumentsSummary;
  /**
   * `field` — the agent's editable view (upload / replace / delete).
   * `office` — the office's read-only review (verdicts, no consumer-data writes).
   */
  mode: ApplicationViewMode;
  /** False once the file set is closed (server refuses with a 400 shown verbatim). */
  documentEditable: boolean;
  onUpload: (
    kind: ApplicationDocumentKind,
    file: File,
    extras: DocumentExtrasForm
  ) => Promise<string | null>;
  onReplace: (
    kind: ApplicationDocumentKind,
    documentId: string,
    file: File,
    extras: DocumentExtrasForm
  ) => Promise<string | null>;
  onDelete: (documentId: string) => Promise<string | null>;
  /** Office only — the per-document verdict (PATCH …/documents/:id/review). */
  onReviewDocument?: ReviewDocumentHandler;
}

function qualityVerdictLabel(verdict?: string): string {
  if (verdict === 'pass') return 'Clear';
  if (verdict === 'fail') return 'Not clear';
  if (verdict === 'skipped') return 'Not measured';
  return 'Not measured';
}

function qualityVerdictClass(verdict?: string): string {
  if (verdict === 'pass') return 'badge-success';
  if (verdict === 'fail') return 'badge-warning';
  return 'bg-[var(--surface-strong)] text-[var(--muted)]';
}

/** Flatten the stored quality metrics into printable `key: value` pairs. */
function metricEntries(metrics?: Record<string, unknown>): Array<[string, string]> {
  if (!metrics) return [];
  return Object.entries(metrics).map(([key, value]) => [
    key,
    value && typeof value === 'object' ? JSON.stringify(value) : String(value),
  ]);
}

const ROW_BUTTON = 'neutral-button inline-flex items-center gap-1 px-3 py-1.5 text-[11px]';

interface FileRowProps {
  file: ApplicationDocumentFile;
  mode: ApplicationViewMode;
  disabled: boolean;
  pending: boolean;
  confirming: boolean;
  onAskReplace: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  /** Office review, when in office mode. */
  onReviewDocument?: ReviewDocumentHandler;
}

function FileRow({
  file,
  mode,
  disabled,
  pending,
  confirming,
  onAskReplace,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
  onReviewDocument,
}: FileRowProps) {
  const metrics = metricEntries(file.qualityCheck?.metrics);
  const reasons = file.qualityCheck?.reasons ?? [];
  const review = file.review;

  const [reviewPending, setReviewPending] = useState(false);
  const [reasonOpen, setReasonOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [reviewError, setReviewError] = useState<string | null>(null);

  const submitReview = async (status: 'accepted' | 'rejected') => {
    if (!onReviewDocument) return;
    setReviewPending(true);
    setReviewError(null);
    try {
      const failure = await onReviewDocument(file._id, {
        status,
        reason: status === 'rejected' ? reason.trim() : undefined,
      });
      if (failure) {
        setReviewError(failure);
        return;
      }
      setReasonOpen(false);
      setReason('');
    } finally {
      setReviewPending(false);
    }
  };

  const office = mode === 'office';
  const reasonMissing = reason.trim().length === 0;

  return (
    <li className="rounded-[1rem] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-2.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-full items-center gap-1.5 text-xs font-medium text-[var(--primary-active)] hover:underline"
          >
            <FileText className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{file.fileName ?? 'Uploaded file'}</span>
          </a>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[var(--muted)]">
            {file.uploadedAt && <span>{formatDateShort(file.uploadedAt)}</span>}
            {file.extras?.accountNumber && <span>• A/c {file.extras.accountNumber}</span>}
            {file.extras?.ifsc && <span>• {file.extras.ifsc}</span>}
            {file.extras?.branchName && <span>• {file.extras.branchName}</span>}
            {file.extras?.accountType && <span>• {humaniseEnum(file.extras.accountType)}</span>}
          </p>
        </div>

        {/* `min-w-0` rather than `shrink-0`: the row has to be allowed to give way
            when View / Download / Replace / Remove do not fit on one line. With
            `shrink-0` the group kept its full content width, so on a narrow card it
            hung out past the card's right edge instead of wrapping. */}
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {review?.status === 'accepted' && <span className="badge-pill badge-success">Accepted</span>}
          {review?.status === 'rejected' && <span className="badge-pill badge-error">Sent back</span>}
          {(!review?.status || review.status === 'pending') && (
            <span className="badge-pill bg-[var(--surface-strong)] text-[var(--muted)]">With office</span>
          )}

          {/* The whole point of reviewing a document is seeing it — both roles get View,
              and both roles can save a copy to their own machine. */}
          <DocumentPreview file={file} className="!py-1.5" />
          <DocumentDownload file={file} className="!py-1.5" />

          {office ? (
            onReviewDocument && (
              <span className="flex items-center gap-1.5">
                <button
                  type="button"
                  className={ROW_BUTTON}
                  onClick={() => void submitReview('accepted')}
                  disabled={reviewPending || review?.status === 'accepted'}
                >
                  {reviewPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  Accept
                </button>
                <button
                  type="button"
                  className={ROW_BUTTON}
                  onClick={() => {
                    setReasonOpen((open) => !open);
                    setReviewError(null);
                  }}
                  disabled={reviewPending}
                >
                  Send back
                </button>
              </span>
            )
          ) : confirming ? (
            <span className="flex items-center gap-1.5">
              <button
                type="button"
                className="text-[11px] font-semibold text-[var(--error)] hover:underline disabled:opacity-50"
                onClick={onConfirmDelete}
                disabled={disabled || pending}
              >
                {pending ? 'Removing…' : 'Remove'}
              </button>
              <button
                type="button"
                className="text-[11px] text-[var(--muted)] hover:underline"
                onClick={onCancelDelete}
                disabled={pending}
              >
                Cancel
              </button>
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <button
                type="button"
                className={ROW_BUTTON}
                onClick={onAskReplace}
                disabled={disabled || pending}
              >
                <RefreshCw className="h-3.5 w-3.5" /> Replace
              </button>
              <button
                type="button"
                className="ghost-button !p-2 text-[var(--muted)] hover:text-[var(--error)]"
                aria-label={`Remove ${file.fileName ?? 'file'}`}
                onClick={onAskDelete}
                disabled={disabled || pending}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
        </div>
      </div>

      {/* The server's stored clarity verdict — this is what the office reads. */}
      <div className="mt-2 rounded-[0.85rem] border border-[var(--border-soft)] bg-white/70 px-2.5 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`badge-pill ${qualityVerdictClass(file.qualityCheck?.verdict)}`}>
            {qualityVerdictLabel(file.qualityCheck?.verdict)}
          </span>
          {file.qualityCheck?.score != null && (
            <span className="text-[11px] text-[var(--muted)]">Score {file.qualityCheck.score}/100</span>
          )}
          {file.qualityCheck?.checkedAt && (
            <span className="text-[11px] text-[var(--muted-soft)]">
              checked {formatDateShort(file.qualityCheck.checkedAt)}
            </span>
          )}
        </div>

        {reasons.length > 0 && (
          <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-[11px] leading-4 text-[var(--muted)]">
            {reasons.map((reason) => (
              <li key={reason} className="[overflow-wrap:anywhere]">
                {reason}
              </li>
            ))}
          </ul>
        )}

        {metrics.length > 0 && (
          <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] leading-4 text-[var(--muted-soft)] [overflow-wrap:anywhere]">
            {metrics.map(([key, value]) => (
              <span key={key}>
                {key}: {value}
              </span>
            ))}
          </p>
        )}
      </div>

      {review?.status === 'rejected' && review.reason && (
        <p className="mt-1.5 text-[11px] leading-4 text-[var(--error)] [overflow-wrap:anywhere]">
          Office: {review.reason}
        </p>
      )}

      {/* Office: the reason a document is being sent back, shown before it is sent. */}
      {office && reasonOpen && onReviewDocument && (
        <div className="mt-2 rounded-[0.85rem] border border-[var(--border-soft)] bg-white/70 p-2.5">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-soft)]">
              Reason (required)
            </span>
            <textarea
              className="form-input min-h-[64px] w-full"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Why this file cannot be accepted, in the agent's words."
              disabled={reviewPending}
            />
          </label>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={ROW_BUTTON}
              onClick={() => void submitReview('rejected')}
              disabled={reviewPending || reasonMissing}
              title={reasonMissing ? 'Add a reason first' : undefined}
            >
              {reviewPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Send back
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-[11px] text-[var(--muted)] hover:underline disabled:opacity-50"
              onClick={() => {
                setReasonOpen(false);
                setReason('');
                setReviewError(null);
              }}
              disabled={reviewPending}
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
          </div>
          {reviewError && (
            <p role="alert" className="mt-2 text-[11px] leading-4 text-[var(--error)] [overflow-wrap:anywhere]">
              {reviewError}
            </p>
          )}
        </div>
      )}
    </li>
  );
}

interface DocumentCardProps {
  meta: ApplicationChecklistDocument;
  files: ApplicationDocumentFile[];
  mode: ApplicationViewMode;
  disabled: boolean;
  onUpload: ApplicationDocumentsSectionProps['onUpload'];
  onReplace: ApplicationDocumentsSectionProps['onReplace'];
  onDelete: ApplicationDocumentsSectionProps['onDelete'];
  onReviewDocument?: ReviewDocumentHandler;
}

function DocumentCard({
  meta,
  files,
  mode,
  disabled,
  onUpload,
  onReplace,
  onDelete,
  onReviewDocument,
}: DocumentCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const modeRef = useRef<{ replaceId: string | null }>({ replaceId: null });

  const [pending, setPending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  /**
   * Seeded from the file on record, so the bank details already captured are
   * visible instead of four empty boxes — and so a replacement keeps them
   * instead of overwriting the stored values with nothing. The parent re-keys
   * this card on the document it was seeded from, which re-seeds it.
   */
  const [extras, setExtras] = useState<DocumentExtrasForm>(() => extrasFromDocument(latestDocument(files)));

  const extrasKeys = meta.extras ?? [];
  const office = mode === 'office';

  const pick = (replaceId: string | null) => {
    modeRef.current = { replaceId };
    setActionError(null);
    inputRef.current?.click();
  };

  const handleFileChosen = async (file: File | null) => {
    if (!file) return;
    const { replaceId } = modeRef.current;
    setPending(true);
    setActionError(null);
    try {
      const failure = replaceId
        ? await onReplace(meta.kind, replaceId, file, extras)
        : await onUpload(meta.kind, file, extras);
      if (failure) {
        setActionError(failure);
        return;
      }
      // The boxes keep their values; the parent re-keys this card on the file
      // just stored, so they re-seed from it rather than blanking.
      if (inputRef.current) inputRef.current.value = '';
    } finally {
      modeRef.current = { replaceId: null };
      setPending(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    setDeletingId(documentId);
    setActionError(null);
    try {
      const failure = await onDelete(documentId);
      if (failure) {
        setActionError(failure);
        return;
      }
      setConfirmId(null);
    } finally {
      setDeletingId(null);
    }
  };

  const hasRejected = files.some((entry) => entry.review?.status === 'rejected');

  return (
    <article className="panel min-w-0 p-3.5 sm:p-4">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold leading-5 text-[var(--foreground)]">{meta.label}</h3>
          {meta.labelBn && <p className="mt-0.5 text-[11px] leading-4 text-[var(--primary-active)]">{meta.labelBn}</p>}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          {meta.required ? (
            <span className="badge-pill bg-[var(--error-tint)] text-[var(--error)]">Required</span>
          ) : (
            <span className="badge-pill bg-[var(--surface-muted)] text-[var(--muted)]">Optional</span>
          )}
          {files.length === 0 ? (
            meta.required ? (
              <span className="badge-pill badge-warning">Missing</span>
            ) : (
              <span className="badge-pill bg-[var(--surface-muted)] text-[var(--muted)]">Not attached</span>
            )
          ) : (
            <span className={`badge-pill ${hasRejected ? 'badge-error' : 'badge-success'}`}>
              {hasRejected ? 'Sent back' : `${files.length} file${files.length === 1 ? '' : 's'}`}
            </span>
          )}
        </div>
      </header>

      <p className="mt-2 text-[11px] leading-4 text-[var(--muted)] [overflow-wrap:anywhere]">
        {meta.hint}
        {meta.hintBn ? <span className="ml-1">• {meta.hintBn}</span> : null}
      </p>

      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((file) => (
            <FileRow
              key={file._id}
              file={file}
              mode={mode}
              disabled={disabled}
              pending={deletingId === file._id}
              confirming={confirmId === file._id}
              onAskReplace={() => pick(file._id)}
              onAskDelete={() => setConfirmId(file._id)}
              onCancelDelete={() => setConfirmId(null)}
              onConfirmDelete={() => void handleDelete(file._id)}
              onReviewDocument={onReviewDocument}
            />
          ))}
        </ul>
      )}

      {/* The bank extras are consumer data: only the field agent's editable form
          can touch them, so office mode shows nothing here (the row above already
          prints the recorded values). */}
      {!office && extrasKeys.length > 0 && (
        <div className="mt-3 rounded-[1rem] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-3">
          <p className="mb-2 text-[11px] leading-4 text-[var(--muted)]">
            {files.length > 0
              ? 'Bank details on record. These carry over to the next upload of this document.'
              : 'Bank details for this document. They are stored with the file when you upload it.'}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {extrasKeys.includes('accountNumber') && (
              <TextField
                id={`detail-${meta.kind}-accountNumber`}
                label="Account number"
                value={extras.accountNumber}
                onValueChange={(value) => setExtras((prev) => ({ ...prev, accountNumber: value }))}
                numeric
                disabled={disabled}
                compact
              />
            )}
            {extrasKeys.includes('ifsc') && (
              <TextField
                id={`detail-${meta.kind}-ifsc`}
                label="IFSC"
                value={extras.ifsc}
                onValueChange={(value) => setExtras((prev) => ({ ...prev, ifsc: value.toUpperCase() }))}
                placeholder="e.g. SBIN0001234"
                disabled={disabled}
                compact
              />
            )}
            {extrasKeys.includes('branchName') && (
              <TextField
                id={`detail-${meta.kind}-branch`}
                label="Branch name"
                value={extras.branchName}
                onValueChange={(value) => setExtras((prev) => ({ ...prev, branchName: value }))}
                disabled={disabled}
                compact
              />
            )}
            {extrasKeys.includes('accountType') && (
              <SelectField
                id={`detail-${meta.kind}-accountType`}
                label="Account type"
                value={extras.accountType}
                onValueChange={(value) =>
                  setExtras((prev) => ({ ...prev, accountType: value as ApplicationAccountType | '' }))
                }
                options={ACCOUNT_TYPE_OPTIONS}
                placeholder="Not recorded"
                disabled={disabled}
              />
            )}
          </div>
        </div>
      )}

      {/* Uploading is the field agent's move; the office only reads and rules. */}
      {!office && (
        <div className="mt-3 space-y-2">
          <input
            ref={inputRef}
            id={`detail-${meta.kind}-file`}
            type="file"
            accept="image/*,application/pdf"
            capture="environment"
            disabled={disabled || pending}
            onChange={(event) => void handleFileChosen(event.target.files?.[0] ?? null)}
            className="block w-full cursor-pointer rounded-[var(--radius-sm)] border border-dashed border-[var(--border)] bg-white/60 px-3 py-2.5 text-xs text-[var(--muted)] file:mr-3 file:rounded-[var(--radius-full)] file:border-0 file:bg-[var(--primary-tint)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[var(--primary-active)]"
          />

          <button
            type="button"
            className="brand-button px-4 py-2 text-xs"
            onClick={() => pick(null)}
            disabled={disabled || pending}
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {files.length === 0 ? 'Upload' : 'Upload another'}
          </button>

          {actionError && (
            <p role="alert" className="text-[11px] leading-4 text-[var(--error)] [overflow-wrap:anywhere]">
              {actionError}
            </p>
          )}
        </div>
      )}
    </article>
  );
}

export function ApplicationDocumentsSection({
  checklist,
  application,
  summary,
  mode,
  documentEditable,
  onUpload,
  onReplace,
  onDelete,
  onReviewDocument,
}: ApplicationDocumentsSectionProps) {
  if (!checklist) {
    return (
      <section className="panel p-4 sm:p-5">
        <h2 className="text-base font-semibold text-[var(--foreground)]">Documents</h2>
        <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
          The document checklist could not be loaded, so the file list is unavailable. Reload the page to try again.
        </p>
      </section>
    );
  }

  /**
   * The agent's own cards. Documents the office files (`filedBy === 'office'` —
   * the signed quotation and the signed agreement) are the office's paperwork, so
   * they are left out of the upload/replace/delete grid entirely; the field agent
   * views and downloads them from the Quotation & agreement section instead.
   */
  const documents = (checklist.documents ?? []).filter((doc) => doc.filedBy !== 'office');
  const files = application.documents ?? [];
  const missing = summary.missing ?? [];
  const requiredCount = documents.filter((doc) => doc.required).length;
  const uploadedCount = documents.filter((doc) => files.some((file) => file.kind === doc.kind)).length;
  const office = mode === 'office';

  return (
    <section className="space-y-3">
      <section className="panel flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-[var(--foreground)]">Documents</h2>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
            {office
              ? 'Every file on the application, with the server’s clarity verdict. Accept each one, or send it back with a reason.'
              : 'Every file on the application, with the server’s clarity verdict and the office’s review.'}
          </p>
        </div>
        <span className="badge-pill shrink-0 bg-[var(--primary-tint)] text-[var(--primary-active)]">
          {uploadedCount} of {documents.length} • {requiredCount} required
        </span>
      </section>

      {missing.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-[1rem] border border-[var(--warning)] bg-[var(--warning-tint)] px-3 py-2.5 text-xs leading-5 text-[var(--warning)]">
          <span className="font-semibold">Still missing:</span>
          {missing.map((kind) => {
            const label = documents.find((doc) => doc.kind === kind)?.label ?? humaniseEnum(kind);
            return (
              <span key={kind} className="badge-pill bg-white/70 text-[var(--warning)]">
                {label}
              </span>
            );
          })}
        </div>
      )}

      {!office && !documentEditable && (
        <p className="rounded-[1rem] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-2.5 text-[11px] leading-5 text-[var(--muted)]">
          Documents can no longer be changed at this stage — the server will refuse an upload with its own explanation.
        </p>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        {documents.map((meta) => {
          const kindFiles = files.filter((file) => file.kind === meta.kind);

          return (
            <DocumentCard
              key={`${meta.kind}:${extrasSeedKey(kindFiles)}`}
              meta={meta}
              files={kindFiles}
              mode={mode}
              disabled={false}
              onUpload={onUpload}
              onReplace={onReplace}
              onDelete={onDelete}
              onReviewDocument={onReviewDocument}
            />
          );
        })}
      </div>
    </section>
  );
}

export default ApplicationDocumentsSection;

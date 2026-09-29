'use client';

import { useRef, useState } from 'react';
import { Camera, CheckCircle2, FileText, Loader2, Trash2, Upload } from 'lucide-react';
import { SelectField, TextField } from './WizardFields';
import { humaniseEnum } from '../applicationDisplay';
import type {
  ApplicationAccountType,
  ApplicationChecklist,
  ApplicationChecklistDocument,
  ApplicationDocument,
  ApplicationDocumentFile,
  ApplicationDocumentKind,
} from '@/types/application';

import { extrasFromDocument, extrasSeedKey, latestDocument } from '../documentExtras';
import type { DocumentExtrasForm } from '../documentExtras';

export type { DocumentExtrasForm };

/** Values the backend accepts for `accountType` (application.validation.js). */
const ACCOUNT_TYPE_OPTIONS = [
  { value: 'savings', label: 'Savings' },
  { value: 'current', label: 'Current' },
  { value: 'cash_credit', label: 'Cash credit' },
  { value: 'other', label: 'Other' },
];

interface StepDocumentsProps {
  checklist: ApplicationChecklist | null;
  checklistLoading: boolean;
  checklistError: string | null;
  application: ApplicationDocument | null;
  disabled?: boolean;
  /** Resolve with null on success, or the server's own message on failure. */
  onUpload: (kind: ApplicationDocumentKind, file: File, extras: DocumentExtrasForm) => Promise<string | null>;
  onDelete: (documentId: string) => Promise<string | null>;
}

/**
 * One card per checklist document — the whole list comes from the server, so a
 * kind the API adds shows up here with no client change.
 *
 * Uploads are never gated on picture quality. The server measures every image
 * and stores the verdict and metrics on the document for the office to read; a
 * reviewer who cannot use a scan rejects it with a reason.
 */
function DocumentCard({
  document: documentMeta,
  files,
  disabled,
  onUpload,
  onDelete,
}: {
  document: ApplicationChecklistDocument;
  files: ApplicationDocumentFile[];
  disabled?: boolean;
  onUpload: StepDocumentsProps['onUpload'];
  onDelete: StepDocumentsProps['onDelete'];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  /**
   * There is deliberately no clarity gate here any more.
   *
   * It used to block the upload button until the browser's own blur / brightness
   * / glare maths passed. On real documents it misfired constantly — white paper
   * reads as "glare" over most of the frame, and a phone's default photo came in
   * under the resolution floor — so agents were told their perfectly usable
   * Aadhaar scan was unclear and could not file it.
   *
   * The office is the right gate: every upload still carries the server's
   * quality metrics, and a reviewer can reject a document with a reason.
   */
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  /**
   * Seeded from the file on record, so the boxes show the bank details already
   * captured rather than four empty fields. The card is keyed on the document
   * it was seeded from (see the parent), which re-seeds it after a replacement.
   */
  const [extras, setExtras] = useState<DocumentExtrasForm>(() => extrasFromDocument(latestDocument(files)));

  const extrasKeys = documentMeta.extras ?? [];
  const needsBankFields = extrasKeys.length > 0;

  const rejected = files.find((entry) => entry.review?.status === 'rejected');
  const state: 'missing' | 'uploaded' | 'rejected' = rejected
    ? 'rejected'
    : files.length > 0
      ? 'uploaded'
      : 'missing';

  const handlePick = (picked: File | null) => {
    setActionError(null);
    setFile(picked);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setActionError(null);
    try {
      const failure = await onUpload(documentMeta.kind, file, extras);
      if (failure) {
        setActionError(failure);
        return;
      }
      setFile(null);
      // The boxes keep their values: the parent re-keys this card on the
      // document it was seeded from, so they re-seed from the file just stored.
      if (inputRef.current) inputRef.current.value = '';
    } finally {
      setUploading(false);
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

  return (
    <article className="panel min-w-0 p-3.5 sm:p-4">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold leading-5 text-[var(--foreground)]">{documentMeta.label}</h3>
          {documentMeta.labelBn && (
            <p className="mt-0.5 text-[11px] leading-4 text-[var(--primary-active)]">{documentMeta.labelBn}</p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          {documentMeta.required ? (
            <span className="badge-pill bg-[var(--error-tint)] text-[var(--error)]">Required</span>
          ) : (
            <span className="badge-pill bg-[var(--surface-muted)] text-[var(--muted)]">Optional</span>
          )}

          {state === 'uploaded' && (
            <span className="badge-pill badge-success">
              <CheckCircle2 className="mr-1 h-3 w-3" /> Uploaded
            </span>
          )}
          {state === 'rejected' && <span className="badge-pill badge-error">Sent back</span>}
          {state === 'missing' && documentMeta.required && (
            <span className="badge-pill badge-warning">Missing</span>
          )}
        </div>
      </header>

      <p className="mt-2 text-[11px] leading-4 text-[var(--muted)] [overflow-wrap:anywhere]">
        {documentMeta.hint}
        {documentMeta.hintBn ? <span className="ml-1">• {documentMeta.hintBn}</span> : null}
      </p>

      {/* Files already on the application */}
      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((entry) => {
            const entryLabel =
              entry.qualityCheck?.verdict === 'fail'
                ? 'Not clear'
                : entry.qualityCheck?.verdict === 'pass'
                  ? 'Clear'
                  : entry.mimeType === 'application/pdf'
                    ? 'PDF'
                    : 'Checked';

            return (
              <li
                key={entry._id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[1rem] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-[var(--foreground)]">
                    {entry.fileName ?? 'Uploaded file'}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[var(--muted)]">
                    <span
                      className={
                        entry.qualityCheck?.verdict === 'fail'
                          ? 'font-semibold text-[var(--error)]'
                          : 'text-[var(--muted)]'
                      }
                    >
                      {entryLabel}
                    </span>
                    {entry.extras?.accountNumber && <span>• A/c {entry.extras.accountNumber}</span>}
                    {entry.extras?.ifsc && <span>• {entry.extras.ifsc}</span>}
                    {entry.extras?.branchName && <span>• {entry.extras.branchName}</span>}
                    {entry.extras?.accountType && <span>• {humaniseEnum(entry.extras.accountType)}</span>}
                  </p>
                  {entry.review?.status === 'rejected' && entry.review.reason && (
                    <p className="mt-1 text-[11px] leading-4 text-[var(--error)] [overflow-wrap:anywhere]">
                      Office: {entry.review.reason}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {entry.review?.status === 'accepted' && <span className="badge-pill badge-success">Accepted</span>}
                  {entry.review?.status === 'pending' && files.length > 0 && (
                    <span className="badge-pill bg-[var(--surface-strong)] text-[var(--muted)]">With office</span>
                  )}

                  {confirmId === entry._id ? (
                    <span className="flex items-center gap-1.5">
                      <button
                        type="button"
                        className="text-[11px] font-semibold text-[var(--error)] hover:underline"
                        onClick={() => void handleDelete(entry._id)}
                        disabled={deletingId === entry._id}
                      >
                        {deletingId === entry._id ? 'Removing…' : 'Remove'}
                      </button>
                      <button
                        type="button"
                        className="text-[11px] text-[var(--muted)] hover:underline"
                        onClick={() => setConfirmId(null)}
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="ghost-button !p-2 text-[var(--muted)] hover:text-[var(--error)]"
                      aria-label={`Remove ${entry.fileName ?? 'file'}`}
                      onClick={() => setConfirmId(entry._id)}
                      disabled={disabled}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Bank details ride with the passbook / cheque upload */}
      {needsBankFields && (
        <div className="mt-3 grid gap-3 rounded-[1rem] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-3 sm:grid-cols-2">
          {extrasKeys.includes('accountNumber') && (
            <TextField
              id={`${documentMeta.kind}-accountNumber`}
              label="Account number"
              value={extras.accountNumber}
              onValueChange={(value) => setExtras((prev) => ({ ...prev, accountNumber: value }))}
              numeric
              error={undefined}
              disabled={disabled}
              compact
            />
          )}
          {extrasKeys.includes('ifsc') && (
            <TextField
              id={`${documentMeta.kind}-ifsc`}
              label="IFSC"
              value={extras.ifsc}
              onValueChange={(value) => setExtras((prev) => ({ ...prev, ifsc: value.toUpperCase() }))}
              placeholder="e.g. SBIN0001234"
              error={undefined}
              disabled={disabled}
              compact
            />
          )}
          {extrasKeys.includes('branchName') && (
            <TextField
              id={`${documentMeta.kind}-branch`}
              label="Branch name"
              value={extras.branchName}
              onValueChange={(value) => setExtras((prev) => ({ ...prev, branchName: value }))}
              error={undefined}
              disabled={disabled}
              compact
            />
          )}
          {extrasKeys.includes('accountType') && (
            <SelectField
              id={`${documentMeta.kind}-accountType`}
              label="Account type"
              value={extras.accountType}
              onValueChange={(value) =>
                setExtras((prev) => ({ ...prev, accountType: value as ApplicationAccountType | '' }))
              }
              options={ACCOUNT_TYPE_OPTIONS}
              placeholder="Not recorded"
              error={undefined}
              disabled={disabled}
            />
          )}
        </div>
      )}

      {/* Picker + pre-upload verdict */}
      <div className="mt-3 space-y-2">
        <input
          ref={inputRef}
          id={`${documentMeta.kind}-file`}
          type="file"
          accept="image/*,application/pdf"
          capture="environment"
          disabled={disabled || uploading}
          onChange={(event) => handlePick(event.target.files?.[0] ?? null)}
          className="block w-full cursor-pointer rounded-[var(--radius-sm)] border border-dashed border-[var(--border)] bg-white/60 px-3 py-2.5 text-xs text-[var(--muted)] file:mr-3 file:rounded-[var(--radius-full)] file:border-0 file:bg-[var(--primary-tint)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[var(--primary-active)]"
        />

        {file && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="brand-button px-4 py-2 text-xs"
              onClick={() => void handleUpload()}
              disabled={uploading || disabled}
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {uploading ? 'Uploading…' : 'Upload'}
            </button>

            <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
              <Camera className="h-3.5 w-3.5" /> {file.name}
            </span>
          </div>
        )}

        {actionError && (
          <p role="alert" className="text-[11px] leading-4 text-[var(--error)] [overflow-wrap:anywhere]">
            {actionError}
          </p>
        )}

        {state === 'rejected' && rejected?.review?.reason && (
          <p className="text-[11px] leading-4 text-[var(--error)] [overflow-wrap:anywhere]">
            The office sent this back: {rejected.review.reason}. Upload a fresh copy, then delete the old one.
          </p>
        )}
      </div>
    </article>
  );
}

export function StepDocuments({
  checklist,
  checklistLoading,
  checklistError,
  application,
  disabled,
  onUpload,
  onDelete,
}: StepDocumentsProps) {
  if (checklistLoading) {
    return (
      <div className="grid gap-3 lg:grid-cols-2">
        {[1, 2, 3, 4].map((card) => (
          <div key={card} className="skeleton h-48 w-full rounded-[1.25rem]" />
        ))}
      </div>
    );
  }

  if (checklistError) {
    return (
      <div className="panel p-4">
        <p className="text-sm font-semibold text-[var(--error)]">Could not load the document checklist</p>
        <p className="mt-1 text-xs leading-5 text-[var(--muted)] [overflow-wrap:anywhere]">{checklistError}</p>
        <p className="mt-2 text-xs text-[var(--muted)]">Reload the page and try again — nothing has been lost.</p>
      </div>
    );
  }

  const documents = checklist?.documents ?? [];

  if (documents.length === 0) {
    return (
      <div className="panel p-4">
        <p className="text-sm font-semibold text-[var(--foreground)]">No documents configured</p>
        <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
          The server returned an empty checklist. Reload the page; if it stays empty, the field checklist has not been
          set up yet.
        </p>
      </div>
    );
  }

  const files = application?.documents ?? [];
  const uploaded = documents.filter((doc) => files.some((entry) => entry.kind === doc.kind)).length;
  const required = documents.filter((doc) => doc.required).length;

  return (
    <div className="space-y-4">
      <section className="panel flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-[var(--foreground)]">Document checklist</h2>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
            Photograph each one flat, in daylight and filling the frame. The picture is checked on the phone before it
            is uploaded.
          </p>
        </div>
        <span className="badge-pill shrink-0 bg-[var(--primary-tint)] text-[var(--primary-active)]">
          {uploaded} of {documents.length} • {required} required
        </span>
      </section>

      <div className="grid gap-3 lg:grid-cols-2">
        {documents.map((documentMeta) => {
          const kindFiles = files.filter((entry) => entry.kind === documentMeta.kind);

          return (
            <DocumentCard
              key={`${documentMeta.kind}:${extrasSeedKey(kindFiles)}`}
              document={documentMeta}
              files={kindFiles}
              disabled={disabled}
              onUpload={onUpload}
              onDelete={onDelete}
            />
          );
        })}
      </div>

      <p className="flex items-start gap-2 rounded-[1rem] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-2.5 text-[11px] leading-5 text-[var(--muted)]">
        <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--secondary)]" />
        <span className="min-w-0">
          Shoot straight, in good light, with the whole document filling the frame. Files must be JPEG, PNG or PDF and
          under 5 MB. If the office cannot read one it comes back with the reason, so upload the best copy you have.
        </span>
      </p>
    </div>
  );
}

export default StepDocuments;

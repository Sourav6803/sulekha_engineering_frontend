'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileSignature, FileText, Info, Loader2, ShieldCheck, Undo2, Upload, XCircle } from 'lucide-react';
import { ApplicationStatusBadge } from './ApplicationStatusBadge';
import { DocumentDownload, DocumentPreview } from './DocumentPreview';
import { documentDisplayName } from './documentExtras';
import { formatDateTime } from '@/lib/format';
import type { ApplicationStatusMeta } from './applicationDisplay';
import type { ApplicationViewMode, ReviewDocumentHandler } from './ApplicationDocumentsSection';
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
  /** Both roles may file a signed copy; only the office can approve one. */
  mode: ApplicationViewMode;
  /**
   * POST /applications/:id/signed-document — multipart `file`, the chosen `kind`,
   * and the filer's own account of the paper (`signedOn`, `note`).
   *
   * The field agent files it too: they are the one in the consumer's house and
   * the office can be 100 km away. Their upload is stored `pending` and only an
   * admin can accept it, so the button is offered but the approval is not.
   */
  onUpload?: (
    file: File,
    kind: ApplicationDocumentKind,
    meta: { signedOn?: string; note?: string }
  ) => Promise<string | null>;
  /**
   * PATCH /applications/:id/documents/:documentId/review — the office's verdict
   * on an agent's scan. Access to the document is checked server-side; this only
   * decides whether the buttons are offered.
   */
  onReviewDocument?: ReviewDocumentHandler;
}

const SIGNED_KIND_LABEL: Record<string, string> = {
  issuedQuotation: 'Quotation (issued)',
  issuedAgreement: 'Agreement (issued)',
  signedQuotation: 'Signed quotation',
  signedAgreement: 'Signed agreement',
};

/** The four kinds, in workflow order — the fallback while the checklist is loading. */
const PAPERWORK_GROUPS: Array<{ kind: ApplicationDocumentKind; label: string }> = [
  { kind: 'issuedQuotation', label: SIGNED_KIND_LABEL.issuedQuotation },
  { kind: 'issuedAgreement', label: SIGNED_KIND_LABEL.issuedAgreement },
  { kind: 'signedQuotation', label: SIGNED_KIND_LABEL.signedQuotation },
  { kind: 'signedAgreement', label: SIGNED_KIND_LABEL.signedAgreement },
];

/** The two the office *generates*; they are never uploaded by hand. */
const ISSUED_KINDS: ApplicationDocumentKind[] = ['issuedQuotation', 'issuedAgreement'];

/** The two that come back as scans, and the only ones the upload box offers. */
const SIGNED_KINDS: ApplicationDocumentKind[] = ['signedQuotation', 'signedAgreement'];

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
  onReviewDocument,
}: QuotationAgreementSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedKind, setSelectedKind] = useState<ApplicationDocumentKind | ''>('');
  const [signedOn, setSignedOn] = useState('');
  const [note, setNote] = useState('');
  /** Which copy is having a rejection reason typed for it. */
  const [reasonFor, setReasonFor] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [reviewPending, setReviewPending] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const office = mode === 'office';

  // The office-filed kinds come straight off the checklist. The fallback keeps a
  // kind already on the file visible if the checklist has not arrived yet.
  const officeDocs = (checklist?.documents ?? []).filter((doc) => doc.filedBy === 'office');

  /*
   * Before the checklist arrives the two kinds are still known — and the upload
   * must not disappear just because the form definition is slow, which is exactly
   * when an agent is standing in a house with a signed sheet in hand.
   */
  const groups: Array<{ kind: ApplicationDocumentKind; label: string }> =
    officeDocs.length > 0
      ? officeDocs.map((doc) => ({ kind: doc.kind, label: doc.label }))
      : [
          ...PAPERWORK_GROUPS,
          ...Array.from(new Set(files.map((file) => file.kind)))
            .filter((kind) => !PAPERWORK_GROUPS.some((group) => group.kind === kind))
            .map((kind) => ({ kind, label: SIGNED_KIND_LABEL[kind] ?? 'Signed copy' })),
        ];

  /**
   * Once the office has accepted a copy, the agent may not file over it — the
   * server refuses that, so offering the button would only produce a 403. The
   * office keeps the path open: replacing an accepted copy deliberately is its
   * own call, and the superseded scan stays on the file with its verdict.
   */
  const isAccepted = (kind: ApplicationDocumentKind) =>
    files.some((file) => file.kind === kind && file.review?.status === 'accepted');

  /*
   * Only the signed kinds are uploaded — the issued ones are generated by the
   * office and would otherwise sit in the "File as" list as a way to upload the
   * same document twice.
   */
  const uploadable = groups.filter(
    (group) => SIGNED_KINDS.includes(group.kind) && (office || !isAccepted(group.kind))
  );

  // A kind that was chosen a moment ago may have just been approved — fall back
  // to one that is still open rather than posting into a 403.
  const activeKind: ApplicationDocumentKind | null =
    (selectedKind && uploadable.some((group) => group.kind === selectedKind) ? selectedKind : null) ??
    uploadable[0]?.kind ??
    null;

  const handleFileChosen = async (file: File | null) => {
    if (!file || !onUpload || !activeKind) return;
    setPending(true);
    setError(null);
    try {
      const failure = await onUpload(file, activeKind, {
        signedOn: signedOn || undefined,
        note: note.trim() || undefined,
      });
      if (failure) {
        setError(failure);
        return;
      }
      if (inputRef.current) inputRef.current.value = '';
      setSignedOn('');
      setNote('');
    } finally {
      setPending(false);
    }
  };

  /**
   * The office's verdict on one copy. A rejection needs its reason: it travels to
   * the agent in the notification and the email, and "sent back" with no reason
   * means a third visit to the consumer's house.
   */
  const submitReview = async (documentId: string, status: 'accepted' | 'rejected') => {
    if (!onReviewDocument) return;

    if (status === 'rejected' && !reason.trim()) {
      setReviewError('Write what the agent has to fix — this is sent to them with the rejection.');
      return;
    }

    setReviewPending(true);
    setReviewError(null);
    try {
      const failure = await onReviewDocument(documentId, {
        status,
        reason: status === 'rejected' ? reason.trim() : undefined,
      });
      if (failure) {
        setReviewError(failure);
        return;
      }
      setReasonFor(null);
      setReason('');
    } finally {
      setReviewPending(false);
    }
  };

  return (
    <section className="panel p-4 sm:p-5">
      <h2 className="text-base font-semibold text-[var(--foreground)]">Quotation &amp; agreement</h2>
      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
        {office
          ? 'File the scanned, consumer-signed quotation or agreement, or approve the one an agent has filed. It is kept as its own document, so the generated PDF is never overwritten.'
          : 'Get the consumer to sign the printed quotation or agreement, then upload the scan here. The office approves it before it counts as done.'}
      </p>

      {!office && (
        <p className="mt-3 flex items-start gap-2 rounded-[1rem] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-2.5 text-[11px] leading-5 text-[var(--muted)]">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="min-w-0 [overflow-wrap:anywhere]">
            You can upload the scan yourself — no need to bring the paper to the office. Once approved it is locked;
            only the office can replace an approved copy.
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
                        {(file.signedOn || file.note) && (
                          <p className="mt-0.5 text-[11px] leading-4 text-[var(--muted)] [overflow-wrap:anywhere]">
                            {file.signedOn ? `Signed ${formatDateTime(file.signedOn)}` : ''}
                            {file.signedOn && file.note ? ' • ' : ''}
                            {file.note || ''}
                          </p>
                        )}
                        {file.review?.status === 'rejected' && file.review.reason && (
                          <p className="mt-1 text-[11px] leading-4 text-[var(--error)] [overflow-wrap:anywhere]">
                            Office: {file.review.reason}
                          </p>
                        )}
                      </div>
                      {/* Same reason as the checklist rows: the action group must be
                          able to shrink and wrap, or it overflows the card edge. */}
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        {/* The verdict only means something for a scan that came
                            back signed. The issued PDFs are ours to begin with. */}
                        {SIGNED_KINDS.includes(file.kind) && file.review?.status === 'accepted' && (
                          <span className="badge-pill badge-success">Approved</span>
                        )}
                        {SIGNED_KINDS.includes(file.kind) && file.review?.status === 'rejected' && (
                          <span className="badge-pill badge-error">Sent back</span>
                        )}
                        {SIGNED_KINDS.includes(file.kind) &&
                          (!file.review?.status || file.review.status === 'pending') && (
                            <span className="badge-pill bg-[var(--surface-strong)] text-[var(--muted)]">
                              {office ? 'Waiting for you' : 'With office'}
                            </span>
                          )}
                        <DocumentPreview file={file} />
                        <DocumentDownload file={file} />
                        {/* The verdict on a scan an agent filed. The checklist grid
                            leaves these kinds out, so without this the pending queue
                            would have no screen at all. */}
                        {office &&
                          onReviewDocument &&
                          SIGNED_KINDS.includes(file.kind) &&
                          file.review?.status !== 'accepted' && (
                          <>
                            <button
                              type="button"
                              className="text-[11px] font-semibold text-[var(--primary-active)] underline-offset-2 hover:underline disabled:opacity-50"
                              onClick={() => void submitReview(file._id, 'accepted')}
                              disabled={reviewPending}
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              className="text-[11px] font-semibold text-[var(--error)] underline-offset-2 hover:underline disabled:opacity-50"
                              onClick={() => setReasonFor(reasonFor === file._id ? null : file._id)}
                              disabled={reviewPending}
                            >
                              {reasonFor === file._id ? 'Cancel' : 'Send back'}
                            </button>
                          </>
                        )}
                      </div>

                      {office && reasonFor === file._id && (
                        <div className="mt-2 w-full">
                          <label className="block">
                            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-soft)]">
                              Why it cannot be accepted
                            </span>
                            <textarea
                              className="form-input min-h-[64px] w-full"
                              value={reason}
                              onChange={(event) => setReason(event.target.value)}
                              placeholder="What the agent has to fix before re-uploading."
                              disabled={reviewPending}
                            />
                          </label>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              className="brand-button inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px]"
                              onClick={() => void submitReview(file._id, 'rejected')}
                              disabled={reviewPending}
                            >
                              {reviewPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                              Send back to the agent
                            </button>
                            {reviewError && (
                              <p
                                role="alert"
                                className="text-[11px] leading-4 text-[var(--error)] [overflow-wrap:anywhere]"
                              >
                                {reviewError}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
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

      {/* Both roles may file the scan; only the kinds still open to them are offered. */}
      {onUpload && uploadable.length > 0 && (
        <div className="mt-3 space-y-2">
          {uploadable.length > 1 && (
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
                {uploadable.map((group) => (
                  <option key={group.kind} value={group.kind}>
                    {group.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          {/* The filer's own account of the paper. Optional, but the date the
              consumer actually signed is the one thing the scan cannot prove. */}
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-soft)]">
                Signed on
              </span>
              <input
                type="date"
                className="form-input w-full"
                value={signedOn}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(event) => setSignedOn(event.target.value)}
                disabled={pending}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-soft)]">
                Note for the office
              </span>
              <input
                type="text"
                className="form-input w-full"
                value={note}
                maxLength={300}
                placeholder="Should the office check something?"
                onChange={(event) => setNote(event.target.value)}
                disabled={pending}
              />
            </label>
          </div>

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
            {office ? 'Upload signed copy' : 'Upload the signed scan'}
          </button>
          {!office && (
            <p className="text-[11px] leading-4 text-[var(--muted)]">
              Your upload goes to the office for approval — it is not final until they accept it.
            </p>
          )}
          {error && (
            <p role="alert" className="text-[11px] leading-4 text-[var(--error)] [overflow-wrap:anywhere]">
              {error}
            </p>
          )}
        </div>
      )}

      {/* Nothing left to file: both copies are approved and locked to the agent. */}
      {!office && onUpload && uploadable.length === 0 && (
        <p className="mt-3 rounded-[1rem] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-2.5 text-[11px] leading-5 text-[var(--muted)]">
          Both signed copies are approved and locked. Ask the office if a replacement is needed.
        </p>
      )}
    </section>
  );
}

interface IssueDocumentsPanelProps {
  application: ApplicationDocument;
  /** POST /applications/:id/issue-quotation — builds, renders and files the PDF. */
  onIssueQuotation: (amount?: number) => Promise<string | null>;
  /** POST /applications/:id/issue-agreement — from the linked quotation. */
  onIssueAgreement: (amount?: number) => Promise<string | null>;
}

const linkedNo = (value: { quotationNo?: string; agreementNo?: string } | string | null | undefined) =>
  value && typeof value === 'object' ? value.quotationNo || value.agreementNo || '' : '';

/**
 * The office's paper control.
 *
 * The quotation is *not* generated from a template here any more. It opens the
 * real quotation editor, prefilled from this application, because the sheet has
 * to be editable — a panel line worded for non-DCR modules, a quantity left as
 * "5/6" until the survey settles it, a wattage that changed after the site visit.
 * Issuing from defaults could not do any of that, and the printed price could
 * disagree with the quotation the office meant to send.
 *
 * The agreement keeps the direct path: it takes its amount from the linked
 * quotation (or the deal) and has nothing to lay out line by line.
 */
export function IssueDocumentsPanel({
  application,
  onIssueQuotation,
  onIssueAgreement,
}: IssueDocumentsPanelProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<'quotation' | 'agreement' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const quotationIssued = Boolean(application.quotation);
  const agreementIssued = Boolean(application.agreement);
  const quotationNo = linkedNo(application.quotation);

  /** The editor writes the sheet; saving links it back and files the PDF. */
  const openQuotationEditor = () => {
    const id = application._id;
    if (!id) return;
    const linked = application.quotation;
    if (linked && typeof linked === 'object') {
      router.push(`/quotations/${linked._id}/edit?applicationId=${id}`);
      return;
    }
    router.push(`/quotations/new?applicationId=${id}`);
  };

  /** The agreement form owns the date, address, amount and notes. */
  const openAgreementEditor = () => {
    const id = application._id;
    if (!id) return;
    const linked = application.agreement;
    if (linked && typeof linked === 'object') {
      router.push(`/agreements?edit=${linked._id}&applicationId=${id}`);
      return;
    }
    router.push(`/agreements?new=1&applicationId=${id}`);
  };

  /** Only for the case where the PDF failed to render the last time round. */
  const refile = async (which: 'quotation' | 'agreement') => {
    setBusy(which);
    setError(null);
    try {
      const failure = which === 'quotation' ? await onIssueQuotation() : await onIssueAgreement();
      if (failure) setError(failure);
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="panel p-4 sm:p-5">
      <h2 className="text-base font-semibold text-[var(--foreground)]">Paper for this application</h2>
      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
        Both documents open in their own editors with this consumer&apos;s details already filled in — every BOQ line,
        quantity, wattage and term on the quotation, and the amount, date, address and notes on the agreement. Saving
        links it to the application, files the PDF here and notifies the agent.
      </p>

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <button
          type="button"
          className="brand-button inline-flex items-center gap-1.5 px-4 py-2 text-xs"
          onClick={openQuotationEditor}
          disabled={busy !== null}
        >
          <FileText className="h-3.5 w-3.5" />
          {quotationIssued ? 'Edit quotation' : 'Build quotation'}
        </button>

        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-full)] border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--foreground)] disabled:opacity-50"
          onClick={openAgreementEditor}
          disabled={busy !== null}
        >
          <FileSignature className="h-3.5 w-3.5" />
          {agreementIssued ? 'Edit agreement' : 'Write agreement'}
        </button>

        {quotationIssued && (
          <button
            type="button"
            className="text-[11px] font-semibold text-[var(--primary-active)] underline-offset-2 hover:underline disabled:opacity-50"
            onClick={() => void refile('quotation')}
            disabled={busy !== null}
          >
            {busy === 'quotation' ? 'Re-filing…' : 'Re-file quotation PDF'}
          </button>
        )}

        {agreementIssued && (
          <button
            type="button"
            className="text-[11px] font-semibold text-[var(--primary-active)] underline-offset-2 hover:underline disabled:opacity-50"
            onClick={() => void refile('agreement')}
            disabled={busy !== null}
          >
            {busy === 'agreement' ? 'Re-filing…' : 'Re-file agreement PDF'}
          </button>
        )}
      </div>

      <p className="mt-2 text-[11px] leading-4 text-[var(--muted)]">
        {quotationIssued ? `Quotation ${quotationNo || 'issued'}` : 'Quotation not issued yet'} ·{' '}
        {agreementIssued ? 'Agreement issued' : 'Agreement not issued yet'}
      </p>

      {error && (
        <p role="alert" className="mt-2 text-[11px] leading-4 text-[var(--error)] [overflow-wrap:anywhere]">
          {error}
        </p>
      )}
    </section>
  );
}

/**
 * Every quotation/agreement document on the file: the two the office issues and
 * the two that come back signed. Both pairs belong in the same place on screen —
 * the agent prints the issued one and files the signed one straight below it.
 */
export const paperworkDocuments = (application: ApplicationDocument): ApplicationDocumentFile[] =>
  (application.documents ?? []).filter(
    (file) => ISSUED_KINDS.includes(file.kind) || SIGNED_KINDS.includes(file.kind)
  );

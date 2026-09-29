'use client';

import Link from 'next/link';
import { AlertTriangle, Info, Pencil } from 'lucide-react';
import { ApplicationStatusBadge } from './ApplicationStatusBadge';
import { ApplicationStatusTimeline } from './ApplicationStatusTimeline';
import {
  ApplicationDocumentsSection,
  type ApplicationViewMode,
  type ReviewDocumentHandler,
} from './ApplicationDocumentsSection';
import { OfficeDecisionPanel, QuotationAgreementSection, signedCopyDocuments } from './ApplicationOfficeSections';
import {
  ConsumerSection,
  DealSection,
  DetailSection,
  ElectricBillSection,
  LoanSection,
  NameMatchSection,
  SiteSection,
} from './ApplicationDetailSections';
import { applicationAgentName, isAgentEditableStatus, type ApplicationStatusMeta } from './applicationDisplay';
import { formatDateTime, formatINR } from '@/lib/format';
import type { DocumentExtrasForm } from './documentExtras';
import type {
  ApplicationChecklist,
  ApplicationDocument,
  ApplicationDocumentKind,
  ApplicationDocumentsSummary,
  ApplicationElectricBillVerifyPayload,
  ApplicationReviewPayload,
  ApplicationStatusUpdatePayload,
} from '@/types/application';

interface ApplicationDetailViewProps {
  application: ApplicationDocument;
  documents: ApplicationDocumentsSummary;
  checklist: ApplicationChecklist | null;
  statusMeta: ApplicationStatusMeta;
  siteTypeLabels: Record<string, string>;
  /** `field` — the agent's editable view. `office` — the read-only review view. */
  mode: ApplicationViewMode;
  documentEditable: boolean;

  // ---- field agent ----
  onUpload: (kind: ApplicationDocumentKind, file: File, extras: DocumentExtrasForm) => Promise<string | null>;
  onReplace: (
    kind: ApplicationDocumentKind,
    documentId: string,
    file: File,
    extras: DocumentExtrasForm
  ) => Promise<string | null>;
  onDelete: (documentId: string) => Promise<string | null>;

  // ---- office ----
  onReviewDocument: ReviewDocumentHandler;
  onVerifyBill: (payload: ApplicationElectricBillVerifyPayload) => Promise<string | null>;
  onReview: (payload: ApplicationReviewPayload) => Promise<string | null>;
  onUpdateStatus: (payload: ApplicationStatusUpdatePayload) => Promise<string | null>;
  /** Office only — the kind says which signed document is being filed. */
  onUploadSignedDocument: (file: File, kind: ApplicationDocumentKind) => Promise<string | null>;
}

/**
 * The application detail screen, role-aware.
 *
 * `field` is the agent's editable view (edit while draft / correction, upload /
 * replace / delete documents, re-run the name check). `office` is admin/manager:
 * the same record read-only, plus the office's own tools — document verdicts, the
 * electricity-bill verification, the workflow decision and the signed copy. The
 * two modes never render each other's write controls, and every error the server
 * sends is shown with its own wording.
 *
 * Every label, tone and site type still comes from /applications/checklist.
 */
export function ApplicationDetailView({
  application,
  documents,
  checklist,
  statusMeta,
  siteTypeLabels,
  mode,
  documentEditable,
  onUpload,
  onReplace,
  onDelete,
  onReviewDocument,
  onVerifyBill,
  onReview,
  onUpdateStatus,
  onUploadSignedDocument,
}: ApplicationDetailViewProps) {
  const statusLabel = statusMeta[application.status]?.label;
  const canEditDetails = isAgentEditableStatus(application.status);
  const office = mode === 'office';
  const proposal =
    application.deal?.proposalAmount != null ? formatINR(application.deal.proposalAmount) : '—';
  const agentName = application.agent
    ? applicationAgentName(application.agent)
    : application.agentNameSnapshot ?? '—';

  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="panel relative overflow-hidden p-5 sm:p-6">
        <span aria-hidden="true" className="accent-bar absolute inset-y-0 left-0 w-1" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--primary-active)]">
              {office ? 'Consumer application • office review' : 'Consumer application'}
            </p>
            <h1 className="break-words text-2xl font-semibold leading-tight text-[var(--foreground)]">
              {application.consumerName}
            </h1>
            <p className="break-all font-mono text-sm text-[var(--muted)]">{application.applicationNo}</p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <ApplicationStatusBadge status={application.status} label={statusLabel} tone={statusMeta[application.status]?.tone} />
              <span className="text-xs text-[var(--muted)]">Proposal {proposal}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:items-end">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-3 lg:text-right">
              <div className="min-w-0">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-soft)]">
                  Assigned agent
                </dt>
                <dd className="mt-0.5 truncate text-[var(--foreground)]">{agentName}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-soft)]">
                  Created
                </dt>
                <dd className="mt-0.5 text-[var(--muted)]">{formatDateTime(application.createdAt)}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-soft)]">
                  Updated
                </dt>
                <dd className="mt-0.5 text-[var(--muted)]">{formatDateTime(application.updatedAt)}</dd>
              </div>
            </dl>

            {office ? (
              <p className="max-w-xs text-[11px] leading-5 text-[var(--muted)] lg:text-right">
                Read-only record. Judge the documents, verify the bill and move the file along below.
              </p>
            ) : canEditDetails ? (
              <Link
                href={`/applications/new?id=${application._id}`}
                className="brand-button inline-flex items-center gap-1.5 px-4 py-2 text-sm"
              >
                <Pencil className="h-4 w-4" /> Edit details
              </Link>
            ) : (
              <p className="max-w-xs text-[11px] leading-5 text-[var(--muted)] lg:text-right">
                Details are locked while the application is{' '}
                <span className="font-medium text-[var(--foreground)]">{statusLabel ?? application.status}</span>. The
                documents below can still be replaced.
              </p>
            )}
          </div>
        </div>
      </header>

      {office && (
        <p className="flex items-start gap-2 rounded-[1rem] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-2.5 text-[11px] leading-5 text-[var(--muted)]">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="min-w-0 [overflow-wrap:anywhere]">
            This is the office (read-only) view. The consumer&apos;s own data can only be changed by the field agent who
            collected it — here you read the record, rule on the documents and move the application along.
          </span>
        </p>
      )}

      {application.review?.rejectionReason && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-[1rem] border border-[var(--error)] bg-[var(--error-tint)] px-3 py-2.5 text-xs leading-5 text-[var(--error)]"
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 [overflow-wrap:anywhere]">
            <span className="font-semibold">Sent back by the office: </span>
            {application.review.rejectionReason}
          </span>
        </div>
      )}

      {office && (
        <OfficeDecisionPanel
          application={application}
          statuses={checklist?.statuses}
          statusMeta={statusMeta}
          onUpdateStatus={onUpdateStatus}
          onReview={onReview}
        />
      )}

      <ConsumerSection application={application} />
      <SiteSection application={application} siteTypeLabels={siteTypeLabels} />
      <DealSection application={application} />
      <LoanSection application={application} />
      <ElectricBillSection
        application={application}
        mode={mode}
        onVerifyBill={office ? onVerifyBill : undefined}
      />
      <NameMatchSection application={application} />

      <ApplicationDocumentsSection
        checklist={checklist}
        application={application}
        summary={documents}
        mode={mode}
        documentEditable={documentEditable}
        onUpload={onUpload}
        onReplace={onReplace}
        onDelete={onDelete}
        onReviewDocument={office ? onReviewDocument : undefined}
      />

      {/* Both roles see the signed quotation / agreement. The office files them;
          the field agent only views and downloads them (no upload path at all). */}
      <QuotationAgreementSection
        checklist={checklist}
        files={signedCopyDocuments(application)}
        mode={mode}
        onUpload={office ? onUploadSignedDocument : undefined}
      />

      <DetailSection title="Status history" description="Every move this file has made through the pipeline.">
        <div className="min-w-0 sm:col-span-2 lg:col-span-3">
          <ApplicationStatusTimeline entries={application.statusHistory} statusMeta={statusMeta} />
        </div>
      </DetailSection>
    </div>
  );
}

export default ApplicationDetailView;

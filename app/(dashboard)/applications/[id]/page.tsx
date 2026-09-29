'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/shared/PageContainer';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { EmptyState } from '@/components/shared/EmptyState';
import { ApplicationDetailView } from '@/components/features/applications/ApplicationDetailView';
import type { ApplicationViewMode } from '@/components/features/applications/ApplicationDocumentsSection';
import {
  isDocumentEditableStatus,
  siteTypeLabelsFromChecklist,
  statusMetaFromChecklist,
} from '@/components/features/applications/applicationDisplay';
import { useApplications } from '@/hooks/useApplications';
import { useAuth } from '@/hooks/useAuth';
import { canEditApplication, canReviewApplication, canViewApplications } from '@/lib/permissions';
import { readApiErrorDetails } from '@/lib/errors/apiErrorDetails';
import type { DocumentExtrasForm } from '@/components/features/applications/documentExtras';
import type {
  ApplicationChecklist,
  ApplicationDetail,
  ApplicationDocumentKind,
  ApplicationDocumentReviewPayload,
  ApplicationElectricBillVerifyPayload,
  ApplicationReviewPayload,
  ApplicationStatusUpdatePayload,
} from '@/types/application';

/**
 * /applications/[id] — the read-optimised detail of one consumer application.
 *
 * Uses GET /applications/:id for the record plus its document ledger and
 * GET /applications/checklist for every label, tone and the document list, so
 * nothing here can drift from what the API enforces.
 *
 * The page is role-aware. A field agent gets the editable view — edit while draft
 * / correction, upload / replace / delete documents, re-run the name match. The
 * office (admin / manager) gets the same record read-only plus its own tools:
 * document verdicts, the electricity-bill verification, the workflow decision and
 * the signed copy. In office mode this page issues no consumer-data write call at
 * all — the write endpoints return a 403 for admin/manager, and every refusal the
 * server does send is shown with its own wording.
 */
export default function ApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';

  const { user } = useAuth();
  const role = user?.role;
  const allowed = canViewApplications(role);
  /** Admin / manager judge the file; the agent who collected it edits it. */
  const mode: ApplicationViewMode = canReviewApplication(role) ? 'office' : 'field';

  const {
    getApplication,
    fetchChecklist,
    uploadDocument,
    deleteDocument,
    reviewDocument,
    verifyElectricBill,
    reviewApplication,
    updateStatus,
    uploadSignedDocument,
  } = useApplications();

  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [checklist, setChecklist] = useState<ApplicationChecklist | null>(null);
  const [loading, setLoading] = useState(true);
  /**
   * The id whose data has actually been fetched. The skeleton is shown while
   * this differs from the id in the URL, so opening a second application
   * re-shows it without needing a state write at the top of the effect.
   */
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const applyDetail = useCallback((next: ApplicationDetail) => {
    setDetail(next);
    setError(null);
    setNotFound(false);
  }, []);

  const applyFailure = useCallback((err: unknown) => {
    const details = readApiErrorDetails(err);
    setNotFound(details.code === 'NOT_FOUND');
    setError(details.message);
    setDetail(null);
  }, []);

  /** Re-read the record after any mutation. */
  const reload = useCallback(async () => {
    if (!id) return;
    try {
      const result = await getApplication(id);
      applyDetail(result.data);
    } catch (err) {
      applyFailure(err);
    }
  }, [id, getApplication, applyDetail, applyFailure]);

  /**
   * Initial load, and a reload when the id changes.
   *
   * The request is started straight from the effect and every state write sits
   * in a promise callback, so the effect body itself writes no state — calling a
   * local async loader here trips react-hooks/set-state-in-effect.
   */
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    void getApplication(id)
      .then((result) => {
        if (!cancelled) applyDetail(result.data);
      })
      .catch((err: unknown) => {
        if (!cancelled) applyFailure(err);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        setLoadedId(id);
      });

    return () => {
      cancelled = true;
    };
  }, [id, getApplication, applyDetail, applyFailure]);

  const showSkeleton = loading || loadedId !== id;

  /**
   * True once the skeleton has been up for a while.
   *
   * On a first visit in dev, Next compiles this route on demand and the page
   * cannot hydrate until that chunk arrives — so the skeleton sits there for
   * 20-80 seconds with no API request in flight at all, which reads as a hang.
   * Production ships prebuilt chunks, so this window is a dev-time cost; the
   * hint exists so the wait is never silent and a retry is one click away.
   */
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!showSkeleton) return;
    const timer = window.setTimeout(() => setSlow(true), 7000);
    return () => window.clearTimeout(timer);
  }, [showSkeleton]);

  // The checklist drives every label, tone and site type on the page.
  useEffect(() => {
    if (!allowed) return;
    void fetchChecklist().then(setChecklist);
  }, [allowed, fetchChecklist]);

  const uploadFields = useCallback(
    (kind: ApplicationDocumentKind, extras: DocumentExtrasForm) => ({
      kind,
      accountNumber: extras.accountNumber.trim() || undefined,
      ifsc: extras.ifsc.trim() || undefined,
      branchName: extras.branchName.trim() || undefined,
      accountType: extras.accountType || undefined,
    }),
    []
  );

  // ------------------------------------------------------------- field agent

  const handleUpload = useCallback(
    async (kind: ApplicationDocumentKind, file: File, extras: DocumentExtrasForm): Promise<string | null> => {
      try {
        await uploadDocument(id, file, uploadFields(kind, extras));
        await reload();
        toast.success('Document uploaded');
        return null;
      } catch (err) {
        const details = readApiErrorDetails(err);
        toast.error('Upload refused', { description: details.message });
        return details.message;
      }
    },
    [id, uploadDocument, uploadFields, reload]
  );

  const handleReplace = useCallback(
    async (
      kind: ApplicationDocumentKind,
      documentId: string,
      file: File,
      extras: DocumentExtrasForm
    ): Promise<string | null> => {
      // Upload the fresh copy first so a refused upload never leaves the
      // application without a file.
      try {
        await uploadDocument(id, file, uploadFields(kind, extras));
      } catch (err) {
        const details = readApiErrorDetails(err);
        toast.error('Upload refused', { description: details.message });
        return details.message;
      }

      try {
        await deleteDocument(id, documentId);
      } catch (err) {
        const details = readApiErrorDetails(err);
        await reload();
        toast.error('Replacement uploaded, but the old copy could not be removed', {
          description: details.message,
        });
        return details.message;
      }

      await reload();
      toast.success('Document replaced');
      return null;
    },
    [id, uploadDocument, deleteDocument, uploadFields, reload]
  );

  const handleDelete = useCallback(
    async (documentId: string): Promise<string | null> => {
      try {
        await deleteDocument(id, documentId);
        await reload();
        toast.success('Document removed');
        return null;
      } catch (err) {
        const details = readApiErrorDetails(err);
        toast.error('Could not remove the document', { description: details.message });
        return details.message;
      }
    },
    [id, deleteDocument, reload]
  );

  // ------------------------------------------------------------------ office

  const handleReviewDocument = useCallback(
    async (documentId: string, payload: ApplicationDocumentReviewPayload): Promise<string | null> => {
      try {
        await reviewDocument(id, documentId, payload);
        await reload();
        toast.success(payload.status === 'accepted' ? 'Document accepted' : 'Document sent back');
        return null;
      } catch (err) {
        const details = readApiErrorDetails(err);
        toast.error('Could not rule on the document', { description: details.message });
        return details.message;
      }
    },
    [id, reviewDocument, reload]
  );

  const handleVerifyBill = useCallback(
    async (payload: ApplicationElectricBillVerifyPayload): Promise<string | null> => {
      try {
        await verifyElectricBill(id, payload);
        await reload();
        toast.success(payload.verified === false ? 'Verification withdrawn' : 'Electricity bill verified');
        return null;
      } catch (err) {
        const details = readApiErrorDetails(err);
        toast.error('Could not update the bill verification', { description: details.message });
        return details.message;
      }
    },
    [id, verifyElectricBill, reload]
  );

  const handleReview = useCallback(
    async (payload: ApplicationReviewPayload): Promise<string | null> => {
      try {
        await reviewApplication(id, payload);
        await reload();
        toast.success(payload.status === 'rejected' ? 'Application rejected' : 'Application sent back for correction');
        return null;
      } catch (err) {
        const details = readApiErrorDetails(err);
        toast.error('Could not update the application', { description: details.message });
        return details.message;
      }
    },
    [id, reviewApplication, reload]
  );

  const handleUpdateStatus = useCallback(
    async (payload: ApplicationStatusUpdatePayload): Promise<string | null> => {
      try {
        await updateStatus(id, payload);
        await reload();
        toast.success('Status updated');
        return null;
      } catch (err) {
        const details = readApiErrorDetails(err);
        toast.error('Could not change the status', { description: details.message });
        return details.message;
      }
    },
    [id, updateStatus, reload]
  );

  const handleUploadSignedDocument = useCallback(
    async (file: File, kind: ApplicationDocumentKind): Promise<string | null> => {
      try {
        await uploadSignedDocument(id, file, kind);
        await reload();
        toast.success('Signed copy attached');
        return null;
      } catch (err) {
        const details = readApiErrorDetails(err);
        toast.error('Could not attach the signed copy', { description: details.message });
        return details.message;
      }
    },
    [id, uploadSignedDocument, reload]
  );

  const breadcrumbTail = detail?.application.applicationNo ?? 'Application';
  const breadcrumbs = (
    <Breadcrumbs
      items={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Applications', href: '/applications' },
        { label: breadcrumbTail },
      ]}
    />
  );

  if (role && !allowed) {
    return (
      <PageContainer className="canvas-warm">
        {breadcrumbs}
        <EmptyState
          icon={ShieldAlert}
          title="Not authorised"
          description="Consumer applications are only available to field agents, managers and admins. Ask an administrator if you need access."
        />
      </PageContainer>
    );
  }

  if (showSkeleton) {
    return (
      <PageContainer className="canvas-warm">
        {breadcrumbs}
        <div className="space-y-4">
          <div className="skeleton h-40 w-full rounded-[1.25rem]" />
          <div className="skeleton h-52 w-full rounded-[1.25rem]" />
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="skeleton h-64 w-full rounded-[1.25rem]" />
            <div className="skeleton h-64 w-full rounded-[1.25rem]" />
          </div>

          {slow && (
            <div
              role="status"
              className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-[var(--border-soft)] bg-white/95 px-4 py-3"
            >
              <p className="text-xs leading-5 text-[var(--muted)]">
                Still loading. The first visit to a page compiles it in the development server, which can take a
                while — this is not normal on the live site.
              </p>
              <button
                type="button"
                className="neutral-button px-4 py-2 text-xs"
                onClick={() => {
                  setSlow(false);
                  setLoading(true);
                  void reload();
                }}
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </PageContainer>
    );
  }

  if (notFound || error || !detail) {
    return (
      <PageContainer className="canvas-warm">
        {breadcrumbs}
        <div className="panel">
          <EmptyState
            icon={AlertTriangle}
            title={notFound ? 'Application not found' : 'Could not load the application'}
            description={
              notFound
                ? 'This application could not be found — it may have been deleted, or it may belong to another agent.'
                : error ?? 'Something went wrong loading this application.'
            }
            action={
              <Link href="/applications" className="neutral-button px-4 py-2.5 text-sm">
                <ArrowLeft className="h-4 w-4" /> Back to applications
              </Link>
            }
          />
        </div>
      </PageContainer>
    );
  }

  const application = detail.application;
  const statusMeta = statusMetaFromChecklist(checklist?.statuses);
  const siteTypeLabels = siteTypeLabelsFromChecklist(checklist?.siteTypes);
  const fieldMode = canEditApplication(role);

  return (
    <PageContainer className="canvas-warm">
      {breadcrumbs}
      <ApplicationDetailView
        application={application}
        documents={detail.documents}
        checklist={checklist}
        statusMeta={statusMeta}
        siteTypeLabels={siteTypeLabels}
        mode={mode}
        documentEditable={fieldMode && isDocumentEditableStatus(application.status)}
        onUpload={handleUpload}
        onReplace={handleReplace}
        onDelete={handleDelete}
        onReviewDocument={handleReviewDocument}
        onVerifyBill={handleVerifyBill}
        onReview={handleReview}
        onUpdateStatus={handleUpdateStatus}
        onUploadSignedDocument={handleUploadSignedDocument}
      />
    </PageContainer>
  );
}

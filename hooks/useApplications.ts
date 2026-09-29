import { useCallback, useState } from 'react';
import { applicationsApi } from '@/lib/api/applications.api';
import { handleApiError } from '@/lib/errors/handleApiError';
import type { PaginationInfo } from '@/types/api';
import type {
  ApplicationChecklist,
  ApplicationCreatePayload,
  ApplicationDetail,
  ApplicationDocument,
  ApplicationDocumentKind,
  ApplicationDocumentReviewPayload,
  ApplicationDocumentUploadFields,
  ApplicationElectricBillPayload,
  ApplicationElectricBillVerifyPayload,
  ApplicationListQuery,
  ApplicationNameMatchInput,
  ApplicationReviewPayload,
  ApplicationStats,
  ApplicationStatsQuery,
  ApplicationStatusUpdatePayload,
  ApplicationSubmitPayload,
  ApplicationUpdatePayload,
} from '@/types/application';

/**
 * Mirrors the existing domain hooks (see useQuotations/useCustomers).
 *
 * An agent only ever receives their own applications — the server scopes the
 * query from the access token, so nothing here needs a role check.
 */
export function useApplications() {
  const [applications, setApplications] = useState<ApplicationDocument[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = useCallback(async (query?: ApplicationListQuery) => {
    setLoading(true);
    setError(null);
    try {
      const result = await applicationsApi.list(query);
      const items = Array.isArray(result.data) ? result.data : [];
      setApplications(items);
      setPagination(
        result.pagination ?? {
          page: query?.page ?? 1,
          limit: query?.limit ?? 20,
          total: items.length,
          pages: items.length > 0 ? 1 : 0,
        }
      );
      return result;
    } catch (err) {
      const message = handleApiError(err);
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(
    async (query: ApplicationStatsQuery = {}): Promise<ApplicationStats | null> => {
      try {
        const result = await applicationsApi.stats(query);
        return result.data;
      } catch (err) {
        setError(handleApiError(err));
        return null;
      }
    },
    []
  );

  const fetchChecklist = useCallback(async (): Promise<ApplicationChecklist | null> => {
    try {
      const result = await applicationsApi.checklist();
      return result.data;
    } catch (err) {
      setError(handleApiError(err));
      return null;
    }
  }, []);

  /** The full application + document summary + submit issues, for the wizard. */
  const fetchApplicationDetail = useCallback(async (id: string): Promise<ApplicationDetail | null> => {
    try {
      const result = await applicationsApi.get(id);
      return result.data;
    } catch (err) {
      setError(handleApiError(err));
      return null;
    }
  }, []);

  /**
   * Mutation passthroughs. Like useAgents, they do NOT refetch — the caller owns
   * the draft state and decides when to re-read it.
   */
  const createApplication = useCallback(
    (payload: ApplicationCreatePayload) => applicationsApi.create(payload),
    []
  );

  const updateApplication = useCallback(
    (id: string, payload: ApplicationUpdatePayload) => applicationsApi.update(id, payload),
    []
  );

  /** Soft-delete a draft / correction application (server-gated). */
  const deleteApplication = useCallback(
    (id: string) => applicationsApi.deleteApplication(id),
    []
  );

  const uploadDocument = useCallback(
    (id: string, file: File, fields: ApplicationDocumentUploadFields) =>
      applicationsApi.uploadDocument(id, file, fields),
    []
  );

  const deleteDocument = useCallback(
    (id: string, documentId: string) => applicationsApi.deleteDocument(id, documentId),
    []
  );

  const setElectricBill = useCallback(
    (id: string, payload: ApplicationElectricBillPayload) => applicationsApi.setElectricBill(id, payload),
    []
  );

  const fetchBillPortal = useCallback((id: string) => applicationsApi.getBillPortal(id), []);

  const runNameMatch = useCallback(
    (id: string, payload: ApplicationNameMatchInput = {}) => applicationsApi.runNameMatch(id, payload),
    []
  );

  const submitApplication = useCallback(
    (id: string, payload: ApplicationSubmitPayload) => applicationsApi.submit(id, payload),
    []
  );

  /** The office's half — document verdicts, bill verification, workflow, signed copy. */
  const reviewDocument = useCallback(
    (id: string, documentId: string, payload: ApplicationDocumentReviewPayload) =>
      applicationsApi.reviewDocument(id, documentId, payload),
    []
  );

  const verifyElectricBill = useCallback(
    (id: string, payload: ApplicationElectricBillVerifyPayload = {}) =>
      applicationsApi.verifyElectricBill(id, payload),
    []
  );

  const reviewApplication = useCallback(
    (id: string, payload: ApplicationReviewPayload) => applicationsApi.review(id, payload),
    []
  );

  const updateStatus = useCallback(
    (id: string, payload: ApplicationStatusUpdatePayload) => applicationsApi.updateStatus(id, payload),
    []
  );

  const uploadSignedDocument = useCallback(
    (id: string, file: File, kind?: ApplicationDocumentKind) =>
      applicationsApi.uploadSignedDocument(id, file, kind),
    []
  );

  return {
    applications,
    pagination,
    loading,
    error,
    setError,
    fetchApplications,
    fetchStats,
    fetchChecklist,
    // Thin passthroughs for the detail view / wizard
    getApplication: applicationsApi.get,
    fetchApplicationDetail,
    createApplication,
    updateApplication,
    deleteApplication,
    uploadDocument,
    deleteDocument,
    setElectricBill,
    fetchBillPortal,
    runNameMatch,
    submitApplication,
    // Office half
    reviewDocument,
    verifyElectricBill,
    reviewApplication,
    updateStatus,
    uploadSignedDocument,
  };
}

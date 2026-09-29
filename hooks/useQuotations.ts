import { useCallback, useEffect, useState } from 'react';
import { quotationsApi } from '@/lib/api/quotations.api';
import { handleApiError } from '@/lib/errors/handleApiError';
import type { PaginationInfo } from '@/types/api';
import type {
  QuotationDefaults,
  QuotationDocument,
  QuotationListQuery,
  QuotationNextNumber,
  QuotationNumberCheck,
  QuotationPayload,
  QuotationRegisterQuery,
  QuotationRegisterRow,
  QuotationStats,
} from '@/types/quotation';

/**
 * Mirrors the existing domain hooks (see useMaterials/useCustomers):
 * list state + pagination + thin mutation passthroughs that do NOT refetch -
 * the page owns the query and refetches itself.
 */
export function useQuotations() {
  const [quotations, setQuotations] = useState<QuotationDocument[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotations = useCallback(async (query?: QuotationListQuery) => {
    setLoading(true);
    setError(null);
    try {
      const result = await quotationsApi.list(query);
      // Envelope: the array is `data`, pagination is a sibling.
      const items = Array.isArray(result.data) ? result.data : [];
      setQuotations(items);
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

  const fetchRegister = useCallback(async (query?: QuotationRegisterQuery) => {
    const result = await quotationsApi.register(query);
    return {
      rows: (Array.isArray(result.data) ? result.data : []) as QuotationRegisterRow[],
      pagination: result.pagination ?? { page: 1, limit: 50, total: 0, pages: 0 },
    };
  }, []);

  const fetchNextNumber = useCallback(
    async (params: { schemeCode?: string; issueDate?: string } = {}): Promise<QuotationNextNumber | null> => {
      try {
        const result = await quotationsApi.nextNumber(params);
        return result.data;
      } catch (err) {
        setError(handleApiError(err));
        return null;
      }
    },
    []
  );

  /**
   * Is this typed number free? Returns null when the check itself could not run,
   * which the form treats as "unknown" rather than "bad" — a network blip must
   * not make a perfectly good number look taken.
   */
  const checkNumber = useCallback(
    async (params: { quotationNo: string; issueDate?: string }): Promise<QuotationNumberCheck | null> => {
      try {
        const result = await quotationsApi.checkNumber(params);
        return result.data;
      } catch {
        return null;
      }
    },
    []
  );

  const fetchStats = useCallback(async (params: { financialYear?: string } = {}): Promise<QuotationStats | null> => {
    try {
      const result = await quotationsApi.stats(params);
      return result.data;
    } catch (err) {
      setError(handleApiError(err));
      return null;
    }
  }, []);

  const createQuotation = useCallback((payload: QuotationPayload) => quotationsApi.create(payload), []);

  const updateQuotation = useCallback(
    (id: string, payload: QuotationPayload) => quotationsApi.update(id, payload),
    []
  );

  const deleteQuotation = useCallback((id: string, reason?: string) => quotationsApi.remove(id, reason), []);

  const changeStatus = useCallback(
    (id: string, status: Parameters<typeof quotationsApi.changeStatus>[1]) =>
      quotationsApi.changeStatus(id, status),
    []
  );

  const restoreQuotation = useCallback(
    (id: string, assignNewNumber = false) => quotationsApi.restore(id, assignNewNumber),
    []
  );

  return {
    quotations,
    pagination,
    loading,
    error,
    setError,
    fetchQuotations,
    fetchRegister,
    fetchNextNumber,
    checkNumber,
    fetchStats,
    createQuotation,
    updateQuotation,
    deleteQuotation,
    changeStatus,
    restoreQuotation,
    // Thin passthroughs for detail-page usage
    getQuotation: quotationsApi.get,
    downloadPdf: quotationsApi.downloadPdf,
    printHtml: quotationsApi.printHtml,
    uploadAttachment: quotationsApi.uploadAttachment,
    removeAttachment: quotationsApi.removeAttachment,
  };
}

/**
 * The fixed company values (terms, payment terms, panel sizing, line limit).
 * Separate from useQuotations because it is not list state, and cached for the
 * life of the page - it only changes when someone edits the company settings.
 */
export function useQuotationDefaults() {
  const [defaults, setDefaults] = useState<QuotationDefaults | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void quotationsApi
      .defaults()
      .then((response) => {
        if (!cancelled) setDefaults(response.data);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { defaults, loading };
}

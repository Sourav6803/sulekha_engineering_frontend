import { useCallback, useEffect, useState } from 'react';
import { agreementsApi } from '@/lib/api/agreements.api';
import { handleApiError } from '@/lib/errors/handleApiError';
import type { PaginationInfo } from '@/types/api';
import type {
  AgreementDefaults,
  AgreementDocument,
  AgreementListQuery,
  AgreementPayload,
} from '@/types/agreement';

/**
 * Mirrors the other domain hooks: list state lives here, mutations are passed
 * straight through so callers can toast and refetch.
 */
export function useAgreements() {
  const [agreements, setAgreements] = useState<AgreementDocument[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAgreements = useCallback(async (query: AgreementListQuery = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await agreementsApi.list(query);
      // data is the array; pagination is a sibling (never data.items)
      const items = Array.isArray(result.data) ? result.data : [];

      setAgreements(items);
      setPagination(
        result.pagination ?? {
          page: query.page ?? 1,
          limit: query.limit ?? 20,
          total: items.length,
          pages: 1,
        }
      );

      return items;
    } catch (err) {
      setError(handleApiError(err));
      setAgreements([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    agreements,
    pagination,
    loading,
    error,
    fetchAgreements,
    createAgreement: agreementsApi.create,
    updateAgreement: agreementsApi.update,
    deleteAgreement: agreementsApi.remove,
    downloadPdf: agreementsApi.downloadPdf,
    printHtml: agreementsApi.printHtml,
  };
}

/** Fixed wording (discom, registered office, payment stages) for the form. */
export function useAgreementDefaults() {
  const [defaults, setDefaults] = useState<AgreementDefaults | null>(null);

  useEffect(() => {
    let cancelled = false;

    void agreementsApi
      .defaults()
      .then((response) => {
        if (!cancelled) setDefaults(response.data);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  return { defaults };
}

export default useAgreements;

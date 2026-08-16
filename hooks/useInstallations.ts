import { useCallback, useState } from 'react';
import { installationsApi, type InstallationListQuery } from '@/lib/api/installations.api';
import { handleApiError } from '@/lib/errors/handleApiError';
import type { InstallationDocument } from '@/types/installation';
import type { PaginationInfo } from '@/types/api';

/**
 * Client state for the Installations list page.
 *
 * Reads the real backend list shape: the item array lives on `response.data`
 * and pagination metadata is a sibling (NOT nested under `.data.items`).
 */
export function useInstallations() {
  const [installations, setInstallations] = useState<InstallationDocument[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInstallations = useCallback(async (query?: InstallationListQuery) => {
    setLoading(true);
    setError(null);

    try {
      const result = await installationsApi.list(query);
      const items = Array.isArray(result.data) ? result.data : [];
      setInstallations(items);
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

  // Mutation helpers. They return the raw API result; the calling page owns the
  // query and refetches after a successful mutation.
  const createInstallation = useCallback((payload: Parameters<typeof installationsApi.create>[0]) => {
    return installationsApi.create(payload);
  }, []);

  const updateInstallation = useCallback((id: string, payload: Parameters<typeof installationsApi.update>[1]) => {
    return installationsApi.update(id, payload);
  }, []);

  const deleteInstallation = useCallback((id: string) => {
    return installationsApi.remove(id);
  }, []);

  const assignMaterials = useCallback((id: string, payload: Parameters<typeof installationsApi.assignMaterials>[1]) => {
    return installationsApi.assignMaterials(id, payload);
  }, []);

  const reverseMaterial = useCallback(
    (id: string, usageId: string, payload: Parameters<typeof installationsApi.reverseMaterial>[2]) => {
      return installationsApi.reverseMaterial(id, usageId, payload);
    },
    []
  );

  const updateStatus = useCallback((id: string, payload: Parameters<typeof installationsApi.updateStatus>[1]) => {
    return installationsApi.updateStatus(id, payload);
  }, []);

  const getBomPdf = useCallback(
    (id: string, variant: Parameters<typeof installationsApi.getBomPdf>[1]) => {
      return installationsApi.getBomPdf(id, variant);
    },
    []
  );

  return {
    installations,
    pagination,
    loading,
    error,
    setError,
    fetchInstallations,
    createInstallation,
    updateInstallation,
    deleteInstallation,
    assignMaterials,
    reverseMaterial,
    updateStatus,
    getBomPdf,
    getInstallation: installationsApi.get,
    getSuggestedBOM: installationsApi.getSuggestedBOM,
    getLoadAnalysis: installationsApi.getLoadAnalysis,
  };
}
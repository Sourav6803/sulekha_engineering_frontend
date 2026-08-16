import { useCallback, useState } from 'react';
import { materialsApi, type MaterialListQuery } from '@/lib/api/materials.api';
import { handleApiError } from '@/lib/errors/handleApiError';
import type { MaterialDocument, MaterialSummary } from '@/types/material';
import type { PaginationInfo } from '@/types/api';

/**
 * Client state for the Materials list page.
 *
 * Reads the real backend list shape: the item array lives on `response.data`
 * and pagination metadata is a sibling. The cached-list branch of the backend
 * can omit `pagination`, so we fall back to a single-page pagination object.
 */
export function useMaterials() {
  const [materials, setMaterials] = useState<MaterialDocument[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMaterials = useCallback(async (query?: MaterialListQuery) => {
    setLoading(true);
    setError(null);

    try {
      const result = await materialsApi.list(query);
      const items = Array.isArray(result.data) ? result.data : [];
      setMaterials(items);
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

  const getSummary = useCallback(async (): Promise<MaterialSummary | null> => {
    try {
      const result = await materialsApi.getSummary();
      return result.data;
    } catch (err) {
      setError(handleApiError(err));
      return null;
    }
  }, []);

  // Mutation helpers. They return the raw API result and do NOT refetch the
  // list — the calling page owns the query and refetches (preserving filters,
  // sort and page) via fetchMaterials(query) after a successful mutation.
  const createMaterial = useCallback((payload: Parameters<typeof materialsApi.create>[0]) => {
    return materialsApi.create(payload);
  }, []);

  const updateMaterial = useCallback((id: string, payload: Parameters<typeof materialsApi.update>[1]) => {
    return materialsApi.update(id, payload);
  }, []);

  const deleteMaterial = useCallback((id: string) => {
    return materialsApi.remove(id);
  }, []);

  const adjustStock = useCallback((id: string, payload: Parameters<typeof materialsApi.adjustStock>[1]) => {
    return materialsApi.adjustStock(id, payload);
  }, []);

  return {
    materials,
    pagination,
    loading,
    error,
    setError,
    fetchMaterials,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    adjustStock,
    getSummary,
    // Thin passthroughs for detail-page usage
    getMaterial: materialsApi.get,
    getLowStock: materialsApi.getLowStock,
    searchMaterials: materialsApi.search,
    uploadMaterialImage: materialsApi.uploadImage,
    getMaterialHistory: materialsApi.getHistory,
  };
}

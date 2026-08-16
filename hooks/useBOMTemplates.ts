import { useCallback, useState } from 'react';
import { bomTemplatesApi, type BOMTemplateCreatePayload, type BOMTemplateListQuery, type BOMTemplateUpdatePayload } from '@/lib/api/bomTemplates.api';
import { handleApiError } from '@/lib/errors/handleApiError';
import type { BOMTemplateDocument, BOMByRoofTypeResponse, BulkCreateResult } from '@/types/bomTemplate';
import type { PaginationInfo } from '@/types/api';

export function useBOMTemplates() {
  const [templates, setTemplates] = useState<BOMTemplateDocument[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async (query?: BOMTemplateListQuery) => {
    setLoading(true);
    setError(null);
    try {
      const result = await bomTemplatesApi.list(query);
      const items = Array.isArray(result.data) ? result.data : [];
      setTemplates(items);
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

  const createTemplate = useCallback((payload: BOMTemplateCreatePayload) => {
    return bomTemplatesApi.create(payload);
  }, []);

  const updateTemplate = useCallback((id: string, payload: BOMTemplateUpdatePayload) => {
    return bomTemplatesApi.update(id, payload);
  }, []);

  const deleteTemplate = useCallback((id: string) => {
    return bomTemplatesApi.remove(id);
  }, []);

  const bulkCreate = useCallback((payload: Parameters<typeof bomTemplatesApi.bulkCreate>[0]) => {
    return bomTemplatesApi.bulkCreate(payload);
  }, []);

  const getByRoofType = useCallback(async (roofType: string, systemSizeKW: number): Promise<BOMByRoofTypeResponse | null> => {
    try {
      const result = await bomTemplatesApi.getByRoofType({ roofType: roofType as any, systemSizeKW });
      return result.data;
    } catch (err) {
      setError(handleApiError(err));
      return null;
    }
  }, []);

  const getTemplate = useCallback((id: string) => {
    return bomTemplatesApi.get(id);
  }, []);

  return {
    templates,
    pagination,
    loading,
    error,
    setError,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    bulkCreate,
    getByRoofType,
    getTemplate,
  };
}

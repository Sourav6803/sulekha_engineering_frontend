import { useCallback, useState } from 'react';
import { suppliersApi, type SupplierListQuery } from '@/lib/api/suppliers.api';
import { handleApiError } from '@/lib/errors/handleApiError';
import type { SupplierDocument } from '@/types/supplier';
import type { PaginationInfo } from '@/types/api';

type SupplierListResult = Awaited<ReturnType<typeof suppliersApi.list>>;

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<SupplierDocument[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuppliers = useCallback(async (query?: SupplierListQuery) => {
    setLoading(true);
    setError(null);

    try {
      const result = (await suppliersApi.list(query)) as SupplierListResult;
      const items = Array.isArray(result.data) ? result.data : [];
      setSuppliers(items);
      setPagination(
        (result as { pagination?: PaginationInfo }).pagination ?? {
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

  const createSupplier = useCallback((payload: Parameters<typeof suppliersApi.create>[0]) => {
    return suppliersApi.create(payload);
  }, []);

  const updateSupplier = useCallback((id: string, payload: Parameters<typeof suppliersApi.update>[1]) => {
    return suppliersApi.update(id, payload);
  }, []);

  const deleteSupplier = useCallback((id: string) => {
    return suppliersApi.remove(id);
  }, []);

  const bulkCreate = useCallback((payload: Parameters<typeof suppliersApi.bulkCreate>[0]) => {
    return suppliersApi.bulkCreate(payload);
  }, []);

  return {
    suppliers,
    pagination,
    loading,
    error,
    setError,
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    bulkCreate,
    getSupplier: suppliersApi.get,
    getPurchases: suppliersApi.getPurchases,
    getPerformance: suppliersApi.getPerformance,
  };
}

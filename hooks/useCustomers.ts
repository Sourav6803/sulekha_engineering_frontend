import { useCallback, useState } from 'react';
import { customersApi, type CustomerListQuery } from '@/lib/api/customers.api';
import { handleApiError } from '@/lib/errors/handleApiError';
import type { Customer } from '@/types/customer';
import type { PaginationInfo } from '@/types/api';

/**
 * Client state for the Customers list page.
 *
 * Reads the real backend list shape: the item array lives on `response.data`
 * and pagination metadata is a sibling. The cached-list branch of the backend
 * can omit `pagination`, so we fall back to a single-page pagination object.
 */
export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async (query?: CustomerListQuery) => {
    setLoading(true);
    setError(null);

    try {
      const result = await customersApi.list(query);
      const items = Array.isArray(result.data) ? result.data : [];
      setCustomers(items);
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

  // Mutation helpers. They return the raw API result and do NOT refetch the
  // list — the calling page owns the query and refetches (preserving filters,
  // sort and page) via fetchCustomers(query) after a successful mutation.
  const createCustomer = useCallback((payload: Parameters<typeof customersApi.create>[0]) => {
    return customersApi.create(payload);
  }, []);

  const updateCustomer = useCallback((id: string, payload: Parameters<typeof customersApi.update>[1]) => {
    return customersApi.update(id, payload);
  }, []);

  const deleteCustomer = useCallback((id: string) => {
    return customersApi.remove(id);
  }, []);

  const uploadDocument = useCallback((id: string, formData: FormData) => {
    return customersApi.uploadDocument(id, formData);
  }, []);

  const deleteDocument = useCallback((id: string, documentId: string) => {
    return customersApi.deleteDocument(id, documentId);
  }, []);

  return {
    customers,
    pagination,
    loading,
    error,
    setError,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    uploadDocument,
    deleteDocument,
    // Thin passthroughs for detail-page usage
    getCustomer: customersApi.get,
    searchCustomers: customersApi.search,
    getInstallations: customersApi.getInstallations,
    getHistory: customersApi.getHistory,
  };
}
import { useCallback, useState } from 'react';
import { agentsApi } from '@/lib/api/agents.api';
import { handleApiError } from '@/lib/errors/handleApiError';
import type { PaginationInfo } from '@/types/api';
import type {
  AgentEmailStatus,
  AgentEmailTestResult,
  AgentListItem,
  AgentListQuery,
} from '@/types/agent';

/**
 * Mirrors the existing domain hooks (see useQuotations/useCustomers):
 * list state + pagination + thin mutation passthroughs that do NOT refetch —
 * the page owns the query and refetches itself.
 *
 * Every call here is admin only; a non-admin gets a 403 which surfaces through
 * `error` rather than throwing.
 */
export function useAgents() {
  const [agents, setAgents] = useState<AgentListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async (query?: AgentListQuery) => {
    setLoading(true);
    setError(null);
    try {
      const result = await agentsApi.list(query);
      // Envelope: the array is `data`, pagination is a sibling.
      const items = Array.isArray(result.data) ? result.data : [];
      setAgents(items);
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

  const fetchEmailStatus = useCallback(async (): Promise<AgentEmailStatus | null> => {
    try {
      const result = await agentsApi.emailStatus();
      return result.data;
    } catch (err) {
      setError(handleApiError(err));
      return null;
    }
  }, []);

  const testEmailConnection = useCallback(async (): Promise<AgentEmailTestResult | null> => {
    try {
      const result = await agentsApi.emailTest();
      return result.data;
    } catch (err) {
      setError(handleApiError(err));
      return null;
    }
  }, []);

  const createAgent = useCallback(
    (payload: Parameters<typeof agentsApi.create>[0]) => agentsApi.create(payload),
    []
  );

  const updateAgent = useCallback(
    (id: string, payload: Parameters<typeof agentsApi.update>[1]) => agentsApi.update(id, payload),
    []
  );

  const activateAgent = useCallback((id: string) => agentsApi.activate(id), []);

  const resetAgentPassword = useCallback((id: string) => agentsApi.resetPassword(id), []);

  const deleteAgent = useCallback((id: string) => agentsApi.remove(id), []);

  return {
    agents,
    pagination,
    loading,
    error,
    setError,
    fetchAgents,
    fetchEmailStatus,
    testEmailConnection,
    createAgent,
    updateAgent,
    activateAgent,
    resetAgentPassword,
    deleteAgent,
    // Thin passthrough for a detail view
    getAgent: agentsApi.get,
  };
}

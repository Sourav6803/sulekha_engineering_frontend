import axiosClient from './axiosClient';
import { ENDPOINTS } from './endpoints';
import type { ApiListResponse, ApiResponse } from '@/types/api';
import type {
  AgentCredentialsResult,
  AgentDetail,
  AgentEmailStatus,
  AgentEmailTestResult,
  AgentListItem,
  AgentListQuery,
  AgentSummary,
  AgentUpdatePayload,
  AgentCreatePayload,
} from '@/types/agent';

/**
 * Agent management API.
 *
 * The backend envelope is `{ success, message, data, pagination }` where `data`
 * carries the array for list endpoints and `pagination` is a sibling. Every
 * route on this module is admin only — a non-admin gets a 403.
 */
export const agentsApi = {
  /** Every agent with what each one has brought in. */
  async list(query: AgentListQuery = {}) {
    const { data } = await axiosClient.get<ApiListResponse<AgentListItem>>(ENDPOINTS.agents.root, {
      params: query,
    });
    return data;
  },

  async get(id: string) {
    const { data } = await axiosClient.get<ApiResponse<AgentDetail>>(ENDPOINTS.agents.byId(id));
    return data;
  },

  /**
   * Create an agent. `temporaryPassword` comes back only when the welcome email
   * could not be sent, so the admin can pass the credentials on by hand.
   */
  async create(payload: AgentCreatePayload) {
    const { data } = await axiosClient.post<ApiResponse<AgentCredentialsResult>>(
      ENDPOINTS.agents.root,
      payload
    );
    return data;
  },

  async update(id: string, payload: AgentUpdatePayload) {
    const { data } = await axiosClient.put<ApiResponse<AgentSummary>>(
      ENDPOINTS.agents.byId(id),
      payload
    );
    return data;
  },

  /** Bring a suspended agent back. */
  async activate(id: string) {
    const { data } = await axiosClient.post<ApiResponse<AgentSummary>>(ENDPOINTS.agents.activate(id));
    return data;
  },

  /** Issue (and email) a new password. Same `temporaryPassword` rule as create. */
  async resetPassword(id: string) {
    const { data } = await axiosClient.post<ApiResponse<AgentCredentialsResult>>(
      ENDPOINTS.agents.resetPassword(id)
    );
    return data;
  },

  /** Soft delete. Refused with a 400 when the agent has applications on record. */
  async remove(id: string) {
    const { data } = await axiosClient.delete<ApiResponse<{ id: string; deleted: boolean }>>(
      ENDPOINTS.agents.byId(id)
    );
    return data;
  },

  /** Will welcome / reset emails actually go out? */
  async emailStatus() {
    const { data } = await axiosClient.get<ApiResponse<AgentEmailStatus>>(ENDPOINTS.agents.emailStatus);
    return data;
  },

  /** Verify the SMTP handshake. Sends nothing. */
  async emailTest() {
    const { data } = await axiosClient.post<ApiResponse<AgentEmailTestResult>>(ENDPOINTS.agents.emailTest);
    return data;
  },
};

export default agentsApi;

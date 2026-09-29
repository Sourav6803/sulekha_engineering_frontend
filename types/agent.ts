/**
 * Field agent types.
 *
 * The whole /agents module is admin-only on the backend
 * (see backend/src/routes/agent.routes.js). `temporaryPassword` is returned only
 * when the welcome email could NOT be sent, in which case the admin has to hand
 * the credentials over by hand.
 */

export type AgentStatus = 'active' | 'inactive' | 'suspended' | 'blocked';

/** Values the backend accepts for `department` (backend/src/validations/agent.validation.js). */
export type AgentDepartment = 'administration' | 'warehouse' | 'installation' | 'sales' | 'management';

export const AGENT_STATUSES: AgentStatus[] = ['active', 'inactive', 'suspended', 'blocked'];

export const AGENT_DEPARTMENTS: Array<{ value: AgentDepartment; label: string }> = [
  { value: 'sales', label: 'Sales' },
  { value: 'installation', label: 'Installation' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'management', label: 'Management' },
  { value: 'administration', label: 'Administration' },
];

/** What each agent has actually brought in. */
export interface AgentStats {
  applications: number;
  consumers: number;
  quotations: number;
  agreements: number;
  pendingReview: number;
  totalProposalValue: number;
}

/** The public shape of an agent account (never carries the password hash). */
export interface AgentSummary {
  id: string;
  name: string;
  email: string;
  role: 'agent';
  phone?: string;
  employeeId?: string;
  department?: AgentDepartment | string;
  status: AgentStatus;
  isActive: boolean;
  mustChangePassword?: boolean;
  lastLogin?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** A row of GET /agents — the account plus its numbers. */
export interface AgentListItem extends AgentSummary {
  stats: AgentStats;
}

export interface AgentListQuery {
  page?: number;
  limit?: number;
  status?: AgentStatus;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'lastLogin' | 'email';
  sortOrder?: 'asc' | 'desc';
}

export interface AgentCreatePayload {
  name: string;
  email: string;
  phone?: string;
  employeeId?: string;
  department?: AgentDepartment;
  password?: string;
}

export interface AgentUpdatePayload {
  name?: string;
  phone?: string;
  employeeId?: string;
  department?: AgentDepartment | string;
  status?: AgentStatus;
}

/** The best-effort welcome email report that rides along with create / reset. */
export interface AgentEmailReport {
  sent: boolean;
  reason?: string;
}

/** POST /agents and POST /agents/:id/reset-password response data. */
export interface AgentCredentialsResult {
  agent: AgentSummary;
  /** Present ONLY when the email could not be sent — show it to the admin. */
  temporaryPassword?: string;
  email: AgentEmailReport;
}

/** GET /agents/email-status */
export interface AgentEmailStatus {
  enabled: boolean;
  configured: boolean;
}

/** POST /agents/email-test */
export interface AgentEmailTestResult {
  ok: boolean;
  reason?: string;
}

/** GET /agents/:id */
export interface AgentDetail {
  agent: AgentSummary;
  recentApplications: unknown[];
}

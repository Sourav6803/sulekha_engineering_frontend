import type { AuthRole } from '@/types/auth';

/**
 * Frontend role gates mirroring backend authorization rules
 * (see backend/src/routes/material.routes.js).
 */

/**
 * Somebody who works from the installation van.
 *
 * The `department` field came first: installer accounts were created as
 * `role: 'agent'` and then put in the installation department. The dedicated
 * `installation_team` role arrived later, so both spellings exist in the database
 * and mean the same job. Every gate below runs on the effective role, which keeps
 * an existing installer out of the sales screens and inside the crew's.
 */
export const isInstallationCrew = (user?: { role?: AuthRole; department?: string } | null): boolean => {
  if (!user) return false;
  return user.role === 'installation_team' || (user.role === 'agent' && user.department === 'installation');
};

/** What the account actually works as, once the department has its say. */
export const effectiveRole = (role?: AuthRole, department?: string): AuthRole | undefined =>
  isInstallationCrew({ role, department }) ? 'installation_team' : role;

const MANAGER_ROLES: AuthRole[] = ['admin', 'manager', 'warehouse_staff', 'administration'];
const STOCK_ROLES: AuthRole[] = ['admin', 'manager', 'administration'];
const DELETE_ROLES: AuthRole[] = ['admin', 'administration'];

/**
 * Installation gates mirroring backend/src/routes/installation.routes.js:
 * create/update/assign/reverse/status require admin, manager or
 * installation_team; delete is admin only.
 */
const INSTALLATION_EDITOR_ROLES: AuthRole[] = ['admin', 'manager', 'installation_team'];

export const canManageMaterials = (role?: AuthRole): boolean => (role ? MANAGER_ROLES.includes(role) : false);
export const canAdjustStock = (role?: AuthRole): boolean => (role ? STOCK_ROLES.includes(role) : false);
export const canDeleteMaterial = (role?: AuthRole): boolean => (role ? DELETE_ROLES.includes(role) : false);

/**
 * Customer role gates mirroring backend/src/routes/customer.routes.js:
 * create/update and document upload are open to agents as well — the field agent
 * collects the KYC — while delete stays with admin.
 *
 * An agent only ever sees the customers they own; that scoping lives in the API
 * (customer.controller.js), not here.
 */
const CUSTOMER_EDITOR_ROLES: AuthRole[] = ['admin', 'manager', 'agent'];

export const canManageCustomers = (role?: AuthRole): boolean => (role ? CUSTOMER_EDITOR_ROLES.includes(role) : false);
export const canDeleteCustomer = (role?: AuthRole): boolean => (role === 'admin');

export const canManageInstallations = (role?: AuthRole, department?: string): boolean => {
  const r = effectiveRole(role, department);
  return r ? INSTALLATION_EDITOR_ROLES.includes(r) : false;
};
export const canReviewBom = (role?: AuthRole, department?: string): boolean =>
  canManageInstallations(role, department);
export const canAssignMaterials = (role?: AuthRole, department?: string): boolean => {
  const r = effectiveRole(role, department);
  return r ? INSTALLATION_EDITOR_ROLES.includes(r) : false;
};
export const canDeleteInstallation = (role?: AuthRole): boolean => (role === 'admin');

/**
 * Starting an installation is the office's job: it is filed from an application
 * and the crew is assigned to it. The crew join an existing job, they do not
 * create one, so `installation_team` is deliberately absent here even though it
 * may edit the job it was sent to.
 */
export const canCreateInstallation = (role?: AuthRole, department?: string): boolean => {
  const r = effectiveRole(role, department);
  return r === 'admin' || r === 'manager';
};

/** Putting names on a job is office work too — a fitter cannot add himself. */
export const canAssignCrew = (role?: AuthRole): boolean => role === 'admin' || role === 'manager';

/**
 * BOM template gates mirroring backend/src/routes/bomTemplate.routes.js:
 * view requires view_material permission; create/update/bulk require admin or manager; delete admin only.
 */
const BOM_EDITOR_ROLES: AuthRole[] = ['admin', 'manager'];
const BOM_VIEWER_ROLES: AuthRole[] = ['admin', 'manager', 'warehouse_staff', 'installation_team', 'viewer', 'administration'];

export const canManageBOMTemplates = (role?: AuthRole): boolean => (role ? BOM_EDITOR_ROLES.includes(role) : false);
export const canDeleteBOMTemplate = (role?: AuthRole): boolean => (role === 'admin');
export const canViewBOMTemplates = (role?: AuthRole): boolean => (role ? BOM_VIEWER_ROLES.includes(role) : false);

const SUPPLIER_EDITOR_ROLES: AuthRole[] = ['admin', 'manager'];
const SUPPLIER_VIEWER_ROLES: AuthRole[] = ['admin', 'manager', 'warehouse_staff', 'installation_team', 'viewer', 'administration'];

export const canManageSuppliers = (role?: AuthRole): boolean => (role ? SUPPLIER_EDITOR_ROLES.includes(role) : false);
export const canViewSuppliers = (role?: AuthRole): boolean => (role ? SUPPLIER_VIEWER_ROLES.includes(role) : false);
export const canDeleteSupplier = (role?: AuthRole): boolean => (role === 'admin');

/**
 * Quotation gates mirroring backend/src/routes/quotation.routes.js:
 * create/update/status/attachments require admin or manager, delete and the
 * register back-fill are admin only, and every signed in user may read and print.
 *
 * Note: `administration` (which appears in the role arrays above) is not a value
 * the backend User model accepts, so it is deliberately not listed here.
 */
const QUOTATION_EDITOR_ROLES: AuthRole[] = ['admin', 'manager'];

export const canViewQuotations = (role?: AuthRole): boolean =>
  role ? ['admin', 'manager', 'warehouse_staff', 'installation_team', 'viewer'].includes(role) : false;
export const canManageQuotations = (role?: AuthRole): boolean => (role ? QUOTATION_EDITOR_ROLES.includes(role) : false);
export const canDeleteQuotation = (role?: AuthRole): boolean => (role === 'admin');
export const canImportQuotations = (role?: AuthRole): boolean => (role === 'admin');

/**
 * Agreement gates mirroring backend/src/routes/agreement.routes.js:
 * create/update and the document are admin or manager, delete is admin only.
 */
const AGREEMENT_EDITOR_ROLES: AuthRole[] = ['admin', 'manager'];

export const canManageAgreements = (role?: AuthRole): boolean =>
  role ? AGREEMENT_EDITOR_ROLES.includes(role) : false;
export const canDeleteAgreement = (role?: AuthRole): boolean => (role === 'admin');
/** The PDF download is admin/manager; printing is open to every signed in user. */
export const canDownloadQuotationPdf = (role?: AuthRole): boolean => (role ? QUOTATION_EDITOR_ROLES.includes(role) : false);

/**
 * Application (field intake) gates mirroring
 * backend/src/routes/application.routes.js:
 * INTAKE_ROLES = ['admin', 'manager', 'agent'] may list, read and file
 * applications, and the server scopes an agent to their own records. The review
 * half of the workflow stays with admin/manager and is not exposed to agents.
 */
const APPLICATION_INTAKE_ROLES: AuthRole[] = ['admin', 'manager', 'agent'];

export const canViewApplications = (role?: AuthRole, department?: string): boolean => {
  const r = effectiveRole(role, department);
  return r ? APPLICATION_INTAKE_ROLES.includes(r) : false;
};
export const canCreateApplication = (role?: AuthRole, department?: string): boolean =>
  canViewApplications(role, department);
export const canViewApplicationStats = (role?: AuthRole, department?: string): boolean =>
  canViewApplications(role, department);
/** The agent's own dashboard (applications only) instead of the office dashboard. */
export const canViewAgentDashboard = (role?: AuthRole, department?: string): boolean =>
  effectiveRole(role, department) === 'agent';

/**
 * Who may fill in and submit an application.
 *
 * This used to be the agent alone, because the agent typed the consumer's
 * details. The consumer is now a Customer record collected by an agent or by the
 * office, and the application is filed from it — so the wizard is the office's
 * too (backend APPLICATION_WRITE_ROLES). What stays office-only is *starting*
 * one: a verified customer becomes an application only when admin or manager
 * decides it does (see canStartApplication).
 */
export const canEditApplication = (role?: AuthRole): boolean =>
  role ? APPLICATION_INTAKE_ROLES.includes(role) : false;

/** Filing a new application from a verified customer — office only. */
export const canStartApplication = (role?: AuthRole): boolean => role === 'admin' || role === 'manager';

/**
 * The office half of the application workflow — judging, not typing.
 *
 * Admin and manager read the record, rule on each document, verify the
 * electricity bill, move the application along the workflow and file the
 * consumer-signed copy (backend REVIEW_ROLES). They never write the consumer
 * data itself: that stays with the agent who collected it.
 */
export const canReviewApplication = (role?: AuthRole): boolean => role === 'admin' || role === 'manager';

/**
 * Agent account management is admin only — backend/src/routes/agent.routes.js
 * applies `authorize('admin')` to the whole module, manager included.
 */
export const canManageAgents = (role?: AuthRole): boolean => role === 'admin';
export const canViewAgents = (role?: AuthRole): boolean => canManageAgents(role);

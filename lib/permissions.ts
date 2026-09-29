import type { AuthRole } from '@/types/auth';

/**
 * Frontend role gates mirroring backend authorization rules
 * (see backend/src/routes/material.routes.js).
 */

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
 * create/update are restricted to admin and manager; delete to admin only.
 */
const CUSTOMER_EDITOR_ROLES: AuthRole[] = ['admin', 'manager'];

export const canManageCustomers = (role?: AuthRole): boolean => (role ? CUSTOMER_EDITOR_ROLES.includes(role) : false);
export const canDeleteCustomer = (role?: AuthRole): boolean => (role === 'admin');

export const canManageInstallations = (role?: AuthRole): boolean => (role ? INSTALLATION_EDITOR_ROLES.includes(role) : false);
export const canReviewBom = (role?: AuthRole): boolean => canManageInstallations(role);
export const canAssignMaterials = (role?: AuthRole): boolean => (role ? INSTALLATION_EDITOR_ROLES.includes(role) : false);
export const canDeleteInstallation = (role?: AuthRole): boolean => (role === 'admin');

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

export const canViewApplications = (role?: AuthRole): boolean =>
  role ? APPLICATION_INTAKE_ROLES.includes(role) : false;
export const canCreateApplication = (role?: AuthRole): boolean =>
  role ? APPLICATION_INTAKE_ROLES.includes(role) : false;
export const canViewApplicationStats = (role?: AuthRole): boolean =>
  role ? APPLICATION_INTAKE_ROLES.includes(role) : false;
/** The agent's own dashboard (applications only) instead of the office dashboard. */
export const canViewAgentDashboard = (role?: AuthRole): boolean => role === 'agent';

/**
 * The field half of the application workflow — writing consumer data.
 *
 * Only the agent who collected the application may open it, edit its fields,
 * upload / replace / delete documents, submit it or discard it. The backend
 * applies `authorize('agent')` (FIELD_AGENT_ROLES) to every one of those routes,
 * so admin and manager are refused with a 403 rather than the edit being hidden
 * on the client alone.
 */
export const canEditApplication = (role?: AuthRole): boolean => role === 'agent';

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

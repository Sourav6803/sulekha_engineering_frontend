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

import type { BaseDocument } from './api';

/** `agent` is the field agent role — admin-only account management, own applications only. */
export type AuthRole =
  | 'admin'
  | 'manager'
  | 'agent'
  | 'warehouse_staff'
  | 'installation_team'
  | 'viewer'
  | 'administration';

export interface AuthUser extends BaseDocument {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
  permissions?: string[];
  phone?: string;
  employeeId?: string;
  department?: string;
  status?: string;
  lastLogin?: string;
  /**
   * Set when an admin created the account (or reset its password) and the
   * generated password has not been replaced yet. The signed-in client sends
   * the user to /change-password while this is true.
   */
  mustChangePassword?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthLoginPayload {
  email: string;
  password: string;
}

export interface AuthLoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

/**
 * Mirrors backend/src/validations/auth.validation.js: newPassword needs 8+
 * characters with an upper case letter, a lower case letter and a digit, and
 * confirmPassword has to equal it.
 */
export interface AuthChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

import type { BaseDocument } from './api';

export type AuthRole = 'admin' | 'manager' | 'warehouse_staff' | 'installation_team' | 'viewer' | 'administration';

export interface AuthUser extends BaseDocument {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
  permissions?: string[];
  phone?: string;
  department?: string;
  status?: string;
  lastLogin?: string;
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

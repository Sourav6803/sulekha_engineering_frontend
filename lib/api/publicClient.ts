import axios from 'axios';
import { API_BASE_URL } from '@/config/constants';

/**
 * Anonymous client for the marketing site.
 *
 * Deliberately separate from `axiosClient`: that one attaches the signed-in
 * token and, on a 401, tries a refresh then redirects to /login. A visitor
 * reading the home page has no session, and a stray 401 must never bounce them
 * to the staff login screen.
 */
export const publicClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Absolute base for server-side reads.
 *
 * `NEXT_PUBLIC_API_BASE_URL` may be a relative path (`/api/v1`), which `fetch`
 * cannot resolve on the server. In that case the API is assumed to be the local
 * backend used in development.
 */
export const serverApiBase = (): string => {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (configured && /^https?:\/\//i.test(configured)) return configured.replace(/\/$/, '');
  return 'http://localhost:9000/api/v1';
};

import { publicClient, serverApiBase } from './publicClient';
import type { HomePayload, LeadInput, PublicProject, SiteBanner } from '@/types/site';

/**
 * Public marketing API.
 *
 * Every call here is anonymous; the backend exposes published content only.
 */

export const getHome = async (): Promise<HomePayload> => {
  const { data } = await publicClient.get('/public/home');
  return data.data as HomePayload;
};

/** Server-side variant, for the landing page's first paint. */
export const getHomeOnServer = async (): Promise<HomePayload | null> => {
  try {
    const response = await fetch(`${serverApiBase()}/public/home`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    const json = await response.json();
    return (json?.data as HomePayload) ?? null;
  } catch {
    // A marketing page must render even when the API is briefly unreachable.
    return null;
  }
};

export type ProjectQuery = {
  page?: number;
  limit?: number;
  district?: string;
  brand?: string;
  minKW?: number;
  maxKW?: number;
  search?: string;
  sort?: 'newest' | 'oldest' | 'capacity' | 'views';
  highlight?: boolean;
};

export const listProjects = async (query: ProjectQuery = {}) => {
  const { data } = await publicClient.get('/showcase', { params: query });
  return {
    items: data.data as PublicProject[],
    pagination: data.pagination as { page: number; limit: number; total: number; pages: number },
  };
};

/**
 * Server-side list, for the /projects page's first paint.
 *
 * The axios `listProjects` above cannot run on the server: `API_BASE_URL` may be
 * a relative path (`/api/v1`), which `fetch`/axios cannot resolve without an
 * origin. This one uses the absolute `serverApiBase()` for the same reason
 * `getHomeOnServer` does.
 */
export const listProjectsOnServer = async (
  query: ProjectQuery = {}
): Promise<{ items: PublicProject[]; pagination: { page: number; limit: number; total: number; pages: number } }> => {
  const empty = { page: 1, limit: 12, total: 0, pages: 0 };
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.set(key, String(value));
  });

  try {
    const response = await fetch(`${serverApiBase()}/showcase?${params.toString()}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return { items: [], pagination: empty };

    const json = await response.json();
    return {
      items: (json?.data as PublicProject[]) ?? [],
      pagination: (json?.pagination as typeof empty) ?? empty,
    };
  } catch {
    return { items: [], pagination: empty };
  }
};

export const getProject = async (slug: string): Promise<PublicProject> => {
  const { data } = await publicClient.get(`/showcase/${encodeURIComponent(slug)}`);
  return data.data as PublicProject;
};

export const getProjectOnServer = async (slug: string): Promise<PublicProject | null> => {
  try {
    const response = await fetch(`${serverApiBase()}/showcase/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    const json = await response.json();
    return (json?.data as PublicProject) ?? null;
  } catch {
    return null;
  }
};

export const listBanners = async (): Promise<{ byPlacement: Partial<Record<string, SiteBanner[]>>; all: SiteBanner[] }> => {
  const { data } = await publicClient.get('/banners');
  return data.data;
};

export const createLead = async (payload: LeadInput) => {
  const { data } = await publicClient.post('/leads', payload);
  return data as { success: boolean; message: string; data: { id: string; duplicate: boolean } };
};

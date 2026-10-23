import axiosClient from './axiosClient';
import type { AdminProject } from '@/types/site';

/**
 * Project stories — the office side.
 *
 * Every call is authenticated by the shared interceptor; the backend additionally
 * requires role admin/manager, and deletion is admin only.
 */

export type ShowcaseListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  district?: string;
  isPublished?: 'true' | 'false';
};

export const listAdmin = async (params: ShowcaseListQuery = {}) => {
  const { data } = await axiosClient.get('/showcase/admin', { params });
  return {
    items: data.data as AdminProject[],
    pagination: data.pagination as { page: number; limit: number; total: number; pages: number },
    counts: (data.counts ?? { drafts: 0, published: 0 }) as { drafts: number; published: number },
  };
};

export const getAdmin = async (id: string): Promise<AdminProject> => {
  const { data } = await axiosClient.get(`/showcase/admin/${id}`);
  return data.data;
};

export type ProjectInput = {
  title?: string;
  summary?: string;
  story?: string;
  customerName?: string;
  customerConsent?: boolean;
  location?: { district?: string; state?: string; area?: string; pincode?: string };
  capacityKW?: number;
  panelBrand?: string;
  panelModel?: string;
  panelCount?: number;
  inverterBrand?: string;
  systemType?: 'on-grid' | 'off-grid' | 'hybrid';
  structureType?: string;
  commissionedAt?: string | null;
  tags?: string[];
  highlight?: boolean;
  isPublished?: boolean;
  seo?: { title?: string; description?: string };
};

export const create = async (payload: ProjectInput): Promise<AdminProject> => {
  const { data } = await axiosClient.post('/showcase/admin', payload);
  return data.data;
};

export const update = async (id: string, payload: ProjectInput): Promise<AdminProject> => {
  const { data } = await axiosClient.put(`/showcase/admin/${id}`, payload);
  return data.data;
};

export const remove = async (id: string) => {
  const { data } = await axiosClient.delete(`/showcase/admin/${id}`);
  return data.data;
};

export const setPublished = async (id: string, isPublished: boolean): Promise<AdminProject> => {
  const { data } = await axiosClient.patch(`/showcase/admin/${id}/publish`, { isPublished });
  return data.data;
};

/** Upload a photo or a short clip (multipart, field name `file`). */
export const addMediaFile = async (id: string, file: File, caption?: string) => {
  const body = new FormData();
  body.append('file', file);
  if (caption) body.append('caption', caption);

  const { data } = await axiosClient.post(`/showcase/admin/${id}/media`, body, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
};

/** Attach something already hosted (YouTube, Drive, a CDN). */
export const addMediaLink = async (
  id: string,
  payload: { url: string; kind?: 'image' | 'video'; provider?: string; caption?: string; thumbnailUrl?: string }
) => {
  const { data } = await axiosClient.post(`/showcase/admin/${id}/media`, payload);
  return data.data;
};

export const removeMedia = async (id: string, mediaId: string) => {
  const { data } = await axiosClient.delete(`/showcase/admin/${id}/media/${mediaId}`);
  return data.data;
};

export const uploadCover = async (id: string, file: File) => {
  const body = new FormData();
  body.append('image', file);
  const { data } = await axiosClient.post(`/showcase/admin/${id}/cover`, body, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data as AdminProject;
};

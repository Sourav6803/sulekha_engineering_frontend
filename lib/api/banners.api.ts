import axiosClient from './axiosClient';
import type { AdminBanner, BannerPlacement } from '@/types/site';

/**
 * Banner artwork — the office side.
 *
 * Upload first (`/banners/admin/upload` returns `{ url, publicId }`), then send
 * that url in the create/update body. Keeping the two steps apart means a failed
 * save never leaves an orphan file, and the upload can be reused for a rewrite.
 */

export const listAdmin = async (params: { placement?: BannerPlacement; isActive?: 'true' | 'false' } = {}) => {
  const { data } = await axiosClient.get('/banners/admin', { params });
  return data.data as { items: AdminBanner[]; placements: BannerPlacement[] };
};

export const uploadImage = async (file: File): Promise<{ url: string; publicId: string }> => {
  const body = new FormData();
  body.append('image', file);
  const { data } = await axiosClient.post('/banners/admin/upload', body, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
};

export type BannerInput = {
  title?: string;
  altText?: string;
  imageUrl?: string;
  publicId?: string;
  linkUrl?: string | null;
  ctaLabel?: string | null;
  placement?: BannerPlacement;
  campaign?: string | null;
  order?: number;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
};

export const create = async (payload: BannerInput): Promise<AdminBanner> => {
  const { data } = await axiosClient.post('/banners/admin', payload);
  return data.data;
};

export const update = async (id: string, payload: BannerInput): Promise<AdminBanner> => {
  const { data } = await axiosClient.put(`/banners/admin/${id}`, payload);
  return data.data;
};

export const setActive = async (id: string, isActive: boolean): Promise<AdminBanner> => {
  const { data } = await axiosClient.patch(`/banners/admin/${id}/active`, { isActive });
  return data.data;
};

export const remove = async (id: string) => {
  const { data } = await axiosClient.delete(`/banners/admin/${id}`);
  return data.data;
};

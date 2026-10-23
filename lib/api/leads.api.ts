import axiosClient from './axiosClient';
import type { AdminLead, LeadStatus } from '@/types/site';

export type LeadListQuery = {
  page?: number;
  limit?: number;
  status?: LeadStatus;
  source?: string;
  district?: string;
  search?: string;
  from?: string;
  to?: string;
};

export const listAdmin = async (params: LeadListQuery = {}) => {
  const { data } = await axiosClient.get('/leads/admin', { params });
  return {
    items: data.data as AdminLead[],
    pagination: data.pagination as { page: number; limit: number; total: number; pages: number },
    counts: (data.counts ?? {}) as Record<string, number>,
  };
};

export const getAdmin = async (id: string): Promise<AdminLead> => {
  const { data } = await axiosClient.get(`/leads/admin/${id}`);
  return data.data;
};

export const getStats = async () => {
  const { data } = await axiosClient.get('/leads/admin/stats');
  return data.data as {
    today: number;
    week: number;
    byStatus: Record<string, number>;
    bySource: Record<string, number>;
    byDistrict: { district: string; count: number }[];
  };
};

export const updateStatus = async (id: string, status: LeadStatus): Promise<AdminLead> => {
  const { data } = await axiosClient.patch(`/leads/admin/${id}/status`, { status });
  return data.data;
};

export const addNote = async (id: string, text: string): Promise<AdminLead> => {
  const { data } = await axiosClient.post(`/leads/admin/${id}/notes`, { text });
  return data.data;
};

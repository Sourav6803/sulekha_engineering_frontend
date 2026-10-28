import type { ApiListResponse, ApiResponse } from '@/types/api';
import type { InstallationDocument, InstallationPanelUnit, SuggestedBOMSection } from '@/types/installation';
import axiosClient from './axiosClient';
import { ENDPOINTS } from './endpoints';

export interface InstallationListQuery {
  page?: number;
  limit?: number;
  customer?: string;
  status?: string;
  roofType?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export type CreateInstallationDto = Partial<InstallationDocument> & {
  /**
   * The application the installation is built from. When set, the server reads
   * the customer, system size, roof type and quotation number from it and ignores
   * whatever this payload carries for those.
   */
  application?: string;
};

export type UpdateInstallationDto = Partial<InstallationDocument>;

/**
 * One row of the "which application is this for?" list.
 *
 * Only applications whose customer has no installation yet are returned, and the
 * facts the form shows read-only travel with the row so the form never has to ask
 * for them.
 */
export interface InstallableApplication {
  _id: string;
  applicationNo: string;
  applicationStatus?: string;
  customer: { _id: string; name?: string; phone?: string; customerId?: string } | string | null;
  consumerName: string;
  phone: string;
  customerId: string;
  systemSizeKW: number | null;
  roofType: string | null;
  quotationNo: string | null;
}

/** One row of the installation board. */
export interface InstallationDashboardJob {
  _id: string;
  installationId: string;
  projectNo?: string;
  consumerName?: string;
  installDate?: string;
  status?: string;
  systemSizeKW?: number;
  /** How many evidence items are still missing before the job can be closed. */
  gaps: number;
}

export interface InstallationDashboardData {
  scope: 'mine' | 'all';
  counts: {
    active: number;
    today: number;
    evidencePending: number;
    completedThisMonth: number;
  };
  jobs: InstallationDashboardJob[];
}

export interface TeamCandidate {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  employeeId?: string;
}

export interface AssignMaterialsDto {
  items: Array<{
    material: string;
    qty: number;
    remark?: string;
  }>;
  idempotencyKey?: string;
}

export interface ReverseMaterialDto {
  reason: string;
}

export interface UpdateInstallationStatusDto {
  status: string;
  notes?: string;
}

export type BomVariant = 'suggested' | 'final';

export interface CreateInstallationResponse {
  installation: InstallationDocument;
  suggestedMaterials: SuggestedBOMSection[];
  loadAnalysis: unknown;
}

export type InstallationListResponse = ApiListResponse<InstallationDocument>;
export type InstallationResponse = ApiResponse<InstallationDocument>;

export const installationsApi = {
  list: (query?: InstallationListQuery) =>
    axiosClient
      .get<InstallationListResponse>(ENDPOINTS.installations.root, { params: query })
      .then((response) => response.data),

  create: (payload: CreateInstallationDto) =>
    axiosClient
      .post<ApiResponse<CreateInstallationResponse>>(ENDPOINTS.installations.root, payload)
      .then((response) => response.data),

  /** Applications with no installation yet — the create form's only source. */
  installableApplications: () =>
    axiosClient
      .get<ApiResponse<InstallableApplication[]>>(ENDPOINTS.installations.installableApplications)
      .then((response) => response.data),

  /** The installation board: the crew's own jobs, the office's whole pipeline. */
  dashboard: () =>
    axiosClient
      .get<ApiResponse<InstallationDashboardData>>(ENDPOINTS.installations.dashboard)
      .then((response) => response.data),

  teamCandidates: () =>
    axiosClient
      .get<ApiResponse<TeamCandidate[]>>(ENDPOINTS.installations.teamCandidates)
      .then((response) => response.data),

  setTeam: (id: string, members: Array<{ member: string; role?: string }>) =>
    axiosClient
      .patch<ApiResponse<{ teamAssigned: unknown[] }>>(ENDPOINTS.installations.team(id), { members })
      .then((response) => response.data),

  // ---- evidence, filled by the crew on site ------------------------------

  addPanel: (id: string, payload: { count?: number; serial?: string }) =>
    axiosClient
      .post<ApiResponse<{ panelUnits: InstallationPanelUnit[] }>>(
        ENDPOINTS.installations.panels(id),
        payload
      )
      .then((response) => response.data),

  updatePanel: (id: string, panelId: string, serial: string) =>
    axiosClient
      .patch<ApiResponse<{ panelUnits: InstallationPanelUnit[] }>>(
        ENDPOINTS.installations.panel(id, panelId),
        { serial }
      )
      .then((response) => response.data),

  removePanel: (id: string, panelId: string) =>
    axiosClient
      .delete<ApiResponse<{ panelUnits: InstallationPanelUnit[] }>>(
        ENDPOINTS.installations.panel(id, panelId)
      )
      .then((response) => response.data),

  updateInverter: (id: string, payload: { brand?: string; serial?: string; capacityKW?: number | null }) =>
    axiosClient
      .patch<ApiResponse<{ inverter: InstallationDocument['inverter'] }>>(
        ENDPOINTS.installations.inverter(id),
        payload
      )
      .then((response) => response.data),

  /** One file, one slot: panels | meter | inverter | marketing, or panel + panelId. */
  uploadEvidencePhoto: (
    id: string,
    file: File,
    payload: { slot: 'panels' | 'meter' | 'inverter' | 'marketing' | 'panel'; panelId?: string }
  ) => {
    const body = new FormData();
    body.append('file', file);
    body.append('slot', payload.slot);
    if (payload.panelId) body.append('panelId', payload.panelId);

    return axiosClient
      .post<ApiResponse<InstallationDocument>>(ENDPOINTS.installations.evidencePhoto(id), body)
      .then((response) => response.data);
  },

  evidenceGaps: (id: string) =>
    axiosClient
      .get<ApiResponse<{ gaps: string[]; complete: boolean }>>(
        ENDPOINTS.installations.evidenceGaps(id)
      )
      .then((response) => response.data),

  complete: (id: string) =>
    axiosClient
      .patch<ApiResponse<InstallationDocument>>(ENDPOINTS.installations.complete(id))
      .then((response) => response.data),

  get: (id: string) =>
    axiosClient.get<InstallationResponse>(ENDPOINTS.installations.byId(id)).then((response) => response.data),

  update: (id: string, payload: UpdateInstallationDto) =>
    axiosClient.put<InstallationResponse>(ENDPOINTS.installations.byId(id), payload).then((response) => response.data),

  remove: (id: string) =>
    axiosClient.delete<ApiResponse<null>>(ENDPOINTS.installations.byId(id)).then((response) => response.data),

  getSuggestedBOM: (roofType: string, systemSizeKW: number) =>
    axiosClient
      .get<ApiResponse<{ roofType: string; systemSizeKW: number; materials: SuggestedBOMSection[] }>>(
        ENDPOINTS.installations.suggestedBOM,
        { params: { roofType, systemSizeKW } }
      )
      .then((response) => response.data),

  assignMaterials: (id: string, payload: AssignMaterialsDto) =>
    axiosClient.post<ApiResponse<InstallationDocument>>(ENDPOINTS.installations.materials(id), payload).then((response) => response.data),

  reverseMaterial: (id: string, usageId: string, payload: ReverseMaterialDto) =>
    axiosClient
      .post<ApiResponse<InstallationDocument>>(ENDPOINTS.installations.reverseMaterial(id, usageId), payload)
      .then((response) => response.data),

  getBomPdf: (id: string, variant: BomVariant = 'final') =>
    axiosClient
      .get<ArrayBuffer>(ENDPOINTS.installations.bomPdf(id), { params: { variant }, responseType: 'arraybuffer' })
      .then((response) => response.data),

  getBomExcel: (id: string, variant: BomVariant = 'suggested') =>
    axiosClient
      .get<ArrayBuffer>(ENDPOINTS.installations.bomExcel(id), { params: { variant }, responseType: 'arraybuffer' })
      .then((response) => response.data),

  updateStatus: (id: string, payload: UpdateInstallationStatusDto) =>
    axiosClient
      .patch<ApiResponse<InstallationDocument>>(ENDPOINTS.installations.status(id), payload)
      .then((response) => response.data),

  getLoadAnalysis: (id: string) =>
    axiosClient.get<ApiResponse<unknown>>(ENDPOINTS.installations.loadAnalysis(id)).then((response) => response.data)
};
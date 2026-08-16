import type { ApiListResponse, ApiResponse } from './api';
import type { BaseDocument } from './api';
import type { RoofType } from './customer';

export type { RoofType } from './customer';
export type FormulaType = 'fixed' | 'per_kw' | 'linear' | 'step';

export interface QtyFormulaStep {
  fromKW: number;
  toKW: number;
  qty: number;
}

export interface QtyFormula {
  type: FormulaType;
  value: number;
  minQty?: number;
  maxQty?: number;
  stepSizes?: QtyFormulaStep[];
}

export interface BOMTemplateDocument extends BaseDocument {
  templateName: string;
  roofType: RoofType;
  systemSizeKW: number;
  section: string;
  sectionOrder?: number;
  material: string | { _id: string; name?: string; materialCode?: string; unit?: string };
  qtyFormula: QtyFormula;
  isOptional?: boolean;
  defaultRemark?: string;
  wastageFactor?: number;
  priority?: number;
  isActive?: boolean;
  createdBy?: string;
  updatedBy?: string;
}

export interface BOMTemplateCreatePayload {
  templateName: string;
  roofType: RoofType;
  systemSizeKW: number;
  section: string;
  sectionOrder?: number;
  material: string;
  qtyFormula: QtyFormula;
  isOptional?: boolean;
  defaultRemark?: string;
  wastageFactor?: number;
  priority?: number;
}

export interface BOMTemplateUpdatePayload extends Partial<BOMTemplateCreatePayload> {
  isActive?: boolean;
}

export interface BOMTemplateListQuery {
  page?: number;
  limit?: number;
  roofType?: RoofType;
  section?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BOMByRoofTypeQuery {
  roofType: RoofType;
  systemSizeKW: number;
}

export interface BOMSuggestionItem {
  material: { _id: string; name?: string; materialCode?: string; unit?: string; currentStock?: number };
  materialName: string;
  materialCode: string;
  unit: string;
  quantity: number;
  section: string;
  remark: string;
  isOptional: boolean;
  priority: number;
  currentStock: number;
}

export interface BOMSectionGroup {
  section: string;
  order: number;
  items: BOMSuggestionItem[];
  totalQuantity: number;
  totalCost: number;
}

export interface BOMByRoofTypeResponse {
  roofType: RoofType;
  systemSizeKW: number;
  bom: BOMSectionGroup[];
}

export interface BulkCreatePayload {
  templates: BOMTemplateCreatePayload[];
}

export interface BulkCreateResult {
  created: BOMTemplateDocument[];
  errors: { data: BOMTemplateCreatePayload; error: string }[];
  summary: {
    total: number;
    success: number;
    failed: number;
  };
}

export interface BOMTemplateListResponse extends ApiListResponse<BOMTemplateDocument> {}
export interface BOMTemplateResponse extends ApiResponse<BOMTemplateDocument> {}
export interface BOMByRoofTypeApiResponse extends ApiResponse<BOMByRoofTypeResponse> {}
export interface BulkCreateApiResponse extends ApiResponse<BulkCreateResult> {}

import type { BaseDocument } from './api';

export type InstallationStatus =
  | 'pending_quotation'
  | 'quoted'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type LoadSuitability = 'SUFFICIENT' | 'INSUFFICIENT' | 'MARGINAL';
export type InstallationMaterialStatus = 'reserved' | 'installed' | 'reversed';
export type InstallationTeamRole = 'lead' | 'technician' | 'helper' | 'supervisor';

export interface InstallationLoadAnalysisDetails {
  averageConsumption?: number;
  dailyGenerationKWh?: number;
  recommendedInverterKW?: number;
  submersiblePowerKW?: number;
  startingPowerKW?: number;
  loadSuitability?: LoadSuitability;
  recommendations?: string[];
}

export interface InstallationMaterialUsage extends BaseDocument {
  material: string | { _id: string; name?: string; materialCode?: string; unit?: string; category?: string; description?: string };
  materialCodeSnapshot: string;
  materialNameSnapshot: string;
  descriptionSnapshot: string;
  unitSnapshot: string;
  qty: number;
  unitCostSnapshot: number;
  totalCostSnapshot: number;
  remark?: string;
  status?: InstallationMaterialStatus;
  installedBy?: string;
  installedAt?: string;
  reversedAt?: string;
  reversedBy?: string;
  reversalReason?: string;
}

/** A single suggested line produced by the backend BOM template resolver. */
export interface SuggestedBOMItem {
  material: string | { _id: string; name?: string; materialCode?: string; unit?: string; currentStock?: number };
  materialName: string;
  materialCode: string;
  unit: string;
  quantity: number;
  section: string;
  remark?: string;
  isOptional?: boolean;
  priority?: number;
  currentStock?: number;
}

/** A section of the suggested BOM (as returned by getSuggestedBOM / stored on the installation). */
export interface SuggestedBOMSection {
  section: string;
  order?: number;
  items: SuggestedBOMItem[];
  totalQuantity?: number;
  totalCost?: number;
}

export interface InstallationTeamAssignment {
  member: string;
  role?: InstallationTeamRole;
  assignedAt?: string;
}

export interface InstallationDocument extends BaseDocument {
  installationId: string;
  customer: string;
  customerNameSnapshot: string;
  customerPhoneSnapshot: string;
  projectNo?: string;
  quotationNo?: string;
  systemSizeKW: number;
  roofType: string;
  totalLoad?: number;
  inverterCapacity?: number;
  loadCapacityUtilized?: number;
  canRunSubmersible?: boolean;
  loadAnalysisDetails?: InstallationLoadAnalysisDetails;
  totalCost?: number;
  materialsCost?: number;
  laborCost?: number;
  margin?: number;
  orderDate?: string;
  installDate: string;
  completionDate?: string;
  status?: InstallationStatus;
  materialsUsed: InstallationMaterialUsage[];
  suggestedMaterials?: SuggestedBOMSection[] | null;
  teamAssigned?: InstallationTeamAssignment[];
  notes?: string;
  documents?: Array<{
    type: string;
    url?: string;
    caption?: string;
    uploadedAt?: string;
  }>;
  /** What the crew records on site. See the evidence card. */
  panelUnits?: InstallationPanelUnit[];
  sitePhotos?: {
    panels?: InstallationPhoto;
    meter?: InstallationPhoto;
  };
  inverter?: {
    brand?: string;
    serial?: string;
    photoUrl?: string;
    photoFileName?: string;
  };
  marketingPhoto?: InstallationPhoto;

  createdBy: string;
  updatedBy?: string;
}

/** One panel, with the serial off its sticker and a photo of that panel. */
export interface InstallationPanelUnit {
  _id: string;
  serial?: string;
  photoUrl?: string;
  photoFileName?: string;
  addedAt?: string;
}

export interface InstallationPhoto {
  url?: string;
  fileName?: string;
  uploadedAt?: string;
}

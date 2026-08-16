import type { BaseDocument } from './api';

export type MaterialUnit = 'nos' | 'mtr' | 'kg' | 'packet' | 'pair' | 'bag' | 'roll' | 'box';
export type MaterialStatus = 'active' | 'inactive' | 'discontinued';

export interface MaterialImage {
  url?: string;
  caption?: string;
  isPrimary?: boolean;
  uploadedAt?: string;
}

export interface MaterialDocument extends BaseDocument {
  materialCode: string;
  name: string;
  description?: string;
  unit: MaterialUnit;
  unitCost?: number;
  currentStock?: number;
  reservedStock?: number;
  minimumStockLevel?: number;
  maximumStockLevel?: number;
  preferredSupplier?: string | { _id: string; name?: string; phone?: string };
  alternateSuppliers?: string[] | Array<{ _id: string; name?: string; phone?: string }>;
  images?: MaterialImage[];
  status?: MaterialStatus;
  isConsumable?: boolean;
  createdBy?: string;
  updatedBy?: string;

  // Virtual fields computed by the Material model — present on list/get responses
  availableStock?: number;
  isLowStock?: boolean;
  isOverStocked?: boolean;
}

/** Overall stock summary from GET /materials/summary */
export interface MaterialSummary {
  totalStockValue: number;
  totalStock: number;
  lowStockCount: number;
  totalMaterials: number;
}

/** A single StockLedger entry returned by GET /materials/:id/history */
export interface StockLedgerEntry extends BaseDocument {
  material: string;
  materialNameSnapshot?: string;
  unitSnapshot?: MaterialUnit;
  direction: 'in' | 'out';
  qty: number;
  balanceAfter: number;
  refType?: string;
  refId?: string;
  note?: string;
  customerName?: string;
  customerPhone?: string;
  installationId?: string;
}

/** Result of a stock adjustment (PATCH /materials/:id/stock) */
export interface StockAdjustResult {
  material: {
    id: string;
    name: string;
    currentStock: number;
  };
  adjustment: number;
  reason: string;
}

/** Result of an image upload (POST /materials/:id/image) */
export interface ImageUploadResult {
  imageUrl: string;
  images: MaterialImage[];
}

import type { BaseDocument } from './api';

export type PurchaseStatus = 'pending' | 'processing' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'partial' | 'completed';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'cheque' | 'upi' | 'online';
export type DeliveryMethod = 'pickup' | 'courier' | 'delivery' | 'self_delivery';

export interface PurchaseCourierDetails {
  courierName?: string;
  trackingId?: string;
  expectedDate?: string;
  deliveredDate?: string;
}

export interface PurchaseItem {
  material: string;
  materialCodeSnapshot: string;
  materialNameSnapshot: string;
  unitSnapshot: string;
  qty: number;
  unitCost: number;
  totalCost: number;
  discount?: number;
}

export interface PurchaseDocument extends BaseDocument {
  purchaseId: string;
  supplier: string;
  supplierNameSnapshot: string;
  purchaseDate: string;
  invoiceNumber?: string;
  purchaseOrderNumber?: string;
  totalAmount: number;
  discount?: number;
  tax?: number;
  grandTotal: number;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  deliveryMethod: DeliveryMethod;
  courierDetails?: PurchaseCourierDetails;
  items: PurchaseItem[];
  invoiceFileUrl?: string;
  notes?: string;
  idempotencyKey?: string;
  status?: PurchaseStatus;
  createdBy: string;
  updatedBy?: string;
}

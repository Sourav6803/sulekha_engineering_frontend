import type { BaseDocument } from './api';

export type SupplierBusinessType = 'manufacturer' | 'distributor' | 'wholesaler' | 'retailer' | 'importer';
export type SupplierPaymentTerms = 'advance' | 'credit_7_days' | 'credit_15_days' | 'credit_30_days' | 'credit_45_days';
export type SupplierStatus = 'active' | 'inactive' | 'suspended' | 'blacklisted';

export interface SupplierBankDetails {
  accountHolderName?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
}

export interface SupplierDocument extends BaseDocument {
  supplierId: string;
  name: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  website?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstNumber?: string;
  panNumber?: string;
  businessType?: SupplierBusinessType;
  categories?: string[];
  bankDetails?: SupplierBankDetails;
  paymentTerms?: SupplierPaymentTerms;
  creditLimit?: number;
  averageDeliveryDays?: number;
  qualityRating?: number;
  status?: SupplierStatus;
  notes?: string;
  createdBy?: string;
  updatedBy?: string;
}

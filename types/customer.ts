import type { BaseDocument } from './api';

export type RoofType = 'rcc_rooftop' | 'tin_shed' | 'ground_mount';
export type PreferredTimeSlot = 'morning' | 'afternoon' | 'evening' | 'anytime';
export type CustomerStatus = 'active' | 'inactive' | 'blocked' | 'pending_verification';

export interface CustomerDocument {
  _id: string;
  type:
    | 'aadhar'
    | 'voterId'
    | 'panCard'
    | 'passbookOrCheque'
    | 'electricBill'
    | 'landRecord'
    | 'sitePhotoBefore'
    | 'sitePhotoAfter'
    | 'loanApprovalLetter'
    | 'rtsFeasibilityReport'
    | 'feasibilityApproval'
    | 'agreement'
    | 'quotation'
    | 'dcrCertificate'
    | 'panelSerialNumber'
    /** The e-token the portal issues against the application. */
    | 'eToken'
    /** The acknowledgement receipt for the filed application. */
    | 'acknowledgement'
    /** The net-metering agreement / application copy. */
    | 'netMetering';
  url: string;
  fileName: string;
  fileSize?: number;
  fileType?: string;
  uploadedAt?: string;
}

export interface Customer extends BaseDocument {
  customerId: string;
  name: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  address: string;
  village?: string;
  block?: string;
  panchayat?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  systemSizeKW: number;
  roofType: RoofType;
  roofArea?: number;
  gstNumber?: string;
  panNumber?: string;
  preferredInstallationDate?: string;
  preferredTimeSlot?: PreferredTimeSlot;
  status?: CustomerStatus;
  notes?: string;
  referredBy?: string;
  documents?: CustomerDocument[];
  /**
   * One entry per installed panel, in the order it was recorded. Length follows
   * the system size — a 3 kW roof takes six 550 Wp panels — so it is a list and
   * not a fixed set of fields.
   */
  panelSerialNumbers?: string[];
  createdBy?: string;
  updatedBy?: string;
}

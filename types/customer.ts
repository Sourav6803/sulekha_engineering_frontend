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
  street?: string;
  block?: string;
  district?: string;
  panchayat?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  systemSizeKW: number;
  roofType: RoofType;
  roofArea?: number;
  gstNumber?: string;
  /** KYC identifier, 12 digits. Snapshotted onto the application. */
  aadhaarNumber?: string;
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
  /* ---- the site visit: what the application wizard used to collect ---- */
  /** Where the panels go; drives the mounting design. */
  siteType?: 'rcc_rooftop' | 'tin_shed' | 'high_rise_structure' | 'ground_mount' | null;
  siteNotes?: string;
  deal?: {
    proposalAmount?: number;
    quotedAmount?: number;
    intentionToProceed?: 'yes' | 'no' | 'undecided' | null;
  };
  loan?: {
    asked?: boolean;
    hasExistingLoan?: boolean | null;
    lenderName?: string;
    loanAmount?: number;
    outstandingAmount?: number;
    monthlyEmi?: number;
    consumerInformed?: boolean;
    remark?: string;
  };
  creditCheck?: {
    bank?: string;
    method?: 'consumer_self_check' | 'bank_portal' | 'agent_estimate' | 'other';
    score?: number | null;
    defaultOrWriteOff?: boolean;
    newToCredit?: boolean;
    status?: 'pass' | 'review' | 'fail' | 'not_checked';
    note?: string;
  };
  electricBill?: {
    consumerId?: string;
    installationNo?: string;
    verified?: boolean;
  };
  nameMatch?: {
    consumerName?: string;
    aadhaarName?: string;
    passbookName?: string;
    electricBillName?: string;
    verdict?: 'match' | 'near_match' | 'mismatch' | 'incomplete' | null;
  };
  /** The office's clearance of the intake — the gate for filing an application. */
  verification?: {
    status?: 'pending' | 'verified' | 'rejected';
    by?: string;
    at?: string;
    note?: string;
  };

  createdBy?: string;
  /** The field agent who collected this customer; agents only see their own. */
  ownerAgent?: string;
  updatedBy?: string;
}

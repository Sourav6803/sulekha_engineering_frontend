import type { Dispatch, SetStateAction } from 'react';
import type {
  ApplicationDocument,
  ApplicationIntention,
  ApplicationNameMatchInput,
  ApplicationSiteType,
  ApplicationUpdatePayload,
} from '@/types/application';

/** Props every step screen receives from the wizard shell. */
export interface WizardStepProps {
  form: WizardForm;
  setForm: Dispatch<SetStateAction<WizardForm>>;
  /** Dotted field path → the real message the API returned for it. */
  errors: Record<string, string>;
  disabled?: boolean;
}

/**
 * The wizard's own form state.
 *
 * Numbers and toggles live as strings / tri-state here because a field agent
 * types on a phone: "" means "not filled yet", which is genuinely different from
 * 0, and the loan question has three states (not asked / yes / no).
 */
export interface WizardForm {
  // ---- Step 1: consumer ----
  consumerName: string;
  phone: string;
  alternatePhone: string;
  aadhaarNumber: string;
  panNumber: string;
  email: string;

  // ---- Step 2: site & address ----
  address: {
    street: string;
    village: string;
    block: string;
    panchayat: string;
    district: string;
    landmark: string;
    pincode: string;
  };
  siteType: ApplicationSiteType | '';
  siteNotes: string;

  // ---- Step 3: deal & loan ----
  deal: {
    systemSizeKW: string;
    proposalAmount: string;
    quotedAmount: string;
    intentionToProceed: ApplicationIntention | '';
  };
  loan: {
    asked: boolean;
    hasExistingLoan: boolean | null;
    lenderName: string;
    outstandingAmount: string;
    monthlyEmi: string;
    consumerInformed: boolean;
    remark: string;
  };

  // ---- Step 5: electricity bill ----
  electricBill: {
    consumerId: string;
    installationNo: string;
  };

  // ---- Step 6: names ----
  names: {
    consumer: string;
    aadhaar: string;
    passbook: string;
    electricBill: string;
  };
}

export interface WizardStepMeta {
  id: string;
  /** Full label for the progress rail. */
  title: string;
  /** One-or-two-word label used on a narrow phone. */
  short: string;
}

export const WIZARD_STEPS: WizardStepMeta[] = [
  { id: 'consumer', title: 'Consumer', short: 'Consumer' },
  { id: 'site', title: 'Site & address', short: 'Site' },
  { id: 'deal', title: 'Deal & loan', short: 'Deal' },
  { id: 'documents', title: 'Documents', short: 'Docs' },
  { id: 'bill', title: 'Electricity bill', short: 'Bill' },
  { id: 'names', title: 'Names & submit', short: 'Submit' },
];

export const LAST_STEP = WIZARD_STEPS.length - 1;

export function emptyWizardForm(): WizardForm {
  return {
    consumerName: '',
    phone: '',
    alternatePhone: '',
    aadhaarNumber: '',
    panNumber: '',
    email: '',

    address: { street: '', village: '', block: '', panchayat: '', district: '', landmark: '', pincode: '' },
    siteType: '',
    siteNotes: '',

    deal: { systemSizeKW: '', proposalAmount: '', quotedAmount: '', intentionToProceed: '' },
    loan: {
      asked: false,
      hasExistingLoan: null,
      lenderName: '',
      outstandingAmount: '',
      monthlyEmi: '',
      consumerInformed: false,
      remark: '',
    },

    electricBill: { consumerId: '', installationNo: '' },

    names: { consumer: '', aadhaar: '', passbook: '', electricBill: '' },
  };
}

/** "" → null so an untouched optional field is a real "clear it" rather than "". */
export const trimOrNull = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

/** "" → null; a number the field agent typed → number (null when not a number). */
export const numberOrNull = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const numeric = Number(trimmed);
  return Number.isFinite(numeric) ? numeric : null;
};

/** Hydrate the form from a stored application (used after create / a refresh). */
export function formFromApplication(application: ApplicationDocument): WizardForm {
  const base = emptyWizardForm();

  return {
    ...base,
    consumerName: application.consumerName ?? '',
    phone: application.phone ?? '',
    alternatePhone: application.alternatePhone ?? '',
    aadhaarNumber: application.aadhaarNumber ?? '',
    panNumber: application.panNumber ?? '',
    email: application.email ?? '',

    address: {
      street: application.address?.street ?? '',
      village: application.address?.village ?? '',
      block: application.address?.block ?? '',
      panchayat: application.address?.panchayat ?? '',
      district: application.address?.district ?? '',
      landmark: application.address?.landmark ?? '',
      pincode: application.address?.pincode ?? '',
    },
    siteType: application.siteType ?? '',
    siteNotes: application.siteNotes ?? '',

    deal: {
      systemSizeKW: application.deal?.systemSizeKW != null ? String(application.deal.systemSizeKW) : '',
      proposalAmount: application.deal?.proposalAmount != null ? String(application.deal.proposalAmount) : '',
      quotedAmount: application.deal?.quotedAmount != null ? String(application.deal.quotedAmount) : '',
      intentionToProceed: application.deal?.intentionToProceed ?? '',
    },
    loan: {
      asked: Boolean(application.loan?.asked),
      hasExistingLoan: application.loan?.hasExistingLoan ?? null,
      lenderName: application.loan?.lenderName ?? '',
      outstandingAmount:
        application.loan?.outstandingAmount != null ? String(application.loan.outstandingAmount) : '',
      monthlyEmi: application.loan?.monthlyEmi != null ? String(application.loan.monthlyEmi) : '',
      consumerInformed: Boolean(application.loan?.consumerInformed),
      remark: application.loan?.remark ?? '',
    },

    electricBill: {
      consumerId: application.electricBill?.consumerId ?? '',
      installationNo: application.electricBill?.installationNo ?? '',
    },

    names: {
      consumer: application.nameMatch?.consumerName ?? application.consumerName ?? '',
      aadhaar: application.nameMatch?.aadhaarName ?? '',
      passbook: application.nameMatch?.passbookName ?? '',
      electricBill: application.nameMatch?.electricBillName ?? '',
    },
  };
}

/**
 * The PATCH body for one step.
 *
 * Only the slice that step owns is sent, so a half-typed field in another step
 * can never block progress — the server merges nested blocks field by field.
 * Returns null when the step owns nothing the PATCH endpoint accepts (documents
 * and the electricity bill have their own endpoints).
 */
export function buildStepPayload(step: number, form: WizardForm): ApplicationUpdatePayload | null {
  switch (step) {
    case 0:
      return {
        consumerName: form.consumerName.trim(),
        // `phone` has no allow('') on update — only send it when it is filled.
        ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
        alternatePhone: trimOrNull(form.alternatePhone),
        aadhaarNumber: trimOrNull(form.aadhaarNumber),
        panNumber: trimOrNull(form.panNumber),
        email: trimOrNull(form.email),
      };

    case 1:
      return {
        address: {
          street: form.address.street.trim(),
          village: form.address.village.trim(),
          block: form.address.block.trim(),
          panchayat: form.address.panchayat.trim(),
          district: form.address.district.trim(),
          landmark: form.address.landmark.trim(),
          pincode: form.address.pincode.trim(),
        },
        siteType: form.siteType || null,
        siteNotes: trimOrNull(form.siteNotes),
      };

    case 2:
      return {
        deal: {
          systemSizeKW: numberOrNull(form.deal.systemSizeKW),
          proposalAmount: numberOrNull(form.deal.proposalAmount),
          quotedAmount: numberOrNull(form.deal.quotedAmount),
          intentionToProceed: form.deal.intentionToProceed || null,
        },
        loan: {
          asked: form.loan.asked,
          hasExistingLoan: form.loan.hasExistingLoan,
          lenderName: trimOrNull(form.loan.lenderName),
          outstandingAmount: numberOrNull(form.loan.outstandingAmount),
          monthlyEmi: numberOrNull(form.loan.monthlyEmi),
          consumerInformed: form.loan.consumerInformed,
          remark: trimOrNull(form.loan.remark),
        },
      };

    default:
      return null;
  }
}

/**
 * The four names as the name-match endpoint wants them. The consumer name is
 * patched onto the application first when it was corrected here.
 */
export function buildNameMatchPayload(form: WizardForm): ApplicationNameMatchInput {
  return {
    consumerName: form.names.consumer.trim() || form.consumerName.trim(),
    aadhaarName: form.names.aadhaar.trim(),
    passbookName: form.names.passbook.trim(),
    electricBillName: form.names.electricBill.trim(),
  };
}

export default emptyWizardForm;

import type { CustomerDocument } from '@/types/customer';

export interface CatalogueItem {
  type: CustomerDocument['type'];
  label: string;
  /**
   * Required for a complete application file, as opposed to the documents
   * that arrive later in the process (eToken, net metering, DCR) or only
   * apply to some customers (GST, voter ID).
   */
  required: boolean;
}

/**
 * Every document type the customer screen tracks, in the order it shows them.
 *
 * One list, shared by the status grid and the application journey, and the
 * source of the "x of y" totals on both — so a type added here cannot leave a
 * count elsewhere showing the old number. It lives outside the components for
 * exactly that reason: when the grid owned the list, the journey had to
 * re-declare which documents it considered required, and the two drifted.
 */
export const DOCUMENT_CATALOGUE: readonly CatalogueItem[] = [
  { type: 'aadhar', label: 'Aadhar', required: true },
  { type: 'panCard', label: 'PAN', required: true },
  { type: 'passbookOrCheque', label: 'Passbook', required: true },
  { type: 'landRecord', label: 'Land Record', required: true },
  { type: 'sitePhotoBefore', label: 'Site Before', required: true },
  { type: 'sitePhotoAfter', label: 'Site After', required: true },
  { type: 'rtsFeasibilityReport', label: 'RTS Report', required: true },
  { type: 'feasibilityApproval', label: 'Feasibility', required: true },
  { type: 'voterId', label: 'Voter ID', required: false },
  { type: 'electricBill', label: 'Electric Bill', required: false },
  { type: 'loanApprovalLetter', label: 'Loan Letter', required: false },
  { type: 'agreement', label: 'Agreement', required: false },
  { type: 'quotation', label: 'Quotation', required: false },
  { type: 'dcrCertificate', label: 'DCR Cert', required: false },
  { type: 'panelSerialNumber', label: 'Panel Serial', required: false },
  { type: 'eToken', label: 'eToken', required: false },
  { type: 'acknowledgement', label: 'Acknowledgement', required: false },
  { type: 'netMetering', label: 'Net Metering', required: false },
];

/** The subset that has to be on file before an application is complete. */
export const REQUIRED_DOCUMENT_TYPES: readonly CustomerDocument['type'][] = DOCUMENT_CATALOGUE.filter(
  (item) => item.required,
).map((item) => item.type);

/**
 * The types backed by an actual file.
 *
 * A document record with no `url` is a placeholder, not a document — it exists
 * in the array but nothing can be opened from it. Both the documents card and
 * the application journey have to agree on that, or the journey reports every
 * required document as collected while the card beside it shows gaps. That is
 * why this lives here rather than being re-derived per component.
 */
export function uploadedDocumentTypes(
  documents: CustomerDocument[] | undefined,
): Set<CustomerDocument['type']> {
  return new Set(
    (documents ?? []).filter((doc) => Boolean(doc.url)).map((doc) => doc.type),
  );
}

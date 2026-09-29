import type {
  ApplicationChecklistDocument,
  ApplicationDocument,
  ApplicationSubmitIssue,
} from '@/types/application';

/**
 * Client mirror of the server's submit gate.
 *
 * backend/src/services/application.service.js → collectSubmitIssues() is the
 * authority: it is what a submit is actually judged against, and a 422 comes
 * back with its `issues` array. This is the same list computed from the local
 * draft, so the agent sees what is still missing *before* pressing Submit
 * instead of being bounced by the API.
 *
 * The document requirements are never hardcoded — they come from the checklist
 * the server served, so a kind that becomes optional (or a new mandatory one)
 * needs no client change.
 */
export function collectSubmitIssues(
  application: ApplicationDocument | null,
  checklistDocuments: ApplicationChecklistDocument[] | undefined
): ApplicationSubmitIssue[] {
  if (!application) return [];

  const issues: ApplicationSubmitIssue[] = [];
  const push = (field: string, message: string) => issues.push({ field, message });

  // ------------------------------------------------------------- consumer
  if (!application.consumerName) push('consumerName', 'Consumer name is required');
  if (!application.phone) push('phone', 'Mobile number is required');
  if (!application.aadhaarNumber) push('aadhaarNumber', 'Aadhaar number is required');
  if (!application.panNumber) push('panNumber', 'PAN number is required');

  // -------------------------------------------------------------- address
  (['street', 'village', 'block', 'panchayat', 'district'] as const).forEach((field) => {
    if (!application.address?.[field]) push(`address.${field}`, `Address: ${field} is required`);
  });
  if (!application.address?.landmark) push('address.landmark', 'Address: landmark is required');
  if (!application.address?.pincode) push('address.pincode', 'Address: pincode is required');

  // ------------------------------------------------------------------ site
  if (!application.siteType) {
    push('siteType', 'Where will the system be installed? Pick a site type.');
  }

  // ------------------------------------------------------------------ deal
  if (!application.deal?.systemSizeKW) push('deal.systemSizeKW', 'System size (kW) is required');
  if (application.deal?.proposalAmount == null) {
    push('deal.proposalAmount', 'Proposal amount is required');
  }

  // ------------------------------------------------------------------ loan
  if (!application.loan?.asked) {
    push('loan.asked', 'Confirm that you asked the consumer about an existing loan');
  }
  if (application.loan?.hasExistingLoan == null) {
    push('loan.hasExistingLoan', 'Record whether the consumer already has a loan running');
  }
  if (application.loan?.hasExistingLoan === true && !application.loan?.lenderName) {
    push('loan.lenderName', 'Name the lender / bank for the running loan');
  }

  // -------------------------------------------------------- electricity bill
  if (!application.electricBill?.consumerId) {
    push('electricBill.consumerId', 'Consumer ID from the electricity bill is required');
  }
  if (!application.electricBill?.installationNo) {
    push('electricBill.installationNo', 'Installation ID from the electricity bill is required');
  }
  if (!application.electricBill?.fileUrl) {
    push('electricBill.fileUrl', 'Attach the bill downloaded from the portal');
  }

  // ------------------------------------------------------------- documents
  const documents = application.documents ?? [];
  const present = new Set(documents.map((doc) => doc.kind));
  const requiredKinds = (checklistDocuments ?? []).filter((doc) => doc.required);

  requiredKinds.forEach((doc) => {
    if (!present.has(doc.kind)) {
      push(`documents.${doc.kind}`, `${doc.label} is missing`);
    }
  });

  // A document the clarity check (client or server) already flagged.
  documents.forEach((doc) => {
    if (doc.qualityCheck?.verdict === 'fail') {
      const label = (checklistDocuments ?? []).find((entry) => entry.kind === doc.kind)?.label ?? doc.kind;
      push(
        `documents.${doc._id}`,
        `${label} is not clear — ${doc.qualityCheck.reasons?.join(', ') || 'retake it'}`
      );
    }
  });

  // -------------------------------------------------- names across documents
  const verdict = application.nameMatch?.verdict;
  if (!verdict || verdict === 'incomplete') {
    push('nameMatch', 'Enter the name as printed on the Aadhaar, the passbook and the electricity bill');
  } else if (verdict === 'mismatch') {
    push('nameMatch', 'Name mismatch between the documents. They must all carry the same name.');
  }

  return issues;
}

/**
 * Which step a missing item belongs to, so the completeness panel can offer to
 * jump straight there instead of leaving the agent to hunt.
 */
export function stepIndexForIssue(field: string): number {
  if (
    field.startsWith('address.') ||
    field === 'siteType' ||
    field === 'siteNotes'
  ) {
    return 1;
  }
  if (field.startsWith('deal.') || field.startsWith('loan.')) return 2;
  if (field.startsWith('documents.')) return 3;
  if (field.startsWith('electricBill.')) return 4;
  if (field === 'nameMatch') return 5;
  return 0;
}

export default collectSubmitIssues;

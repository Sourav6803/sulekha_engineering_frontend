'use client';

import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

interface DeleteQuotationDialogProps {
  open: boolean;
  quotationNo: string;
  customerName: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * The single confirmation used by BOTH entry points (the quotation sheet and the
 * Quotation SL Number register), so the wording can never drift between them.
 *
 * The number is not necessarily freed: only when the deleted quotation held the
 * highest number of its financial year does the next one reuse it. The server
 * decides that and reports it back, which the caller shows as a toast.
 */
export function DeleteQuotationDialog({
  open,
  quotationNo,
  customerName,
  busy = false,
  onConfirm,
  onCancel,
}: DeleteQuotationDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      title="Delete quotation"
      message={[
        `Quotation ${quotationNo} — ${customerName} will be removed from BOTH the Quotation list and the Quotation SL Number register.`,
        'If it holds the highest number of its financial year, that number becomes free and the next quotation will reuse it; otherwise the gap stays.',
        'This is a soft delete, so it can be restored later.',
      ].join('\n\n')}
      confirmLabel="Delete quotation"
      busy={busy}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}

export default DeleteQuotationDialog;

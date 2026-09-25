'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Download, FileText, Loader2, Pencil, Printer, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { QuotationStatusBadge } from './QuotationStatusBadge';
import { QuotationPreviewFrame } from './QuotationPreviewFrame';
import { formatDocumentAmount, structureLabel } from './quotationDisplay';
import { quotationsApi } from '@/lib/api/quotations.api';
import { downloadBlob } from '@/lib/downloadBlob';
import { handleApiError } from '@/lib/errors/handleApiError';
import { formatDateShort, formatDateTime, formatINR } from '@/lib/format';
import type { QuotationDocument, QuotationStatus } from '@/types/quotation';

interface QuotationDetailViewProps {
  quotation: QuotationDocument;
  onEdit?: () => void;
  onDelete?: () => void;
  onStatusChange?: (status: QuotationStatus) => void;
  onRefresh?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canDownload?: boolean;
}

const STATUS_OPTIONS: QuotationStatus[] = ['draft', 'sent', 'accepted', 'rejected', 'expired'];

export function QuotationDetailView({
  quotation,
  onEdit,
  onDelete,
  onStatusChange,
  onRefresh,
  canEdit = false,
  canDelete = false,
  canDownload = false,
}: QuotationDetailViewProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const attachments = quotation.attachments ?? [];
  const revisions = quotation.revisions ?? [];
  const hasLineAmounts = (quotation.items ?? []).some(
    (item) => item.amount !== null && item.amount !== undefined
  );

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      await quotationsApi.uploadAttachment(quotation._id, file, 'original_manual');
      toast.success('File attached', { description: file.name });
      onRefresh?.();
    } catch (err) {
      toast.error('Could not attach the file', { description: handleApiError(err) });
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const handleRemoveAttachment = async (attachmentId: string) => {
    try {
      await quotationsApi.removeAttachment(quotation._id, attachmentId);
      toast.success('Attachment removed');
      onRefresh?.();
    } catch (err) {
      toast.error('Could not remove the attachment', { description: handleApiError(err) });
    }
  };

  const handleDownload = async () => {
    try {
      const buffer = await quotationsApi.downloadPdf(quotation._id);
      downloadBlob(
        buffer,
        `${quotation.quotationNo.replace(/[/\\]/g, '-')}-${quotation.customerName}`.replace(/[^\w.\- ]+/g, '') + '.pdf'
      );
    } catch (err) {
      toast.error('Could not download the PDF', { description: handleApiError(err) });
    }
  };

  const handlePrint = async () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Allow pop-ups to print the quotation');
      return;
    }
    printWindow.document.write('<p style="font-family:Arial;padding:24px">Preparing the quotation…</p>');
    try {
      const html = await quotationsApi.printHtml(quotation._id);
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
    } catch (err) {
      printWindow.close();
      toast.error('Could not open the print view', { description: handleApiError(err) });
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="surface-card space-y-4 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-[var(--foreground)]">{quotation.quotationNo}</h2>
              <QuotationStatusBadge status={quotation.status} />
              {quotation.isHistorical && (
                <span className="badge-pill bg-[var(--surface-muted)] text-[var(--muted)]">
                  imported from the old register
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-[var(--secondary)]">
              {quotation.customerName}
              {quotation.consumerId ? ` · Consumer ID ${quotation.consumerId}` : ''}
            </p>
            <p className="text-xs text-[var(--muted)]">
              {quotation.financialYear} · {quotation.schemeCode}
              {quotation.schemeLabel ? ` — ${quotation.schemeLabel}` : ''}
              {quotation.isActive === false ? ' · deleted' : ''}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="neutral-button inline-flex items-center gap-1.5 px-3 py-1.5 text-sm"
            >
              <Printer className="h-4 w-4" /> Print
            </button>
            {canDownload && (
              <button
                type="button"
                onClick={handleDownload}
                className="neutral-button inline-flex items-center gap-1.5 px-3 py-1.5 text-sm"
              >
                <Download className="h-4 w-4" /> PDF
              </button>
            )}
            {canEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="brand-button inline-flex items-center gap-1.5 px-3 py-1.5 text-sm"
              >
                <Pencil className="h-4 w-4" /> Edit
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-soft)] px-3 py-1.5 text-sm text-[var(--error)] transition-colors hover:border-[var(--error)]"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            )}
          </div>
        </div>

        {canEdit && onStatusChange && quotation.isActive !== false && (
          <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border-soft)] pt-3">
            <span className="form-label mb-0">Status</span>
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => onStatusChange(status)}
                disabled={quotation.status === status}
                className={`rounded-full px-3 py-1 text-xs capitalize transition-colors ${
                  quotation.status === status
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--surface-muted)] text-[var(--secondary)] hover:text-[var(--foreground)]'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface-card space-y-2 p-4">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Customer</h3>
          <InfoRow label="Name" value={quotation.customerName} />
          <InfoRow label="Consumer ID" value={quotation.consumerId || '—'} />
          <InfoRow label="Mobile" value={quotation.phoneNo || '—'} />
          <InfoRow label="Address" value={quotation.customerAddress || quotation.addressLine1 || '—'} />
        </div>

        <div className="surface-card space-y-2 p-4">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">System</h3>
          <InfoRow label="Size" value={quotation.systemSizeKW ? `${quotation.systemSizeKW} kW` : '—'} />
          <InfoRow
            label="Panels"
            value={quotation.panelQty ? `${quotation.panelQty} × ${quotation.panelWp ?? '—'} Wp` : '—'}
          />
          <InfoRow label="Inverter" value={quotation.inverterCapacityKW ? `${quotation.inverterCapacityKW} kW` : '—'} />
          <InfoRow label="Structure" value={structureLabel(quotation.structureType)} />
        </div>

        <div className="surface-card space-y-2 p-4">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Dates and amount</h3>
          <InfoRow label="Quotation date" value={formatDateShort(quotation.issueDate)} />
          <InfoRow label="Valid until" value={formatDateShort(quotation.validUntil)} />
          <InfoRow
            label="Amount"
            value={
              quotation.amount === null || quotation.amount === undefined
                ? 'not recorded'
                : `₹${formatINR(quotation.amount)}`
            }
          />
          <InfoRow
            label="On the document"
            value={
              quotation.amount === null || quotation.amount === undefined
                ? '—'
                : formatDocumentAmount(quotation.amount)
            }
          />
          {quotation.amountInWords ? (
            <p className="text-xs italic text-[var(--muted)]">{quotation.amountInWords}</p>
          ) : null}
        </div>
      </div>

      {quotation.amount === null || quotation.amount === undefined ? (
        <p className="rounded-lg bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--secondary)]">
          This is a register-only record: it was imported from the old sheet and has no BOQ or amount yet.
          {canEdit ? ' Use Edit to complete it — the number stays the same.' : ''}
        </p>
      ) : null}

      {/* BOQ */}
      <div className="surface-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-4 py-3">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Bill of quantities</h3>
          <span className="text-xs text-[var(--muted)]">
            {quotation.items?.length ?? 0} line(s)
            {hasLineAmounts ? ' · per-line amounts' : ' · one total amount'}
          </span>
        </div>
        {quotation.items?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-[var(--surface-muted)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-2">Description</th>
                  <th className="px-4 py-2">Brand / model</th>
                  <th className="px-4 py-2 text-right">Qty</th>
                  <th className="px-4 py-2">Unit</th>
                  {hasLineAmounts && <th className="px-4 py-2 text-right">Amount</th>}
                </tr>
              </thead>
              <tbody>
                {quotation.items.map((item, index) => (
                  <tr key={item._id ?? `item-${index}`} className="border-t border-[var(--border-soft)]">
                    <td className="px-4 py-2 text-[var(--foreground)]">{item.description}</td>
                    <td className="px-4 py-2 text-[var(--secondary)]">{item.brandModel || '—'}</td>
                    <td className="px-4 py-2 text-right text-[var(--foreground)]">{item.qty}</td>
                    <td className="px-4 py-2 text-[var(--secondary)]">{item.unit ?? ''}</td>
                    {hasLineAmounts && (
                      <td className="px-4 py-2 text-right text-[var(--foreground)]">{formatINR(item.amount)}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-4 py-6 text-center text-sm text-[var(--muted)]">
            No BOQ lines recorded for this quotation.
          </p>
        )}
      </div>

      {/* Terms */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface-card space-y-2 p-4">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Terms &amp; condition</h3>
          {quotation.terms?.length ? (
            <ul className="space-y-1.5 text-sm text-[var(--secondary)]">
              {quotation.terms.map((term, index) => (
                <li key={`term-${index}`}>{term.text}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--muted)]">Uses the company defaults on the document.</p>
          )}
        </div>
        <div className="surface-card space-y-2 p-4">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Payment terms</h3>
          {quotation.paymentTerms?.length ? (
            <ul className="space-y-1.5 text-sm text-[var(--secondary)]">
              {quotation.paymentTerms.map((term, index) => (
                <li key={`payment-${index}`}>{term.text}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--muted)]">Uses the company defaults on the document.</p>
          )}
          {quotation.systemOverview ? (
            <>
              <h3 className="pt-2 text-sm font-semibold text-[var(--foreground)]">System overview</h3>
              <p className="text-sm text-[var(--secondary)]">{quotation.systemOverview}</p>
            </>
          ) : null}
        </div>
      </div>

      {/* Attachments */}
      <div className="surface-card space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            Attachments <span className="text-[var(--muted)]">({attachments.length})</span>
          </h3>
          {canEdit && (
            <>
              <input
                ref={fileInput}
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleUpload(file);
                }}
              />
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
                className="neutral-button inline-flex items-center gap-1.5 px-3 py-1.5 text-sm disabled:opacity-60"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Attach the manual PDF
              </button>
            </>
          )}
        </div>

        {attachments.length ? (
          <ul className="divide-y divide-[var(--border-soft)]">
            {attachments.map((attachment) => (
              <li key={attachment._id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-[var(--secondary)]" />
                  <div className="min-w-0">
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-sm text-[var(--foreground)] underline-offset-2 hover:underline"
                    >
                      {attachment.fileName || 'attachment'}
                    </a>
                    <p className="text-xs text-[var(--muted)]">
                      {attachment.kind.replace('_', ' ')} · {formatDateTime(attachment.uploadedAt)}
                    </p>
                  </div>
                </div>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => void handleRemoveAttachment(attachment._id)}
                    className="rounded p-1.5 text-[var(--secondary)] transition-colors hover:text-[var(--error)]"
                    title="Remove attachment"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--muted)]">
            No files attached. Scan the signed copy and attach it here.
          </p>
        )}
      </div>

      {/* History */}
      {revisions.length > 0 && (
        <div className="surface-card space-y-2 p-4">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">History</h3>
          <ul className="space-y-1.5 text-sm text-[var(--secondary)]">
            {revisions
              .slice()
              .reverse()
              .map((revision) => (
                <li key={revision._id} className="flex flex-wrap items-baseline gap-2">
                  <span className="text-xs text-[var(--muted)]">{formatDateTime(revision.at)}</span>
                  <span className="capitalize">{revision.action.replace('_', ' ')}</span>
                  {revision.changedFields?.length ? (
                    <span className="text-xs text-[var(--muted)]">({revision.changedFields.join(', ')})</span>
                  ) : null}
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Preview */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Document</h3>
        <QuotationPreviewFrame
          quotationId={quotation._id}
          quotationNo={quotation.quotationNo}
          customerName={quotation.customerName}
          canDownload={canDownload}
          hideToolbar
        />
      </div>

      <p className="text-xs text-[var(--muted)]">
        <Link href="/quotations/serial" className="underline-offset-2 hover:underline">
          See this quotation in the SL number register
        </Link>
      </p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-[var(--muted)]">{label}</span>
      <span className="text-right text-[var(--foreground)]">{value}</span>
    </div>
  );
}

export default QuotationDetailView;

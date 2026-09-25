'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Download, Loader2, Printer, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { quotationsApi } from '@/lib/api/quotations.api';
import { downloadBlob } from '@/lib/downloadBlob';
import { handleApiError } from '@/lib/errors/handleApiError';

interface QuotationPreviewFrameProps {
  quotationId: string;
  quotationNo: string;
  customerName: string;
  canDownload?: boolean;
  /** Hide the toolbar (e.g. when the page already shows its own buttons). */
  hideToolbar?: boolean;
}

const pdfFileName = (quotationNo: string, customerName: string) =>
  `${quotationNo.replace(/[/\\]/g, '-')}-${customerName}`.replace(/[^\w.\- ]+/g, '').slice(0, 120) + '.pdf';

/**
 * The A4 preview.
 *
 * The PDF comes from the same backend template that produces the printed copy,
 * so the preview, the download and the print are always identical.
 *
 * The print window is opened synchronously on click (before any await) because
 * browsers block popups opened after an async gap.
 */
export function QuotationPreviewFrame({
  quotationId,
  quotationNo,
  customerName,
  canDownload = false,
  hideToolbar = false,
}: QuotationPreviewFrameProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    let objectUrl: string | null = null;

    try {
      const buffer = await quotationsApi.downloadPdf(quotationId, true);
      objectUrl = URL.createObjectURL(new Blob([buffer], { type: 'application/pdf' }));
      setUrl(objectUrl);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }

    return objectUrl;
  }, [quotationId]);

  useEffect(() => {
    let revoked: string | null = null;

    void load().then((objectUrl) => {
      revoked = objectUrl;
    });

    return () => {
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [load]);

  const handleDownload = async () => {
    setBusy(true);
    try {
      const buffer = await quotationsApi.downloadPdf(quotationId);
      downloadBlob(buffer, pdfFileName(quotationNo, customerName));
    } catch (err) {
      toast.error('Could not download the PDF', { description: handleApiError(err) });
    } finally {
      setBusy(false);
    }
  };

  const handlePrint = async () => {
    // Open first: an async gap would let the popup blocker stop this.
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Allow pop-ups to print the quotation');
      return;
    }

    printWindow.document.write(
      '<p style="font-family:Arial;padding:24px">Preparing the quotation…</p>'
    );

    try {
      const html = await quotationsApi.printHtml(quotationId);
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
    <div className="space-y-3">
      {!hideToolbar && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-[var(--muted)]">
            A4 preview · exactly what prints and downloads (one page)
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="neutral-button inline-flex items-center gap-1.5 px-3 py-1.5 text-sm"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
            {canDownload && (
              <button
                type="button"
                onClick={handleDownload}
                disabled={busy}
                className="brand-button inline-flex items-center gap-1.5 px-3 py-1.5 text-sm disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Download PDF
              </button>
            )}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex h-[420px] items-center justify-center rounded-xl border border-[var(--border-soft)] bg-white">
          <span className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Rendering the document…
          </span>
        </div>
      )}

      {error && !loading && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-[var(--border-soft)] bg-white px-4 py-10 text-center">
          <AlertTriangle className="h-6 w-6 text-[var(--warning)]" />
          <p className="text-sm text-[var(--error)]">{error}</p>
          <button
            type="button"
            onClick={() => void load().then(() => setUrl((current) => current))}
            className="neutral-button inline-flex items-center gap-1.5 px-3 py-1.5 text-sm"
          >
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
        </div>
      )}

      {url && !loading && !error && (
        <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-white shadow-sm">
          <iframe src={url} title={`Quotation ${quotationNo}`} className="h-[900px] w-full" />
        </div>
      )}
    </div>
  );
}

export default QuotationPreviewFrame;

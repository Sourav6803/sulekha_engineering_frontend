'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Download, Info, Loader2, Printer, RefreshCw } from 'lucide-react';
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
 * The PDF and the print view come from the same backend template, so what is
 * previewed, downloaded and printed is always the same document. The difference is
 * who lays it out: the PDF is printed by headless Chrome on the server, the print
 * view by the reader's own browser.
 *
 * That difference is why this falls back rather than failing. A server without a
 * browser — a host where Chrome could not be installed — answers the PDF route with
 * 503 `PDF_RENDERER_UNAVAILABLE`, and an empty box would be a worse answer than the
 * markup the backend can still produce.
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
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [printHtml, setPrintHtml] = useState<string | null>(null);
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const objectUrlRef = useRef<string | null>(null);

  const releaseObjectUrl = useCallback(() => {
    if (!objectUrlRef.current) return;
    URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setFallbackReason(null);

    try {
      const buffer = await quotationsApi.downloadPdf(quotationId, true);
      const objectUrl = URL.createObjectURL(new Blob([buffer], { type: 'application/pdf' }));

      // Replace any previous blob before this one is shown, so a retry cannot
      // leak the url it supersedes.
      releaseObjectUrl();
      objectUrlRef.current = objectUrl;

      setPdfUrl(objectUrl);
      setPrintHtml(null);
    } catch (pdfError) {
      releaseObjectUrl();
      setPdfUrl(null);

      try {
        const markup = await quotationsApi.printHtml(quotationId, false);
        setPrintHtml(markup);
        setFallbackReason(handleApiError(pdfError));
      } catch {
        setPrintHtml(null);
        setError(handleApiError(pdfError));
      }
    } finally {
      setLoading(false);
    }
  }, [quotationId, releaseObjectUrl]);

  useEffect(() => {
    void load();
  }, [load]);

  // Revoke on unmount, and when a retry swaps in a new blob.
  useEffect(() => releaseObjectUrl, [releaseObjectUrl]);

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
            A4 preview · exactly what prints and downloads
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

      {fallbackReason && !loading && !error && (
        <div className="flex items-start gap-2 rounded-lg border border-[var(--border-soft)] bg-white px-3 py-2 text-xs text-[var(--muted)]">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--warning)]" />
          <span>
            Showing the print view — the PDF could not be rendered on this server. {fallbackReason}{' '}
            Printing is unaffected.
          </span>
        </div>
      )}

      {error && !loading && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-[var(--border-soft)] bg-white px-4 py-10 text-center">
          <AlertTriangle className="h-6 w-6 text-[var(--warning)]" />
          <p className="text-sm text-[var(--error)]">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="neutral-button inline-flex items-center gap-1.5 px-3 py-1.5 text-sm"
          >
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
        </div>
      )}

      {!loading && !error && pdfUrl && (
        <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-white shadow-sm">
          <iframe src={pdfUrl} title={`Quotation ${quotationNo}`} className="h-[900px] w-full" />
        </div>
      )}

      {!loading && !error && !pdfUrl && printHtml && (
        <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-white shadow-sm">
          <iframe
            srcDoc={printHtml}
            title={`Quotation ${quotationNo}`}
            className="h-[900px] w-full"
          />
        </div>
      )}
    </div>
  );
}

export default QuotationPreviewFrame;

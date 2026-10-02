'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Download, Info, Loader2, Printer, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { quotationsApi } from '@/lib/api/quotations.api';
import { downloadBlob } from '@/lib/downloadBlob';
import { handleApiError } from '@/lib/errors/handleApiError';
import { PdfCanvasViewer } from './PdfCanvasViewer';

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
 * One attempt at showing the document, resolved before it is committed to state.
 *
 * Fetching and committing are kept apart on purpose. Committing all four outcomes
 * in one go cannot leave the box in a state that was never true — no frame where
 * the loader has gone but nothing has replaced it — and it keeps the effect free
 * of state updates, which is what an effect that starts a request should be.
 */
type PdfAttempt =
  | { kind: 'pdf'; data: ArrayBuffer }
  | { kind: 'print'; html: string; reason: string }
  | { kind: 'error'; message: string };

/**
 * The print view, as an attempt.
 *
 * Shared by the two ways the PDF can fail: the server refusing the PDF route (503
 * when it has no browser to print with), and this device being unable to draw the
 * bytes. Both leave the document readable, because the print view is the same
 * template as HTML.
 */
const printViewAttempt = async (quotationId: string, reason: unknown): Promise<PdfAttempt> => {
  try {
    const html = await quotationsApi.printHtml(quotationId, false);
    return { kind: 'print', html, reason: handleApiError(reason) };
  } catch {
    return { kind: 'error', message: handleApiError(reason) };
  }
};

/**
 * The A4 preview.
 *
 * The PDF and the print view come from the same backend template, so what is
 * previewed, downloaded and printed is always the same document. The difference is
 * who lays it out: the PDF is printed by headless Chrome on the server, the print
 * view by the reader's own browser.
 *
 * The PDF is drawn onto canvases by `PdfCanvasViewer`, not handed to the browser in
 * a frame. Desktop browsers have a built-in PDF viewer and would show a frame
 * happily, which is why the frame went unnoticed for so long; Android's Chrome has
 * none, so a frame there shows only its own file-name-and-Open-button placeholder.
 * That component carries the full reasoning.
 *
 * That difference is why this falls back rather than failing, in two places. A
 * server without a browser — a host where Chrome could not be installed — answers
 * the PDF route with 503 `PDF_RENDERER_UNAVAILABLE`; and a device that cannot run
 * the renderer fails while drawing. Either way the print view is shown, because an
 * empty box would be a worse answer than the markup the backend can still produce.
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
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [printHtml, setPrintHtml] = useState<string | null>(null);
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Apply one finished attempt. Every state the box depends on moves together. */
  const commit = useCallback((attempt: PdfAttempt) => {
    setPdfData(attempt.kind === 'pdf' ? attempt.data : null);
    setPrintHtml(attempt.kind === 'print' ? attempt.html : null);
    setFallbackReason(attempt.kind === 'print' ? attempt.reason : null);
    setError(attempt.kind === 'error' ? attempt.message : null);
    setLoading(false);
  }, []);

  /** Fetch the PDF, falling back to the print view if the server will not print it. */
  const request = useCallback(async (): Promise<PdfAttempt> => {
    try {
      const data = await quotationsApi.downloadPdf(quotationId, true);
      return { kind: 'pdf', data };
    } catch (pdfError) {
      return printViewAttempt(quotationId, pdfError);
    }
  }, [quotationId]);

  /**
   * The document could not be drawn on this device. Swap in the print view, which
   * clears `pdfData` and so takes the viewer out of the render below.
   */
  const showPrintView = useCallback(
    async (reason: unknown) => commit(await printViewAttempt(quotationId, reason)),
    [quotationId, commit]
  );

  useEffect(() => {
    let cancelled = false;

    // The state update lives after the `await`, not in the effect body: an effect
    // that sets state as it runs causes a cascading render.
    void (async () => {
      const attempt = await request();
      if (!cancelled) commit(attempt);
    })();

    return () => {
      cancelled = true;
    };
  }, [request, commit]);

  /**
   * Try again. It restores the loading state first, which is safe here because a
   * click is not an effect — and it is the reason the effect above does not have to.
   */
  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setFallbackReason(null);
    setPrintHtml(null);
    setPdfData(null);
    void (async () => commit(await request()))();
  }, [request, commit]);

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
            Showing the print view instead of the PDF. {fallbackReason} Printing is unaffected.
          </span>
        </div>
      )}

      {error && !loading && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-[var(--border-soft)] bg-white px-4 py-10 text-center">
          <AlertTriangle className="h-6 w-6 text-[var(--warning)]" />
          <p className="text-sm text-[var(--error)]">{error}</p>
          <button
            type="button"
            onClick={retry}
            className="neutral-button inline-flex items-center gap-1.5 px-3 py-1.5 text-sm"
          >
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
        </div>
      )}

      {!loading && !error && pdfData && (
        <PdfCanvasViewer data={pdfData} onFailure={showPrintView} />
      )}

      {!loading && !error && !pdfData && printHtml && (
        <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-white shadow-sm">
          <iframe
            srcDoc={printHtml}
            title={`Quotation ${quotationNo}`}
            // Shorter on a phone: the A4 sheet scrolls inside rather than pushing
            // the rest of the page a screen and a half further down.
            className="h-[70vh] w-full sm:h-[900px]"
          />
        </div>
      )}
    </div>
  );
}

export default QuotationPreviewFrame;

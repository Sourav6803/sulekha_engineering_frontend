'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import { loadPdfjs } from '@/lib/pdf/pdfjs';

interface PdfCanvasViewerProps {
  /** The PDF bytes. */
  data: ArrayBuffer;
  /**
   * Called when the document cannot be drawn, so the caller can fall back to the
   * print view. Reaching this is not an error the reader sees: it means this
   * device could not run the renderer.
   */
  onFailure?: (reason: unknown) => void;
}

/** Wait for a resize to settle before redrawing, so a drag does not redraw every frame. */
const RESIZE_DEBOUNCE_MS = 150;
/** Space held for a page that has not reported its size yet. */
const PENDING_PAGE_HEIGHT = 260;

/**
 * The quotation, drawn page by page onto canvases.
 *
 * This exists because the obvious approach does not work on a phone. Handing the
 * PDF to the browser — an iframe, an embed, an object — relies on a built-in PDF
 * viewer, and Android's Chrome has none at all: it answers with its own "the file
 * name and an Open button" placeholder, and the button does nothing. Mobile Safari
 * cannot show a `blob:` URL in a frame either. So the document is rasterised here
 * instead, which every browser can do.
 *
 * The layout is deliberately plain: one column, one canvas per page, no zoom. A
 * quotation is one page, and every control added on top of that is a control that
 * has to work on a touch screen.
 */
export function PdfCanvasViewer({ data, onFailure }: PdfCanvasViewerProps) {
  const measureRef = useRef<HTMLDivElement | null>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [width, setWidth] = useState(0);
  const [failed, setFailed] = useState(false);

  /*
   * The callback is held in a ref rather than depended on. It comes from the
   * parent, and a new identity there would restart the load effect and the whole
   * document with it.
   */
  const failureRef = useRef(onFailure);
  useEffect(() => {
    failureRef.current = onFailure;
  }, [onFailure]);

  const fail = useCallback((reason: unknown) => {
    setFailed(true);
    failureRef.current?.(reason);
  }, []);

  // Load once per set of bytes.
  useEffect(() => {
    let cancelled = false;
    let task: PDFDocumentLoadingTask | null = null;

    void (async () => {
      try {
        const pdfjs = await loadPdfjs();
        if (cancelled) return;

        /*
         * Cleared after the `await`, not in the effect body: an effect that sets
         * state as it runs causes a cascading render, and both of these are either
         * a no-op on mount or a reset for bytes that have been replaced. Being
         * here rather than in the caller means the component is correct on its
         * own, whatever it is handed.
         */
        setPdf(null);
        setFailed(false);

        /*
         * The bytes are copied, not handed over. pdf.js transfers the buffer to
         * its worker, which detaches the caller's — so a second load of the same
         * document (a retry, or React running the effect twice) would otherwise
         * fail on a buffer that the first had emptied.
         */
        task = pdfjs.getDocument({ data: new Uint8Array(data.slice(0)) });
        const opened: PDFDocumentProxy = await task.promise;

        if (!cancelled) setPdf(opened);
      } catch (error) {
        if (!cancelled) fail(error);
      }
    })();

    return () => {
      cancelled = true;
      /*
       * Destroying the loading task tears the document and its worker down, and
       * called while a load is still in flight it is the supported way to abandon
       * it — which is what an unmount partway through needs.
       */
      void task?.destroy();
    };
  }, [data, fail]);

  /*
   * The rendering width is the column, measured rather than assumed, so a phone
   * and a desktop both get a page that fits. Measured on the inner element, which
   * carries no padding: `clientWidth` excludes the scrollbar.
   */
  useEffect(() => {
    const element = measureRef.current;
    if (!element) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const scheduleMeasure = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setWidth(Math.floor(element.clientWidth)), RESIZE_DEBOUNCE_MS);
    };

    scheduleMeasure();
    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(element);

    return () => {
      if (timer) clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  // The parent swaps in the print view as soon as it hears about the failure.
  if (failed) return null;

  return (
    <div className="max-h-[80vh] overflow-auto rounded-xl border border-[var(--border-soft)] bg-[var(--surface-muted)] p-2 sm:p-4">
      <div ref={measureRef} className="flex flex-col items-center gap-2 sm:gap-4">
        {!(pdf && width > 0) && (
          <span
            className="flex items-center gap-2 text-sm text-[var(--muted)]"
            style={{ height: PENDING_PAGE_HEIGHT }}
          >
            <Loader2 className="h-4 w-4 animate-spin" /> Rendering the document…
          </span>
        )}

        {pdf &&
          width > 0 &&
          Array.from({ length: pdf.numPages }, (_, index) => (
            <PdfPageCanvas
              key={index + 1}
              pdf={pdf}
              pageNumber={index + 1}
              width={width}
              onError={fail}
            />
          ))}
      </div>
    </div>
  );
}

interface PdfPageCanvasProps {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  /** Width in CSS pixels the page should fill. */
  width: number;
  onError: (reason: unknown) => void;
}

/** One page. It owns its canvas and its render task, so cleaning up is local. */
function PdfPageCanvas({ pdf, pageNumber, width, onError }: PdfPageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawn, setDrawn] = useState(false);

  const errorRef = useRef(onError);
  useEffect(() => {
    errorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    let cancelled = false;
    let task: RenderTask | null = null;

    void (async () => {
      const page = await pdf.getPage(pageNumber);
      if (cancelled) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      /*
       * Sizing, and why it is done in two places.
       *
       * The viewport is asked for in CSS pixels so the page fills the column.
       * pdf.js then multiplies by `devicePixelRatio` itself when it sizes the
       * bitmap (OutputScale reads `globalThis.devicePixelRatio`), which is what
       * makes the page sharp on a phone without any help from here — so the ratio
       * is read with the same expression, to agree with it rather than fight it.
       *
       * The CSS size is then pinned explicitly. The bitmap is denser than the
       * space it occupies, and without this the canvas would lay itself out at its
       * intrinsic size and overflow the column.
       */
      const unscaled = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: width / unscaled.width });
      const ratio = window.devicePixelRatio || 1;

      const cssWidth = Math.round(viewport.width);
      const cssHeight = Math.round(viewport.height);

      canvas.width = Math.ceil(cssWidth * ratio);
      canvas.height = Math.ceil(cssHeight * ratio);
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;

      task = page.render({ canvas, viewport });
      await task.promise;

      if (!cancelled) setDrawn(true);
    })().catch((error: unknown) => {
      // Cancelling is how a resize interrupts a render in flight — not a failure.
      if (!cancelled) errorRef.current(error);
    });

    return () => {
      cancelled = true;
      try {
        task?.cancel();
      } catch {
        // A render that already finished cannot be cancelled, and does not need to be.
      }
    };
  }, [pdf, pageNumber, width]);

  return (
    <div
      className="relative overflow-hidden rounded-[var(--radius-sm)] bg-white shadow-sm ring-1 ring-black/5"
      style={drawn ? undefined : { width: '100%', height: PENDING_PAGE_HEIGHT }}
    >
      <canvas ref={canvasRef} className="block" />
      {!drawn && (
        <span className="absolute inset-0 flex items-center justify-center gap-2 text-xs text-[var(--muted-soft)]">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Page {pageNumber}
        </span>
      )}
    </div>
  );
}

export default PdfCanvasViewer;

/**
 * PDF.js, loaded once, in the browser only.
 *
 * Two things here are deliberate, and both are about where the module is allowed
 * to run.
 *
 * It is imported dynamically rather than at the top of a module. The component
 * that draws the preview is a client component, and client components are still
 * rendered on the server for the first paint — so a static import would evaluate
 * pdf.js in Node, where it expects a DOM. A dynamic import inside an effect can
 * only ever run in the browser.
 *
 * The worker is fetched from `public/` at a fixed path rather than resolved
 * through the bundler. `new URL('pdfjs-dist/...', import.meta.url)` depends on how
 * each bundler treats a package-internal specifier, and getting it wrong fails at
 * runtime rather than at build time. A copied file has one known address. The
 * proxy never has to authorise it: its matcher skips any path containing a dot, so
 * `/pdf/pdf.worker.min.mjs` is not behind the auth check.
 */
type PdfjsModule = typeof import('pdfjs-dist');

/** Must match the copy target in scripts/copy-pdf-worker.mjs. */
export const PDF_WORKER_URL = '/pdf/pdf.worker.min.mjs';

let pending: Promise<PdfjsModule> | null = null;

export const loadPdfjs = (): Promise<PdfjsModule> => {
  if (!pending) {
    pending = import('pdfjs-dist')
      .then((pdfjs) => {
        pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
        return pdfjs;
      })
      .catch((error: unknown) => {
        // Do not hold on to a failure — a later attempt should be able to retry.
        pending = null;
        throw error;
      });
  }

  return pending;
};

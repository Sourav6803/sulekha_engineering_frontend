/**
 * Refreshes the copy of the PDF.js worker that the app serves from public/.
 *
 * PDF.js parses the document in a worker, and that worker cannot be bundled into
 * the page: the main thread loads it by URL at runtime. Resolving that URL through
 * the bundler depends on how each bundler treats a package-internal specifier, so
 * the file is copied to a fixed address instead and the viewer asks for
 * /pdf/pdf.worker.min.mjs.
 *
 * The copy is committed, so a build that does not run npm lifecycle scripts still
 * has it. This script exists only to keep it in step with the installed
 * pdfjs-dist: it runs before `dev` and `build`, so upgrading the package refreshes
 * the worker automatically.
 */
import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs');
const target = resolve(root, 'public/pdf/pdf.worker.min.mjs');

try {
  await mkdir(dirname(target), { recursive: true });
  await copyFile(source, target);
  console.log(`[pdf] worker refreshed from pdfjs-dist → ${relative(root, target)}`);
} catch (error) {
  /*
   * Not fatal: the committed copy is still in place, so the viewer keeps working.
   * Refusing to build here would be worse than running one upgrade behind.
   */
  const reason = error instanceof Error ? error.message : String(error);
  console.warn(`[pdf] could not refresh the worker (${reason}); keeping the committed copy.`);
}

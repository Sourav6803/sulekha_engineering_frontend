/**
 * Trigger a browser download from a binary API payload.
 *
 * The BOM endpoints return a PDF via responseType:'arraybuffer', so the
 * payload arrives as an ArrayBuffer. Always treat it as a Blob download
 * (never try to JSON.parse) — errors are surfaced by the axios interceptor
 * as rejected promises before this runs.
 */
export function downloadBlob(
  data: ArrayBuffer,
  filename: string,
  mimeType = 'application/pdf'
): void {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

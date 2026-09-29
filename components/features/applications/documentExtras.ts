import type { ApplicationAccountType, ApplicationDocumentFile } from '@/types/application';

/**
 * The optional fields a document carries alongside its file.
 *
 * Only the passbook / cheque uses these today — the bank details the office
 * needs before it can raise a subsidy claim.
 */
export interface DocumentExtrasForm {
  accountNumber: string;
  ifsc: string;
  branchName: string;
  accountType: ApplicationAccountType | '';
}

export const EMPTY_EXTRAS: DocumentExtrasForm = {
  accountNumber: '',
  ifsc: '',
  branchName: '',
  accountType: '',
};

/**
 * The bank fields already recorded on a document, shaped for the form.
 *
 * These boxes are a permanent part of a document card, so a card that does not
 * seed them shows four empty fields even when the document on record carries
 * every one of them — and submitting that untouched, empty form overwrites the
 * stored values with nothing, because the upload endpoint writes whatever it is
 * handed. Seeding from the document on record is therefore not cosmetic: it is
 * what stops a replacement silently dropping the account number.
 */
export function extrasFromDocument(file?: ApplicationDocumentFile | null): DocumentExtrasForm {
  const extras = file?.extras;
  if (!extras) return { ...EMPTY_EXTRAS };

  return {
    accountNumber: extras.accountNumber ?? '',
    ifsc: extras.ifsc ?? '',
    branchName: extras.branchName ?? '',
    accountType: (extras.accountType ?? '') as DocumentExtrasForm['accountType'],
  };
}

/**
 * The three picture formats the preview overlay can render inline. A PDF (or
 * anything else) is handed to the browser in a new tab instead, because the
 * whole point of reviewing a document is looking at it, not downloading it.
 */
const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const IMAGE_EXTENSION = /\.(jpe?g|png|webp)(\?|$)/i;

/**
 * Is this stored document a picture the overlay can show?
 *
 * The MIME type is authoritative when the server recorded one; the file name (or
 * the URL) is the fallback for records stored before it was captured.
 */
export function isImageDocument(file: ApplicationDocumentFile): boolean {
  if (file.mimeType && IMAGE_MIME_TYPES.has(file.mimeType.toLowerCase())) return true;
  return IMAGE_EXTENSION.test(file.fileName ?? file.url ?? '');
}

/** The name to show for a stored document, never blank. */
export function documentDisplayName(file: ApplicationDocumentFile): string {
  return file.fileName ?? 'Uploaded file';
}

/**
 * The name Cloudinary will accept inside an `fl_attachment:<name>` flag.
 *
 * The flag value is parsed as part of the delivery URL, so it takes a much
 * narrower alphabet than a file name does: a dot is read as a format separator,
 * and a percent-encoded non-ASCII byte makes the CDN reject the whole
 * transformation with a 400 — which the browser reports as
 * `ERR_INVALID_RESPONSE`, i.e. as a broken page rather than a failed download.
 * The stored name here (`adhar card.jpeg`) carried both faults: the extension
 * and, once encoded, the space.
 *
 * So the extension is dropped — Cloudinary re-appends the real one from the
 * stored resource — and only ASCII letters, digits, spaces, underscores and
 * dashes are kept. A name written entirely in Bengali or Devanagari survives as
 * nothing, and the document's kind is used instead, so the saved file is still
 * called something a person can recognise.
 */
function attachmentName(file: ApplicationDocumentFile): string {
  const withoutExtension = documentDisplayName(file).replace(/\.[^./\\]+$/, '');
  const ascii = withoutExtension
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/[^A-Za-z0-9 _-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
    .trim();

  if (ascii) return ascii;

  const kind = String(file.kind ?? '').replace(/[^A-Za-z0-9_-]/g, '');
  return kind || 'document';
}

/**
 * The URL that downloads a stored document instead of displaying it.
 *
 * Cloudinary serves these files from a cross-origin `res.cloudinary.com`, where
 * the browser ignores the HTML `download` attribute — so the only way to force a
 * save rather than an inline view is Cloudinary's own `fl_attachment` flag,
 * inserted immediately after the `/upload/` segment. Passing a name
 * (`fl_attachment:<name>`) also gives the saved file a sensible name, but only
 * the restricted form `attachmentName` produces is accepted; anything else is
 * answered with a 400 and the download never starts. A URL with no `/upload/`
 * segment is not Cloudinary, so it is returned untouched.
 */
export function documentDownloadUrl(file: ApplicationDocumentFile): string {
  const url = file.url;
  if (!url) return url;

  const marker = '/upload/';
  const index = url.indexOf(marker);
  if (index === -1) return url;

  const head = url.slice(0, index + marker.length);
  const tail = url.slice(index + marker.length);

  // Already download-flavoured — re-running the helper must not nest the flag.
  if (tail.startsWith('fl_attachment')) return url;

  return `${head}fl_attachment:${encodeURIComponent(attachmentName(file))}/${tail}`;
}

/** The most recently uploaded file of a kind — the one holding the live extras. */
export function latestDocument(files: ApplicationDocumentFile[]): ApplicationDocumentFile | null {
  if (files.length === 0) return null;

  return files.reduce((latest, file) =>
    new Date(file.uploadedAt ?? 0).getTime() >= new Date(latest.uploadedAt ?? 0).getTime() ? file : latest
  );
}

/**
 * Remount key for a document card.
 *
 * The extras boxes are seeded once, on mount, so the card has to be keyed on
 * the document it was seeded from: when a replacement lands, the key changes
 * and the boxes re-seed from the new record instead of holding the old entry's
 * values or an empty form.
 */
export function extrasSeedKey(files: ApplicationDocumentFile[]): string {
  return latestDocument(files)?._id ?? 'none';
}

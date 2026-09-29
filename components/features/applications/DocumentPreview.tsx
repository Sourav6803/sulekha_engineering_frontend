'use client';

import { useState } from 'react';
import { Eye, ExternalLink, Download } from 'lucide-react';
import { Modal } from '@/components/shared/Modal';
import { documentDisplayName, documentDownloadUrl, isImageDocument } from './documentExtras';
import type { ApplicationDocumentFile } from '@/types/application';

interface DocumentPreviewProps {
  file: ApplicationDocumentFile;
  /** Extra classes for the trigger — callers match the surrounding row. */
  className?: string;
}

const TRIGGER_CLASS =
  'neutral-button inline-flex items-center gap-1 px-3 py-1.5 text-[11px]';

/**
 * The View action for one uploaded document.
 *
 * A picture (jpeg / png / webp) opens large in the shared <Modal>, contained and
 * uncropped, with the file name and a link to the original. Anything else — the
 * PDFs — opens the stored Cloudinary URL in a new tab, which is what a reviewer
 * actually wants. Both paths are keyboard reachable and the modal inherits the
 * Escape-to-close / focus-restore behaviour from <Modal>.
 */
export function DocumentPreview({ file, className }: DocumentPreviewProps) {
  const [open, setOpen] = useState(false);
  const name = documentDisplayName(file);
  const triggerClass = className ? `${TRIGGER_CLASS} ${className}` : TRIGGER_CLASS;

  // A PDF (or any other format) is not rendered inline — hand it to the browser.
  if (!isImageDocument(file)) {
    return (
      <a href={file.url} target="_blank" rel="noopener noreferrer" className={triggerClass}>
        <Eye className="h-3.5 w-3.5" aria-hidden="true" /> View
      </a>
    );
  }

  return (
    <>
      <button type="button" className={triggerClass} onClick={() => setOpen(true)}>
        <Eye className="h-3.5 w-3.5" aria-hidden="true" /> View
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={name} eyebrow="Document preview" size="xl">
        <div className="space-y-3">
          <div className="flex items-center justify-center rounded-[1rem] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-2">
            {/* Cloudinary URLs are not in the next/image allow-list, so the plain
                element is deliberate — same as the material preview. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={file.url}
              alt={name}
              className="max-h-[65vh] w-auto max-w-full object-contain"
            />
          </div>
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--primary-active)] hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> Open the original in a new tab
          </a>
        </div>
      </Modal>
    </>
  );
}

interface DocumentDownloadProps {
  file: ApplicationDocumentFile;
  /** Extra classes for the trigger — callers match the surrounding row. */
  className?: string;
}

/**
 * The Download action for one uploaded document.
 *
 * An anchor to the download-flavoured URL (see `documentDownloadUrl`): a plain
 * link would open the file, because the browser ignores the HTML `download`
 * attribute on Cloudinary's cross-origin URL, so the flag baked into the URL is
 * what makes the browser save it instead. Styled to sit alongside `DocumentPreview`.
 */
export function DocumentDownload({ file, className }: DocumentDownloadProps) {
  const triggerClass = className ? `${TRIGGER_CLASS} ${className}` : TRIGGER_CLASS;

  return (
    <a href={documentDownloadUrl(file)} className={triggerClass} download={documentDisplayName(file)}>
      <Download className="h-3.5 w-3.5" aria-hidden="true" /> Download
    </a>
  );
}

export default DocumentPreview;
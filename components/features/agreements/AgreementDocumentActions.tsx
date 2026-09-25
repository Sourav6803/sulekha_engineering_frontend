'use client';

import { useState } from 'react';
import { Download, Eye, Loader2, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { agreementsApi } from '@/lib/api/agreements.api';
import { downloadBlob } from '@/lib/downloadBlob';
import { handleApiError } from '@/lib/errors/handleApiError';

interface AgreementDocumentActionsProps {
  agreementId: string;
  consumerName: string;
  /** Row actions are compact; the full buttons are used on the detail card. */
  compact?: boolean;
  canDownload?: boolean;
}

/**
 * Preview / download / print for the four page agreement.
 *
 * The endpoints need the Authorization header, which a plain link cannot send,
 * so the document is fetched as bytes and turned into a blob URL. Preview opens
 * that URL (Chrome's own PDF viewer) and print uses the HTML twin of the same
 * template, so screen, print and download always agree.
 */
export function AgreementDocumentActions({
  agreementId,
  consumerName,
  compact = false,
  canDownload = true,
}: AgreementDocumentActionsProps) {
  const [busy, setBusy] = useState<'view' | 'download' | 'print' | null>(null);

  const fileName = `${consumerName}-agreement.pdf`.replace(/[^\w.\- ]+/g, '-');

  const fetchPdf = async () => {
    const buffer = await agreementsApi.downloadPdf(agreementId);
    return new Blob([buffer], { type: 'application/pdf' });
  };

  const handleView = async () => {
    setBusy('view');
    try {
      const blob = await fetchPdf();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener');
      // the new tab keeps the blob alive; revoke much later
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      toast.error('Could not open the agreement', { description: handleApiError(err) });
    } finally {
      setBusy(null);
    }
  };

  const handleDownload = async () => {
    setBusy('download');
    try {
      const buffer = await agreementsApi.downloadPdf(agreementId);
      downloadBlob(buffer, fileName, 'application/pdf');
    } catch (err) {
      toast.error('Could not download the agreement', { description: handleApiError(err) });
    } finally {
      setBusy(null);
    }
  };

  const handlePrint = async () => {
    setBusy('print');
    try {
      // open first so the browser does not treat it as a blocked pop-up
      const win = window.open('', '_blank');
      const html = await agreementsApi.printHtml(agreementId);

      if (!win) {
        toast.error('Allow pop-ups to print', {
          description: 'The print window could not be opened.',
        });
        return;
      }

      win.document.open();
      win.document.write(html);
      win.document.close();
      win.focus();
    } catch (err) {
      toast.error('Could not prepare the print view', { description: handleApiError(err) });
    } finally {
      setBusy(null);
    }
  };

  const spinner = busy !== null;

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => void handleView()}
          disabled={spinner}
          className="rounded p-1.5 text-[var(--secondary)] transition-colors hover:text-[var(--foreground)] disabled:opacity-40"
          title="Preview the 4-page agreement"
        >
          {busy === 'view' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
        </button>
        {canDownload && (
          <button
            type="button"
            onClick={() => void handleDownload()}
            disabled={spinner}
            className="rounded p-1.5 text-[var(--secondary)] transition-colors hover:text-[var(--foreground)] disabled:opacity-40"
            title="Download as PDF"
          >
            {busy === 'download' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </button>
        )}
        <button
          type="button"
          onClick={() => void handlePrint()}
          disabled={spinner}
          className="rounded p-1.5 text-[var(--secondary)] transition-colors hover:text-[var(--foreground)] disabled:opacity-40"
          title="Print"
        >
          {busy === 'print' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => void handleView()}
        disabled={spinner}
        className="neutral-button inline-flex items-center gap-1.5 px-3 py-2 text-sm disabled:opacity-60"
      >
        {busy === 'view' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
        View agreement
      </button>
      {canDownload && (
        <button
          type="button"
          onClick={() => void handleDownload()}
          disabled={spinner}
          className="brand-button inline-flex items-center gap-1.5 px-3 py-2 text-sm disabled:opacity-60"
        >
          {busy === 'download' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Download PDF
        </button>
      )}
      <button
        type="button"
        onClick={() => void handlePrint()}
        disabled={spinner}
        className="neutral-button inline-flex items-center gap-1.5 px-3 py-2 text-sm disabled:opacity-60"
      >
        {busy === 'print' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
        Print
      </button>
    </div>
  );
}

export default AgreementDocumentActions;

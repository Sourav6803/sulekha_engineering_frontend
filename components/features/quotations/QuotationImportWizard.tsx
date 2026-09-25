'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileText,
  Info,
  Loader2,
  ListOrdered,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { quotationsApi } from '@/lib/api/quotations.api';
import { handleApiError } from '@/lib/errors/handleApiError';
import type {
  QuotationAttachmentMatch,
  QuotationImportPlan,
  QuotationRegisterRow,
} from '@/types/quotation';

type Step = 1 | 2 | 3;

/** The backend caps a single upload at 10 files (multer), so we batch. */
const UPLOAD_BATCH_SIZE = 10;

const MATCH_LABEL: Record<QuotationAttachmentMatch['matchType'], string> = {
  number: 'Number in the file name',
  name: 'Customer name matched',
  fuzzy: 'Needs a check',
  none: 'No match',
};

const MATCH_CLASS: Record<QuotationAttachmentMatch['matchType'], string> = {
  number: 'badge-success',
  name: 'badge-success',
  fuzzy: 'badge-warning',
  none: 'bg-[var(--surface-muted)] text-[var(--error)]',
};

/**
 * Back-fill wizard: bring the quotations that were made by hand (Excel -> print
 * -> scan -> PDF) into the database, keeping their existing numbers.
 *
 * Step 1 imports the serial sheet, which is the only place the numbers and the
 * customer names are recorded. Step 2 uploads the scanned PDFs and proposes a
 * match per file. Step 3 lets that proposal be corrected before anything is
 * attached. Nothing is written until "Confirm" is pressed in each step.
 */
export function QuotationImportWizard() {
  const [step, setStep] = useState<Step>(1);

  // ---- register options, used by the match dropdowns ----
  const [options, setOptions] = useState<QuotationRegisterRow[]>([]);

  const loadOptions = useCallback(async () => {
    try {
      const response = await quotationsApi.register({ limit: 500 });
      setOptions(Array.isArray(response.data) ? response.data : []);
      return Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  // =========================================================================
  // STEP 1 - the serial sheet
  // =========================================================================
  const sheetInput = useRef<HTMLInputElement>(null);
  const [plan, setPlan] = useState<QuotationImportPlan | null>(null);
  const [planning, setPlanning] = useState(false);
  const [importing, setImporting] = useState(false);
  const [registerDone, setRegisterDone] = useState(false);

  // The chosen source has to be remembered: the confirm call is a second
  // request, so an uploaded sheet has to be uploaded again with dryRun=false.
  const [sheetFile, setSheetFile] = useState<File | null>(null);

  const runPlan = async (source: 'sheet' | 'legacy', file?: File) => {
    setPlanning(true);
    setPlan(null);
    setSheetFile(source === 'sheet' ? file ?? null : null);
    try {
      const response = file
        ? await quotationsApi.importRegisterFile(file, {
            dryRun: true,
            source: `Uploaded sheet: ${file.name}`,
          })
        : await quotationsApi.importRegister({
            dryRun: true,
            useLegacy: source === 'legacy',
            source: source === 'legacy' ? 'QUOTATION SL NUMBUR.xlsx (built in)' : undefined,
          });
      setPlan(response.data);
      toast.success('Checked the sheet', {
        description: `${response.data.summary.valid} valid row(s), ${response.data.summary.created} to import.`,
      });
    } catch (err) {
      toast.error('Could not read the sheet', { description: handleApiError(err) });
    } finally {
      setPlanning(false);
    }
  };

  const confirmImport = async () => {
    if (!plan) return;
    setImporting(true);
    try {
      const response = sheetFile
        ? await quotationsApi.importRegisterFile(sheetFile, { dryRun: false, source: plan.source })
        : await quotationsApi.importRegister({
            dryRun: false,
            useLegacy: true,
            source: plan.source,
          });

      toast.success('Register imported', {
        description: `${response.data.summary.created} quotation(s) created, ${response.data.summary.skipped} already there.`,
      });
      setRegisterDone(true);
      await loadOptions();
      setPlan(null);
      setStep(2);
    } catch (err) {
      toast.error('Could not import the register', { description: handleApiError(err) });
    } finally {
      setImporting(false);
    }
  };

  // =========================================================================
  // STEP 2 - the scanned files
  // =========================================================================
  const filesInput = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [staging, setStaging] = useState<QuotationAttachmentMatch[]>([]);
  const [stagingBusy, setStagingBusy] = useState(false);

  const stage = async () => {
    if (files.length === 0) return;
    setStagingBusy(true);
    try {
      // The server accepts at most 10 files per request (multer limit), so a
      // folder of old scans is uploaded in batches and the results merged.
      const collected: QuotationAttachmentMatch[] = [];
      for (let index = 0; index < files.length; index += UPLOAD_BATCH_SIZE) {
        const batch = files.slice(index, index + UPLOAD_BATCH_SIZE);
        const response = await quotationsApi.importAttachments(batch);
        collected.push(...(response.data.files ?? []));
      }

      setStaging(collected);

      const matched = collected.filter(
        (file) => file.matchType === 'number' || file.matchType === 'name'
      ).length;
      toast.success(`${collected.length} file(s) uploaded`, {
        description: `${matched} matched automatically, ${collected.length - matched} need a look.`,
      });
      setStep(3);
    } catch (err) {
      toast.error('Could not upload the files', { description: handleApiError(err) });
    } finally {
      setStagingBusy(false);
    }
  };

  // =========================================================================
  // STEP 3 - review and attach
  // =========================================================================
  const [selection, setSelection] = useState<Record<string, string>>({});
  const [attaching, setAttaching] = useState(false);
  const [result, setResult] = useState<{ attached: number; failed: number } | null>(null);

  useEffect(() => {
    const initial: Record<string, string> = {};
    staging.forEach((file) => {
      initial[file.fileName] = file.quotation?.id ?? '';
    });
    setSelection(initial);
  }, [staging]);

  const readyToAttach = useMemo(
    () => staging.filter((file) => file.uploaded && selection[file.fileName]),
    [staging, selection]
  );

  const attach = async () => {
    if (readyToAttach.length === 0) return;
    setAttaching(true);
    try {
      const response = await quotationsApi.confirmImport(
        readyToAttach.map((file) => ({
          quotationId: selection[file.fileName],
          url: file.url as string,
          publicId: file.publicId ?? null,
          fileName: file.fileName,
          fileSize: file.fileSize ?? null,
          mimeType: 'application/pdf',
          kind: 'original_manual' as const,
        }))
      );

      setResult({ attached: response.data.attached, failed: response.data.failed });
      toast.success(`${response.data.attached} file(s) attached`, {
        description:
          response.data.failed > 0
            ? `${response.data.failed} could not be attached — see the list below.`
            : 'Every quotation now carries its scanned copy.',
      });
      await loadOptions();
    } catch (err) {
      toast.error('Could not attach the files', { description: handleApiError(err) });
    } finally {
      setAttaching(false);
    }
  };

  const stepClass = (value: Step) =>
    `flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors ${
      step === value
        ? 'bg-[var(--primary)] text-white'
        : 'bg-[var(--surface-muted)] text-[var(--secondary)]'
    }`;

  return (
    <div className="space-y-5">
      {/* Steps */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={stepClass(1)}>1 · Serial sheet</span>
        <ArrowRight className="h-4 w-4 text-[var(--muted)]" />
        <span className={stepClass(2)}>2 · Scanned files</span>
        <ArrowRight className="h-4 w-4 text-[var(--muted)]" />
        <span className={stepClass(3)}>3 · Review &amp; attach</span>
      </div>

      {/* ---------------------------------------------------------------- */}
      {step === 1 && (
        <div className="surface-card space-y-4 p-4">
          <div>
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              Step 1 — bring in the serial numbers
            </h3>
            <p className="mt-1 text-sm text-[var(--secondary)]">
              Your old sheet is the only record of which number belongs to which customer, so it has to go
              in first. Numbers are imported exactly as written — never regenerated.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void runPlan('legacy')}
              disabled={planning}
              className="brand-button inline-flex items-center gap-1.5 px-3 py-2 text-sm disabled:opacity-60"
            >
              {planning ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListOrdered className="h-4 w-4" />}
              Check the built-in 24 rows
            </button>

            <input
              ref={sheetInput}
              type="file"
              accept=".xlsx,.xlsm,.csv"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void runPlan('sheet', file);
                if (sheetInput.current) sheetInput.current.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => sheetInput.current?.click()}
              disabled={planning}
              className="neutral-button inline-flex items-center gap-1.5 px-3 py-2 text-sm disabled:opacity-60"
            >
              <Upload className="h-4 w-4" /> Upload my sheet (.xlsx / .csv)
            </button>
          </div>

          {plan && (
            <div className="space-y-3 border-t border-[var(--border-soft)] pt-4">
              <div className="grid gap-3 sm:grid-cols-4">
                <Summary label="Rows read" value={plan.summary.received} />
                <Summary label="Valid" value={plan.summary.valid} />
                <Summary label="Already present" value={plan.summary.skipped} />
                <Summary label="Problem rows" value={plan.summary.invalid + plan.summary.duplicates} />
              </div>

              {(plan.invalid.length > 0 || plan.duplicates.length > 0 || plan.conflicts.length > 0) && (
                <div className="rounded-lg bg-[var(--surface-muted)] p-3">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                    <AlertTriangle className="h-3.5 w-3.5" /> Rows that need attention
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-[var(--secondary)]">
                    {[...plan.invalid, ...plan.duplicates, ...plan.conflicts].slice(0, 12).map((issue, index) => (
                      <li key={`issue-${index}`}>
                        {issue.quotationNo || '(no number)'} — {issue.details || issue.customerName || ''}{' '}
                        <span className="text-[var(--muted)]">({issue.reason})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {plan.nextNumberAfterImport.nextNumber && (
                <p className="rounded-lg bg-[var(--primary-tint)] px-3 py-2 text-sm text-[var(--foreground)]">
                  After this import the next new quotation will be{' '}
                  <strong>{plan.nextNumberAfterImport.nextNumber}</strong>
                </p>
              )}

              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-[var(--muted)]">
                  Nothing has been written yet — this was only a check.
                </p>
                <button
                  type="button"
                  onClick={() => void confirmImport()}
                  disabled={importing || plan.toCreate.length === 0}
                  className="brand-button inline-flex items-center gap-1.5 px-3 py-2 text-sm disabled:opacity-60"
                >
                  {importing && <Loader2 className="h-4 w-4 animate-spin" />}
                  Import {plan.toCreate.length} record(s)
                </button>
              </div>
            </div>
          )}

          {registerDone && (
            <p className="flex items-center gap-2 text-sm text-[var(--secondary)]">
              <CheckCircle2 className="h-4 w-4 text-[var(--primary)]" />
              Register imported. Continue with the scanned files.
            </p>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {step === 2 && (
        <div className="surface-card space-y-4 p-4">
          <div>
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              Step 2 — upload the scanned quotations
            </h3>
            <p className="mt-1 text-sm text-[var(--secondary)]">
              Add the PDFs you have. They are only uploaded here; each one is matched to a quotation in the
              next step, and nothing is attached until you confirm.
            </p>
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-[var(--surface-muted)] p-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
            <p className="text-xs text-[var(--secondary)]">
              A scan has no readable text, so the number cannot be read out of the file. Matching uses the
              file name: if it contains the quotation number (<code>SE-PMSGY-2026-27-38.pdf</code>) the match
              is exact; if it only carries the customer name (<code>Souvik Ghosh_Quotation.pdf</code>) it is
              matched by name. Renaming the files first makes the review step trivial.
            </p>
          </div>

          <input
            ref={filesInput}
            type="file"
            multiple
            accept="application/pdf,image/jpeg,image/png"
            className="hidden"
            onChange={(event) => {
              const picked = Array.from(event.target.files ?? []);
              setFiles((prev) => {
                const seen = new Set(prev.map((file) => file.name));
                return [...prev, ...picked.filter((file) => !seen.has(file.name))];
              });
              if (filesInput.current) filesInput.current.value = '';
            }}
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => filesInput.current?.click()}
              className="neutral-button inline-flex items-center gap-1.5 px-3 py-2 text-sm"
            >
              <Upload className="h-4 w-4" /> Choose files
            </button>
            <span className="text-sm text-[var(--muted)]">{files.length} file(s) selected</span>
            {files.length > 0 && (
              <button
                type="button"
                onClick={() => setFiles([])}
                className="text-sm text-[var(--secondary)] underline-offset-2 hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          {files.length > 0 && (
            <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-[var(--secondary)]">
              {files.map((file) => (
                <li key={file.name} className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{file.name}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-[var(--border-soft)] pt-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm text-[var(--secondary)] underline-offset-2 hover:underline"
            >
              Back to the sheet
            </button>
            <button
              type="button"
              onClick={() => void stage()}
              disabled={stagingBusy || files.length === 0}
              className="brand-button inline-flex items-center gap-1.5 px-3 py-2 text-sm disabled:opacity-60"
            >
              {stagingBusy && <Loader2 className="h-4 w-4 animate-spin" />}
              Upload {files.length} file(s) for matching
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {step === 3 && (
        <div className="surface-card space-y-4 p-4">
          <div>
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              Step 3 — check the matches, then attach
            </h3>
            <p className="mt-1 text-sm text-[var(--secondary)]">
              Each file shows the quotation it will be attached to. Change any of them from the dropdown, or
              set it to "Do not attach".
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-[var(--muted)]">
                <tr>
                  <th className="pb-2">File</th>
                  <th className="pb-2">Attach to</th>
                  <th className="pb-2">How it was matched</th>
                </tr>
              </thead>
              <tbody>
                {staging.map((file) => (
                  <tr key={file.fileName} className="border-t border-[var(--border-soft)] align-top">
                    <td className="py-2 pr-3">
                      <p className="max-w-[260px] truncate text-[var(--foreground)]">{file.fileName}</p>
                      {!file.uploaded && (
                        <p className="text-xs text-[var(--error)]">
                          {file.uploadError || 'Upload failed'}
                        </p>
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      <select
                        className="form-input w-full max-w-[320px]"
                        value={selection[file.fileName] ?? ''}
                        onChange={(event) =>
                          setSelection((prev) => ({ ...prev, [file.fileName]: event.target.value }))
                        }
                      >
                        <option value="">Do not attach</option>
                        {file.candidates.map((candidate) => (
                          <option key={`cand-${candidate.id}`} value={candidate.id}>
                            {candidate.quotationNo} — {candidate.customerName} (suggested)
                          </option>
                        ))}
                        {options.map((option) => (
                          <option key={`opt-${option.id}`} value={option.id}>
                            {option.quotationNo} — {option.details}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2">
                      <span className={`badge-pill ${MATCH_CLASS[file.matchType]}`}>
                        {MATCH_LABEL[file.matchType]}
                        {file.matchType === 'fuzzy' || (file.matchType === 'name' && file.confidence < 0.9)
                          ? ` · ${Math.round(file.confidence * 100)}%`
                          : ''}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result && (
            <p className="flex items-center gap-2 rounded-lg bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--secondary)]">
              <CheckCircle2 className="h-4 w-4 text-[var(--primary)]" />
              {result.attached} file(s) attached
              {result.failed > 0 ? ` · ${result.failed} failed` : ''}.
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-soft)] pt-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-sm text-[var(--secondary)] underline-offset-2 hover:underline"
            >
              Back to the files
            </button>
            <div className="flex items-center gap-2">
              <Link href="/quotations/serial" className="neutral-button px-3 py-2 text-sm">
                Open the register
              </Link>
              <button
                type="button"
                onClick={() => void attach()}
                disabled={attaching || readyToAttach.length === 0}
                className="brand-button inline-flex items-center gap-1.5 px-3 py-2 text-sm disabled:opacity-60"
              >
                {attaching && <Loader2 className="h-4 w-4 animate-spin" />}
                Attach {readyToAttach.length} file(s)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-[var(--surface-muted)] px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className="text-lg font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}

export default QuotationImportWizard;

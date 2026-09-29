'use client';

import { useState } from 'react';
import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  Loader2,
  Send,
  TriangleAlert,
  Wand2,
} from 'lucide-react';
import { CheckboxField, StepSection, TextAreaField, TextField } from './WizardFields';
import { stepIndexForIssue } from '@/components/features/applications/applicationCompleteness';
import type { ApplicationNameMatch, ApplicationSubmitIssue } from '@/types/application';
import type { WizardStepProps } from './wizardTypes';

interface StepNamesSubmitProps extends WizardStepProps {
  nameMatch: ApplicationNameMatch | null;
  checkingNames: boolean;
  nameMatchError: string | null;
  onCheckNames: () => void;
  /** Live mirror of the server's submit gate (collectSubmitIssues). */
  issues: ApplicationSubmitIssue[];
  onGoToStep: (step: number) => void;
  confirmNameMatch: boolean;
  setConfirmNameMatch: (confirmed: boolean) => void;
  note: string;
  setNote: (note: string) => void;
  submitting: boolean;
  submitError: string | null;
  /** The reasons the server returned when a submit was refused. */
  submitIssues: ApplicationSubmitIssue[];
  onSubmit: () => void;
}

const VERDICT_STYLES: Record<string, { className: string; label: string }> = {
  match: { className: 'border-[var(--success)] bg-[var(--success-tint)] text-[var(--success)]', label: 'Match' },
  near_match: {
    className: 'border-[var(--warning)] bg-[var(--warning-tint)] text-[var(--warning)]',
    label: 'Near match',
  },
  mismatch: { className: 'border-[var(--error)] bg-[var(--error-tint)] text-[var(--error)]', label: 'Mismatch' },
  incomplete: {
    className: 'border-[var(--border)] bg-[var(--surface-muted)] text-[var(--muted)]',
    label: 'Incomplete',
  },
};

/**
 * Step 6 — the three-document name agreement, the completeness panel and the
 * submit.
 *
 * The panel below is computed with the same rules the server uses
 * (collectSubmitIssues), so what is listed here is exactly what would refuse a
 * submit — and if the server still objects, its own `issues` are shown instead
 * of a generic failure.
 */
export function StepNamesSubmit({
  form,
  setForm,
  errors,
  disabled,
  nameMatch,
  checkingNames,
  nameMatchError,
  onCheckNames,
  issues,
  onGoToStep,
  confirmNameMatch,
  setConfirmNameMatch,
  note,
  setNote,
  submitting,
  submitError,
  submitIssues,
  onSubmit,
}: StepNamesSubmitProps) {
  const [showAllIssues, setShowAllIssues] = useState(false);

  const verdict = nameMatch?.verdict ?? null;
  const verdictStyle = verdict ? VERDICT_STYLES[verdict] : null;
  const visibleIssues = showAllIssues ? issues : issues.slice(0, 6);

  return (
    <div className="space-y-4">
      <StepSection
        title="Names as printed on the documents"
        description="The Aadhaar, the bank passbook and the electricity bill must all carry the same name. Case differences are fine; a real mismatch is not."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="name-consumer"
            label="Consumer name (application)"
            value={form.names.consumer}
            onValueChange={(value) => setForm((prev) => ({ ...prev, names: { ...prev.names, consumer: value } }))}
            error={errors.consumerName}
            disabled={disabled}
          />
          <TextField
            id="name-aadhaar"
            label="Name on Aadhaar"
            value={form.names.aadhaar}
            onValueChange={(value) => setForm((prev) => ({ ...prev, names: { ...prev.names, aadhaar: value } }))}
            disabled={disabled}
          />
          <TextField
            id="name-passbook"
            label="Name on passbook"
            value={form.names.passbook}
            onValueChange={(value) => setForm((prev) => ({ ...prev, names: { ...prev.names, passbook: value } }))}
            disabled={disabled}
          />
          <TextField
            id="name-bill"
            label="Name on electricity bill"
            value={form.names.electricBill}
            onValueChange={(value) => setForm((prev) => ({ ...prev, names: { ...prev.names, electricBill: value } }))}
            disabled={disabled}
          />
        </div>

        <div className="mt-3">
          <button
            type="button"
            className="neutral-button px-4 py-2 text-sm"
            onClick={onCheckNames}
            disabled={disabled || checkingNames}
          >
            {checkingNames ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            {checkingNames ? 'Checking…' : 'Check names'}
          </button>
        </div>

        {nameMatchError && (
          <p role="alert" className="mt-3 text-xs leading-5 text-[var(--error)] [overflow-wrap:anywhere]">
            {nameMatchError}
          </p>
        )}

        {verdictStyle && nameMatch && (
          <div className={`mt-3 rounded-[1rem] border p-3 ${verdictStyle.className}`}>
            <p className="flex items-center gap-2 text-sm font-semibold">
              {verdict === 'match' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : verdict === 'mismatch' ? (
                <AlertCircle className="h-4 w-4 shrink-0" />
              ) : (
                <TriangleAlert className="h-4 w-4 shrink-0" />
              )}
              {verdictStyle.label}
            </p>
            {nameMatch.message && (
              <p className="mt-1 text-xs leading-5 [overflow-wrap:anywhere]">{nameMatch.message}</p>
            )}
            {nameMatch.checkedAt && (
              <p className="mt-1 text-[11px] opacity-80">
                Checked {new Date(nameMatch.checkedAt).toLocaleString('en-IN')}
              </p>
            )}
          </div>
        )}

        {!nameMatch?.verdict && !nameMatchError && (
          <p className="mt-3 text-[11px] leading-5 text-[var(--muted)]">
            Enter all four names, then press Check names. A mismatch blocks the submit until it is fixed.
          </p>
        )}
      </StepSection>

      {/* Completeness — the same rules the server applies on submit */}
      <section className="panel p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-[var(--foreground)]">Before you submit</h2>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
              Everything the office needs before the file leaves your hands.
            </p>
          </div>
          {issues.length === 0 ? (
            <span className="badge-pill badge-success">
              <BadgeCheck className="mr-1 h-3 w-3" /> Complete
            </span>
          ) : (
            <span className="badge-pill badge-warning">{issues.length} to fix</span>
          )}
        </div>

        {issues.length === 0 ? (
          <p className="mt-3 flex items-center gap-2 rounded-[1rem] border border-[var(--success)] bg-[var(--success-tint)] px-3 py-2.5 text-xs font-medium text-[var(--success)]">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Nothing is missing. Confirm the names and submit.
          </p>
        ) : (
          <>
            <ul className="mt-3 space-y-1.5">
              {visibleIssues.map((issue) => (
                <li
                  key={`${issue.field}-${issue.message}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-[1rem] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-2"
                >
                  <span className="min-w-0 flex-1 text-xs leading-5 text-[var(--foreground)] [overflow-wrap:anywhere]">
                    {issue.message}
                  </span>
                  <button
                    type="button"
                    className="shrink-0 text-[11px] font-semibold text-[var(--primary-active)] hover:underline"
                    onClick={() => onGoToStep(stepIndexForIssue(issue.field))}
                  >
                    Fix
                  </button>
                </li>
              ))}
            </ul>

            {issues.length > 6 && (
              <button
                type="button"
                className="mt-2 text-[11px] font-semibold text-[var(--primary-active)] hover:underline"
                onClick={() => setShowAllIssues((prev) => !prev)}
              >
                {showAllIssues ? 'Show fewer' : `Show all ${issues.length}`}
              </button>
            )}
          </>
        )}
      </section>

      <StepSection title="Submit" description="Once submitted the file goes to the office; you can still add documents while it is under review.">
        <TextAreaField
          id="submit-note"
          label="Note for the office"
          value={note}
          onValueChange={setNote}
          placeholder="Optional — anything the reviewer should know."
          rows={3}
          maxLength={1000}
        />

        <div className="mt-3 space-y-2">
          <CheckboxField
            id="confirm-name-match"
            tone="primary"
            label="I have checked the names on the Aadhaar, the bank passbook and the electricity bill, and they agree."
            checked={confirmNameMatch}
            onChange={setConfirmNameMatch}
            hint="This confirmation is mandatory — the submit is refused without it."
          />

          {submitIssues.length > 0 && (
            <div role="alert" className="rounded-[1rem] border border-[var(--error)] bg-[var(--error-tint)] p-3">
              <p className="text-xs font-semibold text-[var(--error)]">
                The server refused the submit — {submitIssues.length} item(s) to fix:
              </p>
              <ul className="mt-1.5 space-y-1">
                {submitIssues.map((issue) => (
                  <li
                    key={`${issue.field}-${issue.message}`}
                    className="flex flex-wrap items-center justify-between gap-2 text-[11px] leading-4 text-[var(--error)]"
                  >
                    <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{issue.message}</span>
                    {issue.field && (
                      <button
                        type="button"
                        className="shrink-0 font-semibold underline"
                        onClick={() => onGoToStep(stepIndexForIssue(issue.field))}
                      >
                        Fix
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {submitError && submitIssues.length === 0 && (
            <p role="alert" className="rounded-[1rem] border border-[var(--error)] bg-[var(--error-tint)] p-3 text-xs leading-5 text-[var(--error)] [overflow-wrap:anywhere]">
              {submitError}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="brand-button px-5 py-2.5 text-sm"
              onClick={onSubmit}
              disabled={disabled || submitting || !confirmNameMatch}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {submitting ? 'Submitting…' : 'Submit application'}
            </button>

            {!confirmNameMatch && <span className="text-[11px] text-[var(--muted)]">Tick the confirmation to enable submit.</span>}
          </div>
        </div>
      </StepSection>
    </div>
  );
}

export default StepNamesSubmit;

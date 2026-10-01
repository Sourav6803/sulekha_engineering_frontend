'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, Loader2, XCircle, type LucideIcon } from 'lucide-react';
import { applicationsApi } from '@/lib/api/applications.api';
import { CheckboxField, SelectField, TextField } from './wizard/WizardFields';
import { usableScoreOrNull, type CreditCheckValue } from './wizard/wizardTypes';
import type { CreditCheckStatus, CreditCheckVerdict, LenderCriteria } from '@/types/application';

interface CreditCheckPanelProps {
  /** The credit answer, edited in place — this is a controlled component. */
  value: CreditCheckValue;
  onChange: (value: CreditCheckValue) => void;
  /** The project cost the verdict is judged against, or null when unknown. */
  amount: number | null;
  disabled?: boolean;
}

/**
 * How the score was obtained. The first is the checklist default, so the select
 * never offers an empty choice — an empty `method` would fail server validation
 * and that is the one thing this block must never do.
 */
const METHOD_OPTIONS = [
  { value: 'consumer_self_check', label: 'Consumer checked it themselves' },
  { value: 'bank_portal', label: 'Read from the bank portal' },
  { value: 'agent_estimate', label: 'Agent estimate' },
  { value: 'other', label: 'Other' },
] as const;

const VERDICT_STYLES: Record<CreditCheckStatus, string> = {
  pass: 'border-[var(--success)] bg-[var(--success-tint)] text-[var(--success)]',
  review: 'border-[var(--warning)] bg-[var(--warning-tint)] text-[var(--warning)]',
  fail: 'border-[var(--error)] bg-[var(--error-tint)] text-[var(--error)]',
  not_checked: 'border-[var(--border-soft)] bg-[var(--surface-muted)] text-[var(--muted)]',
};

const VERDICT_ICONS: Record<CreditCheckStatus, LucideIcon> = {
  pass: CheckCircle2,
  review: AlertTriangle,
  fail: XCircle,
  not_checked: Info,
};

/**
 * The lender rows change only when the server's policy file changes, so one
 * request is shared by every panel on the page (the wizard step and the
 * pre-check modal alike).
 */
let lenderCriteriaCache: LenderCriteria | null = null;
let lenderCriteriaRequest: Promise<LenderCriteria | null> | null = null;

function loadLenderCriteria(): Promise<LenderCriteria | null> {
  if (lenderCriteriaCache) return Promise.resolve(lenderCriteriaCache);
  if (!lenderCriteriaRequest) {
    lenderCriteriaRequest = applicationsApi
      .lenderCriteria()
      .then((response) => {
        lenderCriteriaCache = response.data;
        return lenderCriteriaCache;
      })
      .catch(() => {
        // Let a later mount try again; the panel still works without the list.
        lenderCriteriaRequest = null;
        return null;
      });
  }
  return lenderCriteriaRequest;
}

/**
 * The shared credit pre-check block, used by the deal step and the pre-check
 * modal.
 *
 * It is a notice, never a gate: no field is required, the verdict is fetched on
 * a debounce and a failure is swallowed, so nothing here can block or slow the
 * flow. The verdict is recomputed by the server (`creditCheckPreview`), which
 * owns `status`, `headline` and `detail`.
 */
export function CreditCheckPanel({ value, onChange, amount, disabled = false }: CreditCheckPanelProps) {
  const [lenders, setLenders] = useState<LenderCriteria['lenders']>([]);
  const [verdict, setVerdict] = useState<CreditCheckVerdict | null>(null);
  const [checking, setChecking] = useState(false);
  /** Guards against an out-of-order response overwriting a newer verdict. */
  const requestIdRef = useRef(0);

  useEffect(() => {
    let active = true;
    void loadLenderCriteria().then((criteria) => {
      if (active && criteria) setLenders(criteria.lenders);
    });
    return () => {
      active = false;
    };
  }, []);

  // Debounced preview (~400 ms after any input changes). The request id is
  // bumped on every run, so a slow earlier request that resolves late is dropped.
  useEffect(() => {
    const requestId = ++requestIdRef.current;

    const timer = window.setTimeout(() => {
      setChecking(true);
      void (async () => {
        try {
          const response = await applicationsApi.creditCheckPreview({
            amount: amount ?? null,
            bank: value.bank.trim() || null,
            method: value.method,
            score: usableScoreOrNull(value.score),
            defaultOrWriteOff: value.defaultOrWriteOff,
            newToCredit: value.newToCredit,
            note: value.note.trim() || null,
          });
          if (requestIdRef.current !== requestId) return;
          setVerdict(response.data);
        } catch {
          // A failed check must not surface as an error — the flow continues.
          if (requestIdRef.current !== requestId) return;
        } finally {
          if (requestIdRef.current === requestId) setChecking(false);
        }
      })();
    }, 400);

    return () => window.clearTimeout(timer);
  }, [
    amount,
    value.bank,
    value.method,
    value.score,
    value.defaultOrWriteOff,
    value.newToCredit,
    value.note,
  ]);

  const patch = (changes: Partial<CreditCheckValue>) => onChange({ ...value, ...changes });

  const lenderOptions = lenders.map((lender) => ({ value: lender.code, label: lender.name }));
  const VerdictIcon = verdict ? VERDICT_ICONS[verdict.status] : null;

  return (
    <section className="panel p-4 sm:p-5">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-[var(--foreground)]">Credit check</h2>
        <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
          Optional. Record what the consumer told you and see how the bank&apos;s rules read it. Nothing here is
          required and the application is never held back by the verdict.
        </p>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <SelectField
          id="credit-lender"
          label="Lender (bank the loan is expected from)"
          value={value.bank}
          onValueChange={(bank) => patch({ bank })}
          options={lenderOptions}
          placeholder="Not sure / decide later"
          disabled={disabled}
        />

        <div className="min-w-0">
          <label htmlFor="credit-method" className="form-label block text-[13px] leading-5">
            How was the score obtained?
          </label>
          <div className="mt-1.5">
            <select
              id="credit-method"
              value={value.method}
              disabled={disabled}
              onChange={(event) => patch({ method: event.target.value as CreditCheckValue['method'] })}
              className="form-input text-sm"
            >
              {METHOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <TextField
          id="credit-score"
          label="Credit score"
          value={value.score}
          onValueChange={(score) => patch({ score })}
          placeholder="e.g. 720 — optional"
          numeric
          maxLength={3}
          disabled={disabled}
        />

        <TextField
          id="credit-note"
          label="Note"
          value={value.note}
          onValueChange={(note) => patch({ note })}
          placeholder="Optional — anything the office should know"
          maxLength={500}
          disabled={disabled}
        />
      </div>

      <div className="mt-4 space-y-3">
        <CheckboxField
          id="credit-default"
          label="Consumer told us of a default / write-off"
          checked={value.defaultOrWriteOff}
          onChange={(defaultOrWriteOff) => patch({ defaultOrWriteOff })}
        />
        <CheckboxField
          id="credit-new"
          label="New to credit (no score yet)"
          checked={value.newToCredit}
          onChange={(newToCredit) => patch({ newToCredit })}
        />
      </div>

      {checking && (
        <p className="mt-4 flex items-center gap-1.5 text-[11px] text-[var(--muted-soft)]">
          <Loader2 className="h-3 w-3 animate-spin" /> Checking against the lender rules…
        </p>
      )}

      {verdict && VerdictIcon && (
        <div
          role="status"
          className={`mt-4 flex items-start gap-2 rounded-[1rem] border px-3 py-2.5 text-[11px] leading-5 ${VERDICT_STYLES[verdict.status]}`}
        >
          <VerdictIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="min-w-0">
            <span className="font-semibold [overflow-wrap:anywhere]">{verdict.headline}</span>
            {verdict.detail ? (
              <span className="mt-0.5 block [overflow-wrap:anywhere]">{verdict.detail}</span>
            ) : null}
          </span>
        </div>
      )}
    </section>
  );
}

export default CreditCheckPanel;

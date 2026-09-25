'use client';

import { useMemo, useState } from 'react';
import { FileSignature } from 'lucide-react';
import { formatINR } from '@/lib/format';
import { splitAgreementAmount, formatAgreementTotal } from '@/types/agreement';
import type { AgreementDefaults, AgreementDocument, AgreementPayload } from '@/types/agreement';

export interface QuotationOption {
  _id: string;
  quotationNo: string;
  customerName: string;
  consumerId?: string;
  phoneNo?: string;
  addressLine1?: string;
  addressLine2?: string;
  district?: string;
  pincode?: string;
  amount?: number | null;
}

interface AgreementFormProps {
  initial?: AgreementDocument | null;
  mode: 'create' | 'edit';
  submitting?: boolean;
  defaults?: AgreementDefaults | null;
  /** Quotations that can prefill the consumer details and the amount. */
  quotationOptions?: QuotationOption[];
  onSubmit: (payload: AgreementPayload) => void | Promise<void>;
}

interface FormState {
  consumerName: string;
  consumerId: string;
  relationLine: string;
  address: string;
  discom: string;
  agreementDate: string;
  amount: string;
  quotation: string;
  notes: string;
}

const todayInput = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
};

const toInputDate = (value?: string | null) => {
  if (!value) return todayInput();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? todayInput() : date.toISOString().slice(0, 10);
};

/** Mirrors the server's address composition when prefilling from a quotation. */
const addressFromQuotation = (quotation: QuotationOption) =>
  [
    quotation.addressLine1,
    quotation.addressLine2,
    quotation.district,
    quotation.pincode ? `Pin- ${quotation.pincode}` : '',
  ]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(', ');

const emptyForm = (defaults?: AgreementDefaults | null): FormState => ({
  consumerName: '',
  consumerId: '',
  relationLine: '',
  address: '',
  discom: defaults?.discom ?? 'WBSEDCL',
  agreementDate: todayInput(),
  amount: '',
  quotation: '',
  notes: '',
});

const fromAgreement = (agreement: AgreementDocument, defaults?: AgreementDefaults | null): FormState => ({
  consumerName: agreement.consumerName ?? '',
  consumerId: agreement.consumerId ?? '',
  relationLine: agreement.relationLine ?? '',
  address: agreement.address ?? '',
  discom: agreement.discom ?? defaults?.discom ?? 'WBSEDCL',
  agreementDate: toInputDate(agreement.agreementDate),
  amount: agreement.amount != null ? String(agreement.amount) : '',
  quotation:
    typeof agreement.quotation === 'object' && agreement.quotation
      ? agreement.quotation._id
      : (agreement.quotation as string) || '',
  notes: agreement.notes ?? '',
});

/** Local check that mirrors the server rules, so the user sees problems early. */
const validate = (form: FormState): string | null => {
  if (form.consumerName.trim().length < 2) return 'Consumer name is required (at least 2 characters).';
  if (form.address.trim().length < 5) return 'Consumer address is required.';
  if (form.consumerId && !/^[0-9]{5,20}$/.test(form.consumerId.trim())) {
    return 'Consumer ID must be 5 to 20 digits.';
  }

  const amount = Number(form.amount);
  if (!form.amount.trim()) return 'Agreement amount is required.';
  if (!Number.isFinite(amount) || amount < 0) return 'Amount must be a positive number.';

  if (form.agreementDate) {
    const picked = new Date(form.agreementDate);
    const limit = new Date();
    limit.setDate(limit.getDate() + 30);
    if (picked.getTime() > limit.getTime()) {
      return 'Agreement date cannot be more than 30 days in the future.';
    }
  }

  return null;
};

export function AgreementForm({
  initial = null,
  mode,
  submitting = false,
  defaults = null,
  quotationOptions = [],
  onSubmit,
}: AgreementFormProps) {
  const [form, setForm] = useState<FormState>(() =>
    initial ? fromAgreement(initial, defaults) : emptyForm(defaults)
  );

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validationMessage = useMemo(() => validate(form), [form]);

  const amountValue = Number(form.amount);
  const split = useMemo(
    () =>
      splitAgreementAmount(
        Number.isFinite(amountValue) ? amountValue : 0,
        defaults?.paymentStages?.length ? defaults.paymentStages : undefined
      ),
    [amountValue, defaults]
  );

  /** Pull the consumer details and amount from a chosen quotation. */
  const applyQuotation = (quotationId: string) => {
    set('quotation', quotationId);
    const quotation = quotationOptions.find((option) => option._id === quotationId);
    if (!quotation) return;

    setForm((prev) => ({
      ...prev,
      quotation: quotationId,
      consumerName: quotation.customerName || prev.consumerName,
      consumerId: quotation.consumerId || prev.consumerId,
      address: addressFromQuotation(quotation) || prev.address,
      amount:
        quotation.amount !== null && quotation.amount !== undefined
          ? String(quotation.amount)
          : prev.amount,
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (validationMessage) return;

    const payload: AgreementPayload = {
      consumerName: form.consumerName.trim(),
      consumerId: form.consumerId.trim(),
      relationLine: form.relationLine.trim(),
      address: form.address.trim(),
      discom: form.discom.trim().toUpperCase(),
      agreementDate: form.agreementDate,
      amount: Number(form.amount),
      notes: form.notes.trim(),
    };

    // The link is only sent on create: the number and amount are already stored.
    if (mode === 'create' && form.quotation) payload.quotation = form.quotation;

    void onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {mode === 'create' && quotationOptions.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            Start from a quotation <span className="font-normal text-[var(--muted)]">(optional)</span>
          </h3>
          <div className="field">
            <label className="form-label" htmlFor="agreement-quotation">
              Quotation
            </label>
            <select
              id="agreement-quotation"
              className="form-input"
              value={form.quotation}
              onChange={(event) => applyQuotation(event.target.value)}
            >
              <option value="">No quotation — type the details below</option>
              {quotationOptions.map((option) => (
                <option key={option._id} value={option._id}>
                  {option.quotationNo} — {option.customerName}
                  {option.amount != null ? ` — ${formatINR(option.amount)}` : ''}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Picking a quotation fills the consumer details and the amount. Everything stays editable —
              the agreement amount may differ from the quotation.
            </p>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">
          Consumer <span className="font-normal text-[var(--muted)]">(printed on page 1 and page 4)</span>
        </h3>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="field">
            <label className="form-label" htmlFor="agreement-consumer-name">
              Consumer name *
            </label>
            <input
              id="agreement-consumer-name"
              className="form-input"
              value={form.consumerName}
              onChange={(event) => set('consumerName', event.target.value)}
              placeholder="Aparna Pramanik"
            />
          </div>

          <div className="field">
            <label className="form-label" htmlFor="agreement-consumer-id">
              Consumer ID (DISCOM)
            </label>
            <input
              id="agreement-consumer-id"
              className="form-input"
              value={form.consumerId}
              onChange={(event) => set('consumerId', event.target.value)}
              placeholder="102370374"
              inputMode="numeric"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
          <div className="field">
            <label className="form-label" htmlFor="agreement-relation">
              Relation
            </label>
            <input
              id="agreement-relation"
              className="form-input"
              list="agreement-relation-options"
              value={form.relationLine}
              onChange={(event) => set('relationLine', event.target.value)}
              placeholder="W/o-dharanidhar Pramanick"
            />
            <datalist id="agreement-relation-options">
              {(defaults?.relationOptions ?? ['W/o-', 'S/o-', 'D/o-', 'C/o-']).map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </div>

          <div className="field">
            <label className="form-label" htmlFor="agreement-address">
              Address as printed *
            </label>
            <input
              id="agreement-address"
              className="form-input"
              value={form.address}
              onChange={(event) => set('address', event.target.value)}
              placeholder="Madaribar,gutinagori,shyampur,howrah, Pin- 711315"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="field">
            <label className="form-label" htmlFor="agreement-discom">
              DISCOM
            </label>
            <input
              id="agreement-discom"
              className="form-input"
              value={form.discom}
              onChange={(event) => set('discom', event.target.value)}
              placeholder="WBSEDCL"
            />
          </div>

          <div className="field">
            <label className="form-label" htmlFor="agreement-date">
              Agreement date *
            </label>
            <input
              id="agreement-date"
              type="date"
              className="form-input"
              value={form.agreementDate}
              onChange={(event) => set('agreementDate', event.target.value)}
            />
          </div>

          <div className="field">
            <label className="form-label" htmlFor="agreement-amount">
              Total amount (Rs.) *
            </label>
            <input
              id="agreement-amount"
              className="form-input"
              value={form.amount}
              onChange={(event) => set('amount', event.target.value)}
              placeholder="176000"
              inputMode="decimal"
            />
          </div>
        </div>

        <div className="field">
          <label className="form-label" htmlFor="agreement-notes">
            Internal notes
          </label>
          <textarea
            id="agreement-notes"
            className="form-input min-h-[60px]"
            value={form.notes}
            onChange={(event) => set('notes', event.target.value)}
            placeholder="Not printed on the agreement"
          />
        </div>
      </section>

      {/* Live preview of the 50 / 40 / 10 split that page 4 will print */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">
          Page 4 payment schedule{' '}
          <span className="font-normal text-[var(--muted)]">(50 / 40 / 10 of the amount above)</span>
        </h3>

        <div className="rounded-lg bg-[var(--surface-muted)] p-3">
          <p className="text-sm text-[var(--foreground)]">
            The cost of RTS system will be Rs.
            <strong>{formatAgreementTotal(Number.isFinite(amountValue) ? amountValue : 0)}</strong>/
          </p>
          <ul className="mt-2 space-y-1">
            {split.map((stage) => (
              <li key={stage.label} className="text-sm text-[var(--secondary)]">
                <span className="font-semibold text-[var(--foreground)]">
                  {stage.label} {stage.percent}%
                </span>{' '}
                — Rs. {stage.amountText}
              </li>
            ))}
          </ul>
          {!form.amount.trim() && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--muted)]">
              <FileSignature className="h-3.5 w-3.5" /> Enter the amount to see the split.
            </p>
          )}
        </div>
      </section>

      {validationMessage && (
        <p className="rounded-lg bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--error)]">
          {validationMessage}
        </p>
      )}

      <div className="flex items-center justify-end gap-3 border-t border-[var(--border-soft)] pt-4">
        <button
          type="submit"
          disabled={submitting || Boolean(validationMessage)}
          className="brand-button inline-flex items-center gap-1.5 px-4 py-2 text-sm disabled:opacity-60"
        >
          {submitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          {mode === 'create' ? 'Create agreement' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}

export default AgreementForm;

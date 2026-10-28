'use client';

import { useMemo, useState } from 'react';
import { Info } from 'lucide-react';
import type { CreateInstallationDto, InstallableApplication } from '@/lib/api/installations.api';
import { ApplicationPicker } from './ApplicationPicker';

interface InstallationFormProps {
  submitting?: boolean;
  disabled?: boolean;
  /** Pre-selected application (e.g. arriving from that application's page). */
  initialApplication?: InstallableApplication | null;
  onSubmit: (payload: CreateInstallationDto) => Promise<void> | void;
}

interface FormState {
  application: InstallableApplication | null;
  orderDate: string;
  installDate: string;
  laborCost: string;
  notes: string;
}

const emptyForm = (initial?: InstallableApplication | null): FormState => ({
  application: initial ?? null,
  orderDate: '',
  installDate: '',
  laborCost: '',
  notes: '',
});

function toNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed === '') return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}

function Field({ label, required, hint, children }: FieldProps) {
  return (
    <label className="block space-y-2">
      <span className="form-label">
        {label}
        {required && <span className="ml-1 text-[var(--error)]">*</span>}
      </span>
      {children}
      {hint && <span className="block text-xs text-[var(--muted-soft)]">{hint}</span>}
    </label>
  );
}

const inputClass = 'form-input w-full';

/** A value the installation does not get to decide — it comes from the application. */
function ReadOnlyValue({ value }: { value: string | null }) {
  return (
    <span className="flex min-h-[42px] items-center rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--surface-muted)] px-3 text-sm text-[var(--secondary)]">
      {value ? value : <span className="text-[var(--muted-soft)]">Not on the application</span>}
    </span>
  );
}

const roofLabel = (value: string | null) =>
  value ? value.replace(/_/g, ' ').replace(/^\w/, (char) => char.toUpperCase()) : null;

/**
 * New-installation form.
 *
 * Everything that identifies the job — the customer, the quotation number, the
 * system size and the roof type — is read from the application and shown
 * read-only. Retyping them was how an installation ended up disagreeing with the
 * quotation it was sold against. The project number is not typed at all: the
 * server assigns it from a serial counter on save.
 */
export function InstallationForm({
  submitting = false,
  disabled = false,
  initialApplication = null,
  onSubmit,
}: InstallationFormProps) {
  const [form, setForm] = useState<FormState>(() => emptyForm(initialApplication));
  const [formError, setFormError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const application = form.application;
  const systemSizeKW = application?.systemSizeKW ?? null;
  const roofType = application?.roofType ?? null;
  const quotationNo = application?.quotationNo ?? null;

  const customerId =
    application && application.customer && typeof application.customer === 'object'
      ? application.customer._id
      : typeof application?.customer === 'string'
        ? application.customer
        : undefined;

  const validationMessage = useMemo(() => {
    if (!application) return 'Select the application this installation is for.';
    if (systemSizeKW == null) return 'The application has no system size. Set it on the application first.';
    if (!roofType) return 'The application has no site type. Set it on the application first.';
    if (!form.installDate) return 'Installation date is required.';

    const labor = toNumber(form.laborCost);
    if (labor != null && labor < 0) return 'Labor cost cannot be negative.';
    if (form.notes.length > 1000) return 'Notes cannot exceed 1000 characters.';

    return null;
  }, [application, systemSizeKW, roofType, form.installDate, form.laborCost, form.notes]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }
    setFormError(null);

    const payload: CreateInstallationDto = {
      application: application!._id,
      customer: customerId,
      systemSizeKW: systemSizeKW as number,
      roofType: roofType as CreateInstallationDto['roofType'],
      quotationNo: quotationNo ?? undefined,
      orderDate: form.orderDate || undefined,
      installDate: form.installDate,
      laborCost: toNumber(form.laborCost) ?? 0,
      notes: form.notes.trim() || undefined,
    };

    void onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formError && (
        <div
          role="alert"
          className="rounded-lg border border-[var(--error)] bg-[var(--error-tint)] p-4 text-sm text-[var(--error)]"
        >
          {formError}
        </div>
      )}

      {/* Application */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Application</h3>
        <Field
          label="Application"
          required
          hint="Only applications whose installation has not been created yet are listed."
        >
          <ApplicationPicker
            value={form.application}
            disabled={disabled}
            onChange={(next) => set('application', next)}
          />
        </Field>

        {application && !customerId && (
          <p role="alert" className="text-xs text-[var(--error)]">
            This application has no customer linked, so an installation cannot be created from it.
          </p>
        )}
      </section>

      {/* From the application — read-only */}
      <section className="space-y-4 border-t border-[var(--border-soft)] pt-6">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">From the application</h3>
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[11px] text-[var(--muted)]">
            <Info className="h-3 w-3" /> read-only
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Consumer">
            <ReadOnlyValue value={application?.consumerName ?? null} />
          </Field>
          <Field label="Phone">
            <ReadOnlyValue value={application?.phone ?? null} />
          </Field>
          <Field label="Quotation number">
            <ReadOnlyValue value={quotationNo} />
          </Field>
          <Field label="Project number" hint="Assigned serially when the installation is saved.">
            <ReadOnlyValue value={null} />
          </Field>
        </div>
      </section>

      {/* System */}
      <section className="space-y-4 border-t border-[var(--border-soft)] pt-6">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">System specification</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="System size (kW)" required>
            <ReadOnlyValue value={systemSizeKW != null ? `${systemSizeKW} kW` : null} />
          </Field>
          <Field label="Roof type" required>
            <ReadOnlyValue value={roofLabel(roofType)} />
          </Field>
        </div>
      </section>

      {/* Timeline */}
      <section className="space-y-4 border-t border-[var(--border-soft)] pt-6">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Timeline & cost</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Order date">
            <input
              className={inputClass}
              type="date"
              value={form.orderDate}
              onChange={(e) => set('orderDate', e.target.value)}
            />
          </Field>
          <Field label="Installation date" required>
            <input
              className={inputClass}
              type="date"
              value={form.installDate}
              onChange={(e) => set('installDate', e.target.value)}
            />
          </Field>
          <Field label="Labor cost (₹)">
            <input
              className={inputClass}
              type="number"
              min={0}
              step="any"
              value={form.laborCost}
              onChange={(e) => set('laborCost', e.target.value)}
              placeholder="0"
            />
          </Field>
        </div>
      </section>

      {/* Notes */}
      <section className="space-y-4 border-t border-[var(--border-soft)] pt-6">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Notes</h3>
        <Field label="Notes">
          <textarea
            className={`${inputClass} min-h-[72px] resize-y`}
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Site notes, access instructions… (optional)"
            maxLength={1000}
          />
        </Field>
      </section>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          className="neutral-button"
          onClick={() => setForm(emptyForm(initialApplication))}
          disabled={submitting}
        >
          Reset
        </button>
        <button type="submit" className="brand-button" disabled={submitting || disabled}>
          {submitting ? 'Creating…' : 'Create & generate suggested BOM'}
        </button>
      </div>
    </form>
  );
}

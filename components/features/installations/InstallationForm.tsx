'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { CreateInstallationDto } from '@/lib/api/installations.api';
import type { Customer, RoofType } from '@/types/customer';
import { CustomerPicker, type CustomerPickResult } from './CustomerPicker';

const ROOF_TYPES: RoofType[] = ['rcc_rooftop', 'tin_shed', 'ground_mount'];

interface InstallationFormProps {
  submitting?: boolean;
  disabled?: boolean;
  /** Pre-selected customer (e.g. arriving from a customer's own page). */
  initialCustomer?: Customer | null;
  onSubmit: (payload: CreateInstallationDto) => Promise<void> | void;
}

interface FormState {
  customer: Customer | null;
  customerHasInstallation: boolean;
  projectNo: string;
  quotationNo: string;
  systemSizeKW: string;
  roofType: RoofType | '';
  orderDate: string;
  installDate: string;
  laborCost: string;
  notes: string;
}

const emptyForm = (initialCustomer?: Customer | null): FormState => ({
  customer: initialCustomer ?? null,
  customerHasInstallation: false,
  projectNo: '',
  quotationNo: '',
  systemSizeKW: '',
  roofType: '',
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
const selectClass = 'form-input w-full appearance-none';

/**
 * New-installation form. Validation mirrors backend/src/validations/
 * installation.validation.js (createInstallationValidation).
 */
export function InstallationForm({ submitting = false, disabled = false, initialCustomer = null, onSubmit }: InstallationFormProps) {
  const [form, setForm] = useState<FormState>(() => emptyForm(initialCustomer));
  const [formError, setFormError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validationMessage = useMemo(() => {
    if (!form.customer) return 'Select a customer.';
    if (form.customerHasInstallation) {
      return 'This customer already has an installation. Each customer can have only one.';
    }

    if (form.projectNo && form.projectNo.length > 50) return 'Project number cannot exceed 50 characters.';
    if (form.quotationNo && form.quotationNo.length > 50) return 'Quotation number cannot exceed 50 characters.';

    const size = toNumber(form.systemSizeKW);
    if (size == null) return 'System size in kW is required.';
    if (size < 0.1) return 'System size must be at least 0.1 kW.';
    if (size > 100) return 'System size cannot exceed 100 kW.';

    if (!form.roofType) return 'Roof type is required.';

    if (!form.installDate) return 'Installation date is required.';

    const labor = toNumber(form.laborCost);
    if (labor != null && labor < 0) return 'Labor cost cannot be negative.';

    if (form.notes.length > 1000) return 'Notes cannot exceed 1000 characters.';

    return null;
  }, [form]);

  const handleCustomerChange = (result: CustomerPickResult) => {
    set('customer', result.customer);
    set('customerHasInstallation', result.hasInstallation);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }
    setFormError(null);

    const payload: CreateInstallationDto = {
      customer: form.customer!._id,
      projectNo: form.projectNo.trim() || undefined,
      quotationNo: form.quotationNo.trim() || undefined,
      systemSizeKW: toNumber(form.systemSizeKW) as number,
      roofType: form.roofType as RoofType,
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
        <div role="alert" className="rounded-lg border border-[var(--error)] bg-[var(--error-tint)] p-4 text-sm text-[var(--error)]">
          {formError}
        </div>
      )}

      {form.customerHasInstallation && (
        <div role="alert" className="flex items-start gap-3 rounded-lg border border-[var(--warning)] bg-[var(--warning-tint)] p-4 text-sm text-[var(--warning)]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <strong>{form.customer?.name}</strong> already has an installation. Each customer can have only one installation, so this form is locked.
          </span>
        </div>
      )}

      {/* Customer */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Customer</h3>
        <Field label="Customer" required>
          <CustomerPicker
            value={form.customer}
            disabled={disabled}
            onChange={handleCustomerChange}
          />
        </Field>
      </section>

      {/* Project details */}
      <section className="space-y-4 border-t border-[var(--border-soft)] pt-6">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Project details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Project number">
            <input
              className={inputClass}
              value={form.projectNo}
              onChange={(e) => set('projectNo', e.target.value)}
              placeholder="Optional"
              maxLength={50}
            />
          </Field>
          <Field label="Quotation number">
            <input
              className={inputClass}
              value={form.quotationNo}
              onChange={(e) => set('quotationNo', e.target.value)}
              placeholder="Optional"
              maxLength={50}
            />
          </Field>
        </div>
      </section>

      {/* System */}
      <section className="space-y-4 border-t border-[var(--border-soft)] pt-6">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">System specification</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="System size (kW)" required hint="0.1 – 100 kW">
            <input
              className={inputClass}
              type="number"
              min={0.1}
              max={100}
              step="any"
              value={form.systemSizeKW}
              onChange={(e) => set('systemSizeKW', e.target.value)}
              placeholder="e.g. 3.1"
              disabled={form.customerHasInstallation}
            />
          </Field>
          <Field label="Roof type" required>
            <select
              className={selectClass}
              value={form.roofType}
              onChange={(e) => set('roofType', e.target.value as RoofType)}
              disabled={form.customerHasInstallation}
            >
              <option value="" disabled>
                Select roof type
              </option>
              {ROOF_TYPES.map((r) => (
                <option key={r} value={r}>
                  {r[0].toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
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
              disabled={form.customerHasInstallation}
            />
          </Field>
          <Field label="Installation date" required>
            <input
              className={inputClass}
              type="date"
              value={form.installDate}
              onChange={(e) => set('installDate', e.target.value)}
              disabled={form.customerHasInstallation}
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
              disabled={form.customerHasInstallation}
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
            disabled={form.customerHasInstallation}
          />
        </Field>
      </section>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          className="neutral-button"
          onClick={() => setForm(emptyForm(initialCustomer))}
          disabled={submitting}
        >
          Reset
        </button>
        <button
          type="submit"
          className="brand-button"
          disabled={submitting || form.customerHasInstallation || disabled}
        >
          {submitting ? (
            form.customerHasInstallation ? 'Creating…' : 'Creating…'
          ) : (
            'Create & generate suggested BOM'
          )}
        </button>
      </div>
    </form>
  );
}
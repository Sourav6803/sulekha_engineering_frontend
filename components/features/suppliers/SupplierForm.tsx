'use client';

import { useMemo, useState } from 'react';
import type { CreateSupplierDto, UpdateSupplierDto } from '@/lib/api/suppliers.api';
import type { SupplierDocument, SupplierBusinessType, SupplierPaymentTerms, SupplierStatus } from '@/types/supplier';

const BUSINESS_TYPES: SupplierBusinessType[] = ['manufacturer', 'distributor', 'wholesaler', 'retailer', 'importer'];
const PAYMENT_TERMS: SupplierPaymentTerms[] = ['advance', 'credit_7_days', 'credit_15_days', 'credit_30_days', 'credit_45_days'];
const STATUS_OPTIONS: SupplierStatus[] = ['active', 'inactive', 'suspended', 'blacklisted'];
const CATEGORIES = ['SPV Module', 'RCC Structure', 'Tin Shed Structure', 'AC Part', 'DC Cable', 'AC Cable', 'Earthing', 'Junction Box', 'Mounting Structure', 'Fasteners', 'Other'];

interface SupplierFormProps {
  initial?: SupplierDocument | null;
  mode: 'create' | 'edit';
  submitting?: boolean;
  onSubmit: (payload: CreateSupplierDto | UpdateSupplierDto) => Promise<void> | void;
}

interface FormState {
  name: string;
  phone: string;
  alternatePhone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstNumber: string;
  panNumber: string;
  businessType: SupplierBusinessType | '';
  categories: string[];
  bankAccountHolderName: string;
  bankName: string;
  bankAccountNumber: string;
  ifscCode: string;
  upiId: string;
  paymentTerms: SupplierPaymentTerms | '';
  creditLimit: string;
  qualityRating: string;
  status: SupplierStatus | '';
  notes: string;
}

const emptyForm = (): FormState => ({
  name: '',
  phone: '',
  alternatePhone: '',
  email: '',
  website: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  gstNumber: '',
  panNumber: '',
  businessType: '',
  categories: [],
  bankAccountHolderName: '',
  bankName: '',
  bankAccountNumber: '',
  ifscCode: '',
  upiId: '',
  paymentTerms: '',
  creditLimit: '',
  qualityRating: '',
  status: 'active',
  notes: '',
});

function fromSupplier(supplier: SupplierDocument): FormState {
  return {
    name: supplier.name ?? '',
    phone: supplier.phone ?? '',
    alternatePhone: supplier.alternatePhone ?? '',
    email: supplier.email ?? '',
    website: supplier.website ?? '',
    address: supplier.address ?? '',
    city: supplier.city ?? '',
    state: supplier.state ?? '',
    pincode: supplier.pincode ?? '',
    gstNumber: supplier.gstNumber ?? '',
    panNumber: supplier.panNumber ?? '',
    businessType: (supplier.businessType as SupplierBusinessType) ?? '',
    categories: supplier.categories ?? [],
    bankAccountHolderName: supplier.bankDetails?.accountHolderName ?? '',
    bankName: supplier.bankDetails?.bankName ?? '',
    bankAccountNumber: supplier.bankDetails?.accountNumber ?? '',
    ifscCode: supplier.bankDetails?.ifscCode ?? '',
    upiId: supplier.bankDetails?.upiId ?? '',
    paymentTerms: (supplier.paymentTerms as SupplierPaymentTerms) ?? '',
    creditLimit: supplier.creditLimit != null ? String(supplier.creditLimit) : '',
    qualityRating: supplier.qualityRating != null ? String(supplier.qualityRating) : '',
    status: (supplier.status as SupplierStatus) ?? 'active',
    notes: supplier.notes ?? '',
  };
}

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

function toggleCategory(current: string[], value: string) {
  return current.includes(value) ? current.filter((c) => c !== value) : [...current, value];
}

export function SupplierForm({ initial, mode, submitting = false, onSubmit }: SupplierFormProps) {
  const [form, setForm] = useState<FormState>(() => (initial ? fromSupplier(initial) : emptyForm()));
  const [formError, setFormError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validationMessage = useMemo(() => {
    if (!form.name.trim()) return 'Supplier name is required.';
    if (form.name.trim().length < 2) return 'Supplier name must be at least 2 characters.';
    if (!form.phone.trim()) return 'Phone number is required.';
    if (!/^[0-9]{10}$/.test(form.phone.trim())) return 'Please enter a valid 10-digit phone number.';
    if (!form.address.trim()) return 'Address is required.';
    if (!form.city.trim()) return 'City is required.';
    if (!form.state.trim()) return 'State is required.';
    if (!form.pincode.trim()) return 'Pincode is required.';
    if (!/^[0-9]{6}$/.test(form.pincode.trim())) return 'Please enter a valid 6-digit pincode.';

    const creditLimit = toNumber(form.creditLimit);
    if (creditLimit != null && creditLimit < 0) return 'Credit limit cannot be negative.';

    const qualityRating = toNumber(form.qualityRating);
    if (qualityRating != null && (qualityRating < 0 || qualityRating > 5)) return 'Quality rating must be between 0 and 5.';

    if (form.categories.length === 0) return 'Select at least one category.';

    return null;
  }, [form]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }
    setFormError(null);

    const payload: CreateSupplierDto & UpdateSupplierDto = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      alternatePhone: form.alternatePhone.trim() || undefined,
      email: form.email.trim() || undefined,
      website: form.website.trim() || undefined,
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
      gstNumber: form.gstNumber.trim() || undefined,
      panNumber: form.panNumber.trim() || undefined,
      businessType: form.businessType || undefined,
      categories: form.categories,
      paymentTerms: form.paymentTerms || undefined,
      creditLimit: toNumber(form.creditLimit),
      qualityRating: toNumber(form.qualityRating),
      status: form.status || 'active',
      notes: form.notes.trim() || undefined,
      bankDetails: {
        accountHolderName: form.bankAccountHolderName.trim() || undefined,
        bankName: form.bankName.trim() || undefined,
        accountNumber: form.bankAccountNumber.trim() || undefined,
        ifscCode: form.ifscCode.trim() || undefined,
        upiId: form.upiId.trim() || undefined,
      },
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

      {/* Basic Information */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Basic information</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Supplier name" required>
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. ABC Solar Solutions"
                maxLength={100}
              />
            </Field>
          </div>
          <Field label="Phone number" required>
            <input
              className={inputClass}
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="10-digit mobile number"
              maxLength={10}
            />
          </Field>
          <Field label="Alternate phone">
            <input
              className={inputClass}
              value={form.alternatePhone}
              onChange={(e) => set('alternatePhone', e.target.value)}
              placeholder="Optional alternate number"
              maxLength={10}
            />
          </Field>
          <Field label="Email">
            <input
              className={inputClass}
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="contact@example.com"
            />
          </Field>
          <Field label="Website">
            <input
              className={inputClass}
              type="url"
              value={form.website}
              onChange={(e) => set('website', e.target.value)}
              placeholder="https://example.com"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Address" required>
              <textarea
                className={inputClass}
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                placeholder="Street address, locality"
                rows={2}
              />
            </Field>
          </div>
          <Field label="City" required>
            <input
              className={inputClass}
              value={form.city}
              onChange={(e) => set('city', e.target.value)}
              placeholder="e.g. Durgapur"
            />
          </Field>
          <Field label="State" required>
            <input
              className={inputClass}
              value={form.state}
              onChange={(e) => set('state', e.target.value)}
              placeholder="e.g. West Bengal"
            />
          </Field>
          <Field label="Pincode" required>
            <input
              className={inputClass}
              value={form.pincode}
              onChange={(e) => set('pincode', e.target.value)}
              placeholder="6-digit pincode"
              maxLength={6}
            />
          </Field>
        </div>
      </section>

      {/* Business Details */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Business details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="GST number">
            <input
              className={inputClass}
              value={form.gstNumber}
              onChange={(e) => set('gstNumber', e.target.value.toUpperCase())}
              placeholder="e.g. 22AAAAA0000A1Z5"
              maxLength={15}
            />
          </Field>
          <Field label="PAN number">
            <input
              className={inputClass}
              value={form.panNumber}
              onChange={(e) => set('panNumber', e.target.value.toUpperCase())}
              placeholder="e.g. ABCDE1234F"
              maxLength={10}
            />
          </Field>
          <Field label="Business type">
            <select
              className={selectClass}
              value={form.businessType}
              onChange={(e) => set('businessType', e.target.value as SupplierBusinessType | '')}
            >
              <option value="">Select type</option>
              {BUSINESS_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              className={selectClass}
              value={form.status}
              onChange={(e) => set('status', e.target.value as SupplierStatus)}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status.toUpperCase()}
                </option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Categories">
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((category) => {
                  const selected = form.categories.includes(category);
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => set('categories', toggleCategory(form.categories, category))}
                      className={`badge-pill cursor-pointer border transition-colors ${
                        selected ? 'border-[var(--primary)] bg-[var(--primary-tint)] text-[var(--primary)]' : 'border-[var(--border)] bg-white text-[var(--muted)]'
                      }`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            </Field>
          </div>
        </div>
      </section>

      {/* Payment & Financial */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Payment &amp; financial</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Payment terms">
            <select
              className={selectClass}
              value={form.paymentTerms}
              onChange={(e) => set('paymentTerms', e.target.value as SupplierPaymentTerms | '')}
            >
              <option value="">Select terms</option>
              {PAYMENT_TERMS.map((term) => (
                <option key={term} value={term}>
                  {term.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Credit limit">
            <input
              className={inputClass}
              value={form.creditLimit}
              onChange={(e) => set('creditLimit', e.target.value)}
              placeholder="e.g. 100000"
              type="number"
              min={0}
            />
          </Field>
          <Field label="Quality rating (0-5)">
            <input
              className={inputClass}
              value={form.qualityRating}
              onChange={(e) => set('qualityRating', e.target.value)}
              placeholder="e.g. 4"
              type="number"
              min={0}
              max={5}
              step={0.1}
            />
          </Field>
        </div>
      </section>

      {/* Bank Details */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Bank details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Account holder name">
            <input
              className={inputClass}
              value={form.bankAccountHolderName}
              onChange={(e) => set('bankAccountHolderName', e.target.value)}
              placeholder="Name as per bank"
            />
          </Field>
          <Field label="Bank name">
            <input
              className={inputClass}
              value={form.bankName}
              onChange={(e) => set('bankName', e.target.value)}
              placeholder="e.g. State Bank of India"
            />
          </Field>
          <Field label="Account number">
            <input
              className={inputClass}
              value={form.bankAccountNumber}
              onChange={(e) => set('bankAccountNumber', e.target.value)}
              placeholder="Bank account number"
            />
          </Field>
          <Field label="IFSC code">
            <input
              className={inputClass}
              value={form.ifscCode}
              onChange={(e) => set('ifscCode', e.target.value.toUpperCase())}
              placeholder="e.g. SBIN0012345"
              maxLength={11}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="UPI ID">
              <input
                className={inputClass}
                value={form.upiId}
                onChange={(e) => set('upiId', e.target.value)}
                placeholder="e.g. example@upi"
              />
            </Field>
          </div>
        </div>
      </section>

      {/* Notes */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Notes</h3>
        <Field label="Additional notes">
          <textarea
            className={inputClass}
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Any additional notes about this supplier"
            rows={3}
            maxLength={1000}
          />
        </Field>
      </section>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          className="brand-button"
          disabled={submitting}
        >
          {submitting ? 'Saving...' : mode === 'create' ? 'Create supplier' : 'Update supplier'}
        </button>
      </div>
    </form>
  );
}

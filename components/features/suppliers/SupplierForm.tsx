'use client';

import { useState } from 'react';
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

function Field({ label, required, hint, children, error }: FieldProps & { error?: string }) {
  return (
    <label className="block space-y-2">
      <span className="form-label">
        {label}
        {required && <span className="ml-1 text-[var(--error)]">*</span>}
      </span>
      {children}
      {hint && <span className="block text-xs text-[var(--muted-soft)]">{hint}</span>}
      {error && <span className="block text-xs text-[var(--error)]">{error}</span>}
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
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validateField = (key: keyof FormState, value: FormState[keyof FormState]): string | undefined => {
    switch (key) {
      case 'name': {
        const v = value as string;
        if (!v.trim()) return 'Supplier name is required.';
        if (v.trim().length < 2) return 'Supplier name must be at least 2 characters.';
        if (v.trim().length > 100) return 'Supplier name cannot exceed 100 characters.';
        return undefined;
      }
      case 'phone': {
        const v = value as string;
        if (!v.trim()) return 'Phone number is required.';
        if (!/^[0-9]{10}$/.test(v.trim())) return 'Please enter a valid 10-digit phone number.';
        return undefined;
      }
      case 'alternatePhone': {
        const v = value as string;
        if (v.trim() && !/^[0-9]{10}$/.test(v.trim())) return 'Please enter a valid 10-digit phone number.';
        return undefined;
      }
      case 'email': {
        const v = value as string;
        if (v.trim() && !/^\S+@\S+\.\S+$/.test(v.trim())) return 'Please enter a valid email address.';
        return undefined;
      }
      case 'website': {
        const v = value as string;
        if (v.trim()) {
          try { new URL(v.trim()); }
          catch { return 'Please enter a valid website URL (e.g. https://example.com).'; }
        }
        return undefined;
      }
      case 'address':
        if (!(value as string).trim()) return 'Address is required.';
        return undefined;
      case 'city':
        if (!(value as string).trim()) return 'City is required.';
        return undefined;
      case 'state':
        if (!(value as string).trim()) return 'State is required.';
        return undefined;
      case 'pincode': {
        const v = value as string;
        if (!v.trim()) return 'Pincode is required.';
        if (!/^[0-9]{6}$/.test(v.trim())) return 'Please enter a valid 6-digit pincode.';
        return undefined;
      }
      case 'gstNumber': {
        const v = value as string;
        if (v.trim() && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v.trim())) return 'Please enter a valid GST number (e.g. 22AAAAA0000A1Z5).';
        return undefined;
      }
      case 'panNumber': {
        const v = value as string;
        if (v.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v.trim())) return 'Please enter a valid PAN number (e.g. ABCDE1234F).';
        return undefined;
      }
      case 'categories':
        if ((value as string[]).length === 0) return 'Select at least one category.';
        return undefined;
      case 'creditLimit': {
        const n = toNumber(value as string);
        if (n != null && n < 0) return 'Credit limit cannot be negative.';
        return undefined;
      }
      case 'qualityRating': {
        const n = toNumber(value as string);
        if (n != null && (n < 0 || n > 5)) return 'Quality rating must be between 0 and 5.';
        return undefined;
      }
      case 'ifscCode': {
        const v = value as string;
        if (v.trim() && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(v.trim())) return 'Please enter a valid IFSC code (e.g. SBIN0012345).';
        return undefined;
      }
      case 'upiId': {
        const v = value as string;
        if (v.trim() && !/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(v.trim())) return 'Please enter a valid UPI ID (e.g. example@upi).';
        return undefined;
      }
      default:
        return undefined;
    }
  };

  const handleBlur = (key: keyof FormState) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    const error = validateField(key, form[key]);
    setFieldErrors((prev) => ({ ...prev, [key]: error }));
  };

  const handleChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    set(key, value);
    if (fieldErrors[key]) {
      const error = validateField(key, value);
      setFieldErrors((prev) => ({ ...prev, [key]: error }));
    }
  };

  // const validateAll = (): boolean => {
  //   const keys: (keyof FormState)[] = ['name', 'phone', 'alternatePhone', 'email', 'website', 'address', 'city', 'state', 'pincode', 'gstNumber', 'panNumber', 'categories', 'creditLimit', 'qualityRating', 'ifscCode', 'upiId'];
  //   const errors: Partial<Record<keyof FormState, string>> = {};
  //   let hasError = false;
  //   for (const key of keys) {
  //     const error = validateField(key, form[key]);
  //     if (error) {
  //       errors[key] = error;
  //       hasError = true;
  //     }
  //   }
  //   setFieldErrors(errors);
  //   setTouched(
  //     keys.reduce((acc, key) => ({ ...acc, [key]: true }), {} as Record<keyof FormState, boolean>)
  //   );
  //   return hasError;
  // };


  const validateAll = (): boolean => {
    const keys: (keyof FormState)[] = ['name', 'phone', 'alternatePhone', 'email', 'website', 'address', 'city', 'state', 'pincode', 'gstNumber', 'panNumber', 'categories', 'creditLimit', 'qualityRating', 'ifscCode', 'upiId'];
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    let foundError = false;

    for (const key of keys) {
      const error = validateField(key, form[key]);
      if (error) {
        newErrors[key] = error;
        foundError = true;
      }
    }

    setFieldErrors(newErrors);
    setTouched(
      keys.reduce((acc, key) => ({ ...acc, [key]: true }), {} as Record<keyof FormState, boolean>)
    );

    return foundError;
  };
  
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validateAll()) {
      const firstError = Object.values(fieldErrors).find((e) => e) || 'Please fix the errors above.';
      setFormError(firstError);
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
            <Field label="Supplier name" required error={touched.name ? fieldErrors.name : undefined}>
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                onBlur={() => handleBlur('name')}
                placeholder="e.g. ABC Solar Solutions"
                maxLength={100}
              />
            </Field>
          </div>
          <Field label="Phone number" required error={touched.phone ? fieldErrors.phone : undefined}>
            <input
              className={inputClass}
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              onBlur={() => handleBlur('phone')}
              placeholder="10-digit mobile number"
              maxLength={10}
            />
          </Field>
          <Field label="Alternate phone" error={touched.alternatePhone ? fieldErrors.alternatePhone : undefined}>
            <input
              className={inputClass}
              value={form.alternatePhone}
              onChange={(e) => handleChange('alternatePhone', e.target.value)}
              onBlur={() => handleBlur('alternatePhone')}
              placeholder="Optional alternate number"
              maxLength={10}
            />
          </Field>
          <Field label="Email" error={touched.email ? fieldErrors.email : undefined}>
            <input
              className={inputClass}
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              placeholder="contact@example.com"
            />
          </Field>
          <Field label="Website" error={touched.website ? fieldErrors.website : undefined}>
            <input
              className={inputClass}
              type="url"
              value={form.website}
              onChange={(e) => handleChange('website', e.target.value)}
              onBlur={() => handleBlur('website')}
              placeholder="https://example.com"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Address" required error={touched.address ? fieldErrors.address : undefined}>
              <textarea
                className={inputClass}
                value={form.address}
                onChange={(e) => handleChange('address', e.target.value)}
                onBlur={() => handleBlur('address')}
                placeholder="Street address, locality"
                rows={2}
              />
            </Field>
          </div>
          <Field label="City" required error={touched.city ? fieldErrors.city : undefined}>
            <input
              className={inputClass}
              value={form.city}
              onChange={(e) => handleChange('city', e.target.value)}
              onBlur={() => handleBlur('city')}
              placeholder="e.g. Durgapur"
            />
          </Field>
          <Field label="State" required error={touched.state ? fieldErrors.state : undefined}>
            <input
              className={inputClass}
              value={form.state}
              onChange={(e) => handleChange('state', e.target.value)}
              onBlur={() => handleBlur('state')}
              placeholder="e.g. West Bengal"
            />
          </Field>
          <Field label="Pincode" required error={touched.pincode ? fieldErrors.pincode : undefined}>
            <input
              className={inputClass}
              value={form.pincode}
              onChange={(e) => handleChange('pincode', e.target.value)}
              onBlur={() => handleBlur('pincode')}
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
          <Field label="GST number" error={touched.gstNumber ? fieldErrors.gstNumber : undefined}>
            <input
              className={inputClass}
              value={form.gstNumber}
              onChange={(e) => handleChange('gstNumber', e.target.value.toUpperCase())}
              onBlur={() => handleBlur('gstNumber')}
              placeholder="e.g. 22AAAAA0000A1Z5"
              maxLength={15}
            />
          </Field>
          <Field label="PAN number" error={touched.panNumber ? fieldErrors.panNumber : undefined}>
            <input
              className={inputClass}
              value={form.panNumber}
              onChange={(e) => handleChange('panNumber', e.target.value.toUpperCase())}
              onBlur={() => handleBlur('panNumber')}
              placeholder="e.g. ABCDE1234F"
              maxLength={10}
            />
          </Field>
          <Field label="Business type" error={touched.businessType ? fieldErrors.businessType : undefined}>
            <select
              className={selectClass}
              value={form.businessType}
              onChange={(e) => handleChange('businessType', e.target.value as SupplierBusinessType | '')}
              onBlur={() => handleBlur('businessType')}
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
              onChange={(e) => handleChange('status', e.target.value as SupplierStatus)}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status.toUpperCase()}
                </option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Categories" error={touched.categories && fieldErrors.categories ? fieldErrors.categories : undefined}>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((category) => {
                  const selected = form.categories.includes(category);
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => {
                        handleChange('categories', toggleCategory(form.categories, category));
                        if (touched.categories) {
                          const error = validateField('categories', toggleCategory(form.categories, category));
                          setFieldErrors((prev) => ({ ...prev, categories: error }));
                        }
                      }}
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
              onChange={(e) => handleChange('paymentTerms', e.target.value as SupplierPaymentTerms | '')}
            >
              <option value="">Select terms</option>
              {PAYMENT_TERMS.map((term) => (
                <option key={term} value={term}>
                  {term.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Credit limit" error={touched.creditLimit ? fieldErrors.creditLimit : undefined}>
            <input
              className={inputClass}
              value={form.creditLimit}
              onChange={(e) => handleChange('creditLimit', e.target.value)}
              onBlur={() => handleBlur('creditLimit')}
              placeholder="e.g. 100000"
              type="number"
              min={0}
            />
          </Field>
          <Field label="Quality rating (0-5)" error={touched.qualityRating ? fieldErrors.qualityRating : undefined}>
            <input
              className={inputClass}
              value={form.qualityRating}
              onChange={(e) => handleChange('qualityRating', e.target.value)}
              onBlur={() => handleBlur('qualityRating')}
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
              onChange={(e) => handleChange('bankAccountHolderName', e.target.value)}
              placeholder="Name as per bank"
            />
          </Field>
          <Field label="Bank name">
            <input
              className={inputClass}
              value={form.bankName}
              onChange={(e) => handleChange('bankName', e.target.value)}
              placeholder="e.g. State Bank of India"
            />
          </Field>
          <Field label="Account number">
            <input
              className={inputClass}
              value={form.bankAccountNumber}
              onChange={(e) => handleChange('bankAccountNumber', e.target.value)}
              placeholder="Bank account number"
            />
          </Field>
          <Field label="IFSC code" error={touched.ifscCode ? fieldErrors.ifscCode : undefined}>
            <input
              className={inputClass}
              value={form.ifscCode}
              onChange={(e) => handleChange('ifscCode', e.target.value.toUpperCase())}
              onBlur={() => handleBlur('ifscCode')}
              placeholder="e.g. SBIN0012345"
              maxLength={11}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="UPI ID" error={touched.upiId ? fieldErrors.upiId : undefined}>
              <input
                className={inputClass}
                value={form.upiId}
                onChange={(e) => handleChange('upiId', e.target.value)}
                onBlur={() => handleBlur('upiId')}
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
          type="submit"
          className="brand-button"
          disabled={submitting}
        >
          {submitting ? 'Saving...' : mode === 'create' ? 'Create supplier' : 'Update supplier'}
        </button>
      </div>
    </form>
  );
}

'use client';

import { useMemo, useState } from 'react';
import type { CreateCustomerDto, UpdateCustomerDto } from '@/lib/api/customers.api';
import type { Customer, CustomerStatus, PreferredTimeSlot, RoofType } from '@/types/customer';
import { toast } from 'sonner';
import { customersApi } from '@/lib/api/customers.api';

const ROOF_TYPES: RoofType[] = ['rcc_rooftop', 'tin_shed', 'ground_mount'];
const TIME_SLOTS: PreferredTimeSlot[] = ['morning', 'afternoon', 'evening', 'anytime'];
const STATUSES: CustomerStatus[] = ['active', 'inactive', 'blocked', 'pending_verification'];

const PHONE_RE = /^[0-9]{10}$/;
const EMAIL_RE = /^\S+@\S+\.\S+$/;
const PINCODE_RE = /^[0-9]{6}$/;
const GST_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

interface CustomerFormProps {
  initial?: Customer | null;
  mode: 'create' | 'edit';
  submitting?: boolean;
  onSubmit: (payload: CreateCustomerDto | UpdateCustomerDto) => Promise<void> | void;
  onRefetch?: () => void;
}

interface FormState {
  name: string;
  phone: string;
  alternatePhone: string;
  email: string;
  address: string;
  village: string;
  block: string;
  panchayat: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  systemSizeKW: string;
  roofType: RoofType | '';
  roofArea: string;
  gstNumber: string;
  panNumber: string;
  preferredInstallationDate: string;
  preferredTimeSlot: PreferredTimeSlot | '';
  status: CustomerStatus | '';
  notes: string;
  referredBy: string;
}

const emptyForm = (): FormState => ({
  name: '',
  phone: '',
  alternatePhone: '',
  email: '',
  address: '',
  village: '',
  block: '',
  panchayat: '',
  landmark: '',
  city: '',
  state: '',
  pincode: '',
  systemSizeKW: '',
  roofType: '',
  roofArea: '',
  gstNumber: '',
  panNumber: '',
  preferredInstallationDate: '',
  preferredTimeSlot: '',
  status: '',
  notes: '',
  referredBy: '',
});

function toLocalDateInput(value: string | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
}

function fromCustomer(customer: Customer): FormState {
  return {
    name: customer.name ?? '',
    phone: customer.phone ?? '',
    alternatePhone: customer.alternatePhone ?? '',
    email: customer.email ?? '',
    address: customer.address ?? '',
    village: customer.village ?? '',
    block: customer.block ?? '',
    panchayat: customer.panchayat ?? '',
    landmark: customer.landmark ?? '',
    city: customer.city ?? '',
    state: customer.state ?? '',
    pincode: customer.pincode ?? '',
    systemSizeKW: customer.systemSizeKW != null ? String(customer.systemSizeKW) : '',
    roofType: customer.roofType ?? '',
    roofArea: customer.roofArea != null ? String(customer.roofArea) : '',
    gstNumber: customer.gstNumber ?? '',
    panNumber: customer.panNumber ?? '',
    preferredInstallationDate: toLocalDateInput(customer.preferredInstallationDate),
    preferredTimeSlot: customer.preferredTimeSlot ?? '',
    status: customer.status ?? '',
    notes: customer.notes ?? '',
    referredBy: customer.referredBy ?? '',
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

/**
 * Create/edit customer form. Validation mirrors backend/src/validations/
 * customer.validation.js so clients get immediate, consistent feedback.
 */
export function CustomerForm({ initial, mode, submitting = false, onSubmit, onRefetch }: CustomerFormProps) {
  const [form, setForm] = useState<FormState>(() => (initial ? fromCustomer(initial) : emptyForm()));
  const [formError, setFormError] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState<string>('');
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [uploadingDocument, setUploadingDocument] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validationMessage = useMemo(() => {
    if (!form.name.trim()) return 'Customer name is required.';
    if (form.name.trim().length < 2) return 'Customer name must be at least 2 characters.';
    if (form.name.trim().length > 100) return 'Customer name cannot exceed 100 characters.';

    if (!form.phone.trim()) return 'Phone number is required.';
    if (!PHONE_RE.test(form.phone.trim())) return 'Please enter a valid 10-digit phone number.';

    if (form.alternatePhone.trim() && !PHONE_RE.test(form.alternatePhone.trim())) {
      return 'Please enter a valid 10-digit alternate phone number.';
    }

    if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) return 'Please enter a valid email address.';

    if (!form.address.trim()) return 'Address is required.';
    if (form.address.trim().length > 500) return 'Address cannot exceed 500 characters.';
    if (!form.city.trim()) return 'City is required.';
    if (!form.state.trim()) return 'State is required.';

    if (!form.pincode.trim()) return 'Pincode is required.';
    if (!PINCODE_RE.test(form.pincode.trim())) return 'Please enter a valid 6-digit pincode.';

    const size = toNumber(form.systemSizeKW);
    if (size == null) return 'System size in kW is required.';
    if (size < 0.1) return 'System size must be at least 0.1 kW.';
    if (size > 100) return 'System size cannot exceed 100 kW.';

    if (!form.roofType) return 'Roof type is required.';

    const roofArea = toNumber(form.roofArea);
    if (roofArea != null && roofArea < 0) return 'Roof area cannot be negative.';
    if (roofArea != null && roofArea > 10000) return 'Roof area cannot exceed 10000 sq ft.';

    if (form.gstNumber.trim() && !GST_RE.test(form.gstNumber.trim())) return 'Please enter a valid GST number.';
    if (form.panNumber.trim() && !PAN_RE.test(form.panNumber.trim())) return 'Please enter a valid PAN number.';
    if (form.notes.length > 1000) return 'Notes cannot exceed 1000 characters.';

    return null;
  }, [form]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }
    setFormError(null);

    const payload: CreateCustomerDto & UpdateCustomerDto = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      alternatePhone: form.alternatePhone.trim() || undefined,
      email: form.email.trim() || undefined,
      address: form.address.trim(),
      village: form.village.trim() || undefined,
      block: form.block.trim() || undefined,
      panchayat: form.panchayat.trim() || undefined,
      landmark: form.landmark.trim() || undefined,
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
      systemSizeKW: toNumber(form.systemSizeKW) as number,
      roofType: form.roofType as RoofType,
      roofArea: toNumber(form.roofArea),
      gstNumber: form.gstNumber.trim().toUpperCase() || undefined,
      panNumber: form.panNumber.trim().toUpperCase() || undefined,
      preferredInstallationDate: form.preferredInstallationDate || undefined,
      preferredTimeSlot: (form.preferredTimeSlot as PreferredTimeSlot) || undefined,
      notes: form.notes.trim() || undefined,
      referredBy: form.referredBy.trim() || undefined,
    };

    if (mode === 'edit' && form.status) {
      payload.status = form.status as CustomerStatus;
    }

    void onSubmit(payload);
  };

  const handleDocumentUpload = async () => {
    if (!documentFiles.length || !documentType || !initial?._id) return;

    setUploadingDocument(true);
    try {
      const formData = new FormData();
      documentFiles.forEach((file) => {
        formData.append('documents', file);
      });
      formData.append('type', documentType);
      await customersApi.uploadDocument(initial._id, formData);
      setDocumentType('');
      setDocumentFiles([]);
      toast.success(`${documentFiles.length} document(s) uploaded`);
      onRefetch?.();
    } catch {
      toast.error('Failed to upload documents');
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!initial?._id) return;
    try {
      await customersApi.deleteDocument(initial._id, documentId);
      toast.success('Document deleted');
      onRefetch?.();
    } catch {
      toast.error('Failed to delete document');
    }
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

      {/* Personal information */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Personal information</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Full name" required>
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Rahul Sharma"
                maxLength={100}
              />
            </Field>
          </div>
          <Field label="Phone" required>
            <input
              className={inputClass}
              inputMode="numeric"
              maxLength={10}
              value={form.phone}
              onChange={(e) => set('phone', e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="10-digit mobile number"
            />
          </Field>
          <Field label="Alternate phone">
            <input
              className={inputClass}
              inputMode="numeric"
              maxLength={10}
              value={form.alternatePhone}
              onChange={(e) => set('alternatePhone', e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="Optional"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Email">
              <input
                className={inputClass}
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="name@example.com"
              />
            </Field>
          </div>
        </div>
      </section>

      {/* Address */}
      <section className="space-y-4 border-t border-[var(--border-soft)] pt-6">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Address</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Address" required>
              <textarea
                className={`${inputClass} min-h-[72px] resize-y`}
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                placeholder="Street, area, landmark…"
                maxLength={500}
              />
            </Field>
          </div>
          <Field label="Village">
            <input
              className={inputClass}
              value={form.village}
              onChange={(e) => set('village', e.target.value)}
              placeholder="Village name"
              maxLength={100}
            />
          </Field>
          <Field label="Block">
            <input
              className={inputClass}
              value={form.block}
              onChange={(e) => set('block', e.target.value)}
              placeholder="Block name"
              maxLength={100}
            />
          </Field>
          <Field label="Panchayat">
            <input
              className={inputClass}
              value={form.panchayat}
              onChange={(e) => set('panchayat', e.target.value)}
              placeholder="Panchayat name"
              maxLength={100}
            />
          </Field>
          <Field label="Landmark">
            <input
              className={inputClass}
              value={form.landmark}
              onChange={(e) => set('landmark', e.target.value)}
              placeholder="Nearby landmark"
              maxLength={200}
            />
          </Field>
          <Field label="City" required>
            <input
              className={inputClass}
              value={form.city}
              onChange={(e) => set('city', e.target.value)}
              placeholder="e.g. Jaipur"
            />
          </Field>
          <Field label="State" required>
            <input
              className={inputClass}
              value={form.state}
              onChange={(e) => set('state', e.target.value)}
              placeholder="e.g. Rajasthan"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Pincode" required>
              <input
                className={inputClass}
                inputMode="numeric"
                maxLength={6}
                value={form.pincode}
                onChange={(e) => set('pincode', e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="6-digit pincode"
              />
            </Field>
          </div>
        </div>
      </section>

      {/* System specifications */}
      <section className="space-y-4 border-t border-[var(--border-soft)] pt-6">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">System specifications</h3>
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
              placeholder="e.g. 5"
            />
          </Field>
          <Field label="Roof type" required>
            <select
              className={selectClass}
              value={form.roofType}
              onChange={(e) => set('roofType', e.target.value as RoofType)}
            >
              <option value="" disabled>
                Select roof type
              </option>
              {ROOF_TYPES.map((r) => (
                <option key={r} value={r}>
                  {r.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Roof area (sq ft)" hint="Available area in square feet">
            <input
              className={inputClass}
              type="number"
              min={0}
              max={10000}
              step="any"
              value={form.roofArea}
              onChange={(e) => set('roofArea', e.target.value)}
              placeholder="Optional"
            />
          </Field>
        </div>
      </section>

      {/* Business details */}
      <section className="space-y-4 border-t border-[var(--border-soft)] pt-6">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Business details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="GST number" hint="Only for business customers">
            <input
              className={inputClass}
              value={form.gstNumber}
              onChange={(e) => set('gstNumber', e.target.value.toUpperCase())}
              placeholder="Optional"
              maxLength={15}
            />
          </Field>
          <Field label="PAN number" hint="Only for business customers">
            <input
              className={inputClass}
              value={form.panNumber}
              onChange={(e) => set('panNumber', e.target.value.toUpperCase())}
              placeholder="Optional"
              maxLength={10}
            />
          </Field>
          <Field label="Referred by">
            <input
              className={inputClass}
              value={form.referredBy}
              onChange={(e) => set('referredBy', e.target.value)}
              placeholder="Name or reference (optional)"
              maxLength={100}
            />
          </Field>
        </div>
      </section>

      {/* Installation preferences */}
      <section className="space-y-4 border-t border-[var(--border-soft)] pt-6">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Installation preferences</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Preferred installation date">
            <input
              className={inputClass}
              type="date"
              value={form.preferredInstallationDate}
              onChange={(e) => set('preferredInstallationDate', e.target.value)}
            />
          </Field>
          <Field label="Preferred time slot">
            <select
              className={selectClass}
              value={form.preferredTimeSlot}
              onChange={(e) => set('preferredTimeSlot', e.target.value as PreferredTimeSlot)}
            >
              <option value="">No preference</option>
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot[0].toUpperCase() + slot.slice(1)}
                </option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes">
              <textarea
                className={`${inputClass} min-h-[72px] resize-y`}
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                placeholder="Additional remarks (optional)"
                maxLength={1000}
              />
            </Field>
          </div>
        </div>
      </section>

      {/* Status (edit only) */}
      {mode === 'edit' && (
        <section className="space-y-4 border-t border-[var(--border-soft)] pt-6">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Status</h3>
          <Field label="Customer status">
            <select
              className={selectClass}
              value={form.status}
              onChange={(e) => set('status', e.target.value as CustomerStatus)}
            >
              <option value="">Select status</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
          </Field>
        </section>
      )}

      {/* Documents (edit only) */}
      {mode === 'edit' && initial?.documents && (
        <section className="space-y-4 border-t border-[var(--border-soft)] pt-6">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Documents</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {initial.documents.map((doc) => (
              <div key={doc._id} className="flex items-center justify-between rounded-xl border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)]">{doc.fileName}</p>
                  <p className="text-xs text-[var(--muted-soft)]">
                    {doc.type.replace(/([A-Z])/g, ' $1').trim()} • {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ghost-button !px-3 !py-1.5 text-xs"
                  >
                    View
                  </a>
                  <button
                    type="button"
                    className="ghost-button !px-3 !py-1.5 text-xs text-[var(--error)]"
                    onClick={() => handleDeleteDocument(doc._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Upload new document */}
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Upload document" required>
              <select
                className={selectClass}
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
              >
                <option value="">Select document type</option>
                <option value="aadhar">Aadhar</option>
                <option value="voterId">Voter ID</option>
                <option value="panCard">PAN Card</option>
                <option value="passbookOrCheque">Passbook / Cheque</option>
                <option value="electricBill">Electric Bill</option>
                <option value="landRecord">Land Record</option>
                <option value="sitePhotoBefore">Site Photo Before</option>
                <option value="sitePhotoAfter">Site Photo After</option>
                <option value="loanApprovalLetter">Loan Approval Letter</option>
                <option value="rtsFeasibilityReport">RTS Feasibility Report</option>
                <option value="feasibilityApproval">Feasibility Approval</option>
                <option value="agreement">Agreement</option>
                <option value="quotation">Quotation</option>
                <option value="dcrCertificate">DCR Certificate</option>
                <option value="panelSerialNumber">Panel Serial Number</option>
              </select>
            </Field>
            <Field label="Files">
              <input
                type="file"
                multiple
                className="form-input w-full"
                accept="image/*,.pdf"
                onChange={(e) => setDocumentFiles(Array.from(e.target.files || []))}
              />
              {documentFiles.length > 0 && (
                <p className="mt-2 text-xs text-[var(--muted-soft)]">
                  {documentFiles.length} file(s) selected: {documentFiles.map(f => f.name).join(', ')}
                </p>
              )}
            </Field>
            <button
              type="button"
              className="brand-button"
              disabled={!documentType || documentFiles.length === 0 || uploadingDocument}
              onClick={handleDocumentUpload}
            >
              {uploadingDocument ? 'Uploading…' : `Upload ${documentFiles.length} file(s)`}
            </button>
          </div>
        </section>
      )}

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          className="neutral-button"
          onClick={() => setForm(initial ? fromCustomer(initial) : emptyForm())}
          disabled={submitting}
        >
          Reset
        </button>
        <button type="submit" className="brand-button" disabled={submitting}>
          {submitting ? (mode === 'create' ? 'Creating…' : 'Saving…') : mode === 'create' ? 'Create customer' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}

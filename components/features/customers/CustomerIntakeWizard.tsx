'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Save, Trash2, Upload } from 'lucide-react';
import { customersApi } from '@/lib/api/customers.api';
import { handleApiError } from '@/lib/errors/handleApiError';
import { StepConsumer } from '@/components/features/applications/wizard/StepConsumer';
import { StepSite } from '@/components/features/applications/wizard/StepSite';
import { StepDealLoan } from '@/components/features/applications/wizard/StepDealLoan';
import { SelectField, StepSection, TextField } from '@/components/features/applications/wizard/WizardFields';
import { emptyWizardForm, type WizardForm } from '@/components/features/applications/wizard/wizardTypes';
import type { ApplicationChecklist } from '@/types/application';
import type { Customer, CustomerDocument, RoofType } from '@/types/customer';

/**
 * The field visit, recorded as a customer.
 *
 * These are the same five screens the application wizard used to show an agent at
 * the consumer's house â€” consumer, site, deal & loan, bill, names. Nothing moved
 * out of them: the difference is what the answers are saved to. A visit produces a
 * Customer, and the office files the scheme application from that record later.
 *
 * Documents are attached on the customer page after saving, because they are
 * uploaded one file at a time with a type label, and losing a half-filled wizard
 * to a failed upload is not worth the tidier step.
 */

const STEP_TITLES = ['Consumer', 'Site & address', 'Deal & loan', 'Documents', 'Bill', 'Names'] as const;
const DOCUMENTS_STEP = 3;
const LAST_STEP = STEP_TITLES.length - 1;

/** Site types the checklist serves; mirrored here so the intake needs no extra call. */
const SITE_CHECKLIST = {
  siteTypes: [
    { value: 'rcc_rooftop', label: 'RCC rooftop' },
    { value: 'tin_shed', label: 'Tin shed' },
    { value: 'high_rise_structure', label: 'High-rise structure' },
    { value: 'ground_mount', label: 'Ground mount' },
  ],
} as unknown as ApplicationChecklist;

const ROOF_OPTIONS = [
  { value: 'rcc_rooftop', label: 'RCC rooftop' },
  { value: 'tin_shed', label: 'Tin shed' },
  { value: 'high_rise_structure', label: 'High-rise structure' },
  { value: 'ground_mount', label: 'Ground mount' },
];

/**
 * The papers collected at the house, in the order the agent reads them out.
 *
 * The types are the customer model's own enum values - `sitePhotoBefore` is the
 * rooftop photo - because the office carries these onto the application later,
 * and a kind the customer cannot store would have to be re-shot.
 */
const DOCUMENT_SLOTS = [
  { type: 'aadhar', label: 'Aadhaar card', hint: 'Front and back, one photo' },
  { type: 'panCard', label: 'PAN card', hint: 'If the consumer has one' },
  { type: 'passbookOrCheque', label: 'Bank passbook / cheque', hint: 'Page with account number and IFSC' },
  { type: 'electricBill', label: 'Electricity bill', hint: 'The bill for this connection' },
  { type: 'sitePhotoBefore', label: 'Rooftop photo', hint: 'The roof where the panels go' },
  { type: 'landRecord', label: 'Land record', hint: 'Mutation, rent receipt - if asked for' },
  { type: 'casteCertificate', label: 'Caste certificate', hint: 'Needed for an SC/ST household' },
] as const;

const toNumber = (value: string): number | undefined => {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export function CustomerIntakeWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<WizardForm>(() => emptyWizardForm());
  const [saving, setSaving] = useState(false);
  const [city, setCity] = useState('');
  const [state, setState] = useState('West Bengal');
  const [roofType, setRoofType] = useState<RoofType>('rcc_rooftop');

  const [savingStep, setSavingStep] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<CustomerDocument[]>([]);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  /* Bank details printed on the passbook. Typed rather than read off a photo,
     because this account is what the subsidy is paid into. */
  const [bankHolder, setBankHolder] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankBranch, setBankBranch] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  /** SC/ST households claim the higher subsidy, so the certificate is required. */
  const isScSt = form.category === 'sc' || form.category === 'st';

  const setField = <K extends keyof WizardForm>(key: K, value: WizardForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const firstMissing = (): string | null => {
    if (!form.consumerName.trim()) return 'Consumer name is required.';
    if (!/^[0-9]{10}$/.test(form.phone.trim())) return 'A 10-digit mobile number is required.';
    if (!form.address.street.trim()) return 'Street / house is required.';
    if (!city.trim()) return 'City is required.';
    if (!form.address.pincode.trim() || !/^[0-9]{6}$/.test(form.address.pincode.trim())) return 'A 6-digit pincode is required.';
    if (!toNumber(form.deal.systemSizeKW)) return 'System size is required.';
    return null;
  };

  const buildPayload = () => ({
        name: form.consumerName.trim(),
        phone: form.phone.trim(),
        alternatePhone: form.alternatePhone.trim() || undefined,
        aadhaarNumber: form.aadhaarNumber.trim() || undefined,
        panNumber: form.panNumber.trim() || undefined,
    email: form.email.trim() || undefined,
    category: (form.category || undefined) as Customer['category'],
    address: form.address.street.trim(),
        street: form.address.street.trim(),
        village: form.address.village.trim() || undefined,
        block: form.address.block.trim() || undefined,
        panchayat: form.address.panchayat.trim() || undefined,
        district: form.address.district.trim() || undefined,
        landmark: form.address.landmark.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        pincode: form.address.pincode.trim(),
        systemSizeKW: toNumber(form.deal.systemSizeKW),
        roofType,
        siteType: form.siteType || null,
        siteNotes: form.siteNotes.trim() || undefined,
        deal: {
          proposalAmount: toNumber(form.deal.proposalAmount),
          quotedAmount: toNumber(form.deal.quotedAmount),
          intentionToProceed: form.deal.intentionToProceed || null,
        },
        loan: {
          asked: form.loan.asked,
          hasExistingLoan: form.loan.hasExistingLoan,
          lenderName: form.loan.lenderName.trim() || undefined,
          outstandingAmount: toNumber(form.loan.outstandingAmount),
          monthlyEmi: toNumber(form.loan.monthlyEmi),
          consumerInformed: form.loan.consumerInformed,
          remark: form.loan.remark.trim() || undefined,
        },
        creditCheck: {
          bank: form.creditCheck.bank.trim() || undefined,
          method: form.creditCheck.method,
          score: form.creditCheck.score.trim() ? Number(form.creditCheck.score) : null,
          defaultOrWriteOff: form.creditCheck.defaultOrWriteOff,
          newToCredit: form.creditCheck.newToCredit,
          note: form.creditCheck.note.trim() || undefined,
        },
        electricBill: {
          consumerId: form.electricBill.consumerId.trim() || undefined,
          installationNo: form.electricBill.installationNo.trim() || undefined,
        },
    nameMatch: {
      consumerName: form.names.consumer.trim() || form.consumerName.trim(),
      aadhaarName: form.names.aadhaar.trim() || undefined,
      passbookName: form.names.passbook.trim() || undefined,
      electricBillName: form.names.electricBill.trim() || undefined,
    },
    bank: {
      accountHolderName: bankHolder.trim() || undefined,
      accountNumber: bankAccount.trim() || undefined,
      ifsc: bankIfsc.trim() || undefined,
      bankName: bankName.trim() || undefined,
      branch: bankBranch.trim() || undefined,
    },
  });

  /**
   * Create the record on first use, update it afterwards.
   *
   * Resolves to the customer id, or null when the form is not complete enough to
   * save - the caller keeps the agent on the current step rather than opening a
   * documents screen with nothing behind it.
   */
  const ensureCustomer = async (): Promise<string | null> => {
    const missing = firstMissing();
    if (missing) {
      toast.error('Finish the basics first', { description: missing });
      return null;
    }

    const payload = buildPayload();
    if (customerId) {
      await customersApi.update(customerId, payload);
      return customerId;
    }

    const response = await customersApi.create(payload);
    const created = (response as { data?: Customer }).data;
    if (!created?._id) throw new Error('The server did not return the new customer.');
    setCustomerId(created._id);
    setDocuments(created.documents ?? []);
    return created._id;
  };

  /** Documents live on the saved record, so re-read it after every change. */
  const refreshDocuments = async (id: string) => {
    const response = await customersApi.get(id);
    const record = (response as { data?: Customer }).data;
    setDocuments(record?.documents ?? []);
  };

  const handleUpload = async (type: string, file: File) => {
    if (!customerId) {
      toast.error('Save the customer first');
      return;
    }
    setUploadingType(type);
    try {
      const body = new FormData();
      body.append('type', type);
      body.append('documents', file);
      await customersApi.uploadDocument(customerId, body);
      await refreshDocuments(customerId);
      toast.success('Document uploaded');
    } catch (error) {
      toast.error('Upload failed', { description: handleApiError(error) });
    } finally {
      setUploadingType(null);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!customerId) return;
    setDeletingId(documentId);
    try {
      await customersApi.deleteDocument(customerId, documentId);
      await refreshDocuments(customerId);
    } catch (error) {
      toast.error('Could not remove the file', { description: handleApiError(error) });
    } finally {
      setDeletingId(null);
    }
  };

  /**
   * What the current step refuses to move on without.
   *
   * Runs before the step changes, so an agent cannot walk to "Save" leaving the
   * name, the address or the system size empty and only then meet a server 400.
   * The keys match the ones the step components read out of `errors`.
   */
  const validateStep = (index: number): Record<string, string> => {
    const found: Record<string, string> = {};

    if (index === 0) {
      if (!form.consumerName.trim()) found.consumerName = 'Consumer name is required.';
      if (!/^[0-9]{10}$/.test(form.phone.trim())) found.phone = 'Enter a 10-digit mobile number.';
      if (form.aadhaarNumber.trim() && !/^[0-9]{12}$/.test(form.aadhaarNumber.replace(/\D/g, ''))) {
        found.aadhaarNumber = 'Aadhaar must be 12 digits.';
      }
      if (form.email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) {
        found.email = 'Enter a valid email.';
      }
      if (!form.category) found.category = 'Choose the caste category.';
    }

    if (index === 1) {
      if (!form.address.street.trim()) found['address.street'] = 'Street / house is required.';
      if (!city.trim()) found.city = 'City is required.';
      if (!form.address.district) found['address.district'] = 'Choose the district.';
      if (!form.address.block.trim()) found['address.block'] = 'Block is required.';
      if (!form.address.panchayat.trim()) found['address.panchayat'] = 'Panchayat is required.';
      if (!form.address.village.trim()) found['address.village'] = 'Village is required.';
      if (!/^[0-9]{6}$/.test(form.address.pincode.trim())) found['address.pincode'] = 'Enter the 6-digit pincode.';
    }

    if (index === 2) {
      const size = Number(form.deal.systemSizeKW);
      if (!form.deal.systemSizeKW.trim() || !Number.isFinite(size) || size <= 0) {
        found['deal.systemSizeKW'] = 'System size is required.';
      } else if (size > 10) {
        found['deal.systemSizeKW'] = 'Maximum 10 kW.';
      }
    }

    if (index === DOCUMENTS_STEP && isScSt && !documents.some((entry) => entry.type === 'casteCertificate')) {
      found.__documents = 'Upload the caste certificate for an SC/ST household.';
    }

    return found;
  };

  const handleNext = async () => {
    const problems = validateStep(step);
    if (Object.keys(problems).length > 0) {
      setErrors(problems);
      toast.error(Object.values(problems)[0]);
      return;
    }
    setErrors({});

    const next = Math.min(LAST_STEP, step + 1);
    if (next === DOCUMENTS_STEP && !customerId) {
      setSavingStep(true);
      try {
        const id = await ensureCustomer();
        if (!id) return;
      } catch (error) {
        toast.error('Could not save the customer', { description: handleApiError(error) });
        return;
      } finally {
        setSavingStep(false);
      }
    }
    setStep(next);
  };

  const handleSave = async () => {
    /* Re-check every step here: an agent can jump back, blank a field and jump
       straight to the last page, so the last page cannot trust the earlier gates. */
    const problems = { ...validateStep(0), ...validateStep(1), ...validateStep(2), ...validateStep(DOCUMENTS_STEP) };
    if (Object.keys(problems).length > 0) {
      setErrors(problems);
      toast.error(Object.values(problems)[0]);
      return;
    }

    setSaving(true);
    try {
      const id = await ensureCustomer();
      if (!id) return;
      toast.success('Customer saved - waiting for office verification', {
        description:
          documents.length === 0 ? 'No documents attached yet.' : `${documents.length} document(s) on file.`,
      });
      router.push(`/customers/${id}`);
    } catch (error) {
      toast.error('Could not save the customer', { description: handleApiError(error) });
    } finally {
      setSaving(false);
    }
  };

  const documentFor = (type: string) => documents.find((entry) => entry.type === type);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <div className="panel p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--primary-active)]">
            Step {step + 1} of {STEP_TITLES.length}
          </p>
          <p className="text-sm font-medium text-[var(--foreground)]">{STEP_TITLES[step]}</p>
        </div>

        <div className="mt-4">
          {step === 0 && <StepConsumer form={form} setForm={setForm} errors={errors} />}

          {step === 1 && (
            <div className="space-y-4">
              <StepSite
                form={form}
                setForm={setForm}
                errors={errors}
                checklist={SITE_CHECKLIST}
                checklistLoading={false}
                checklistError={null}
              />
              <StepSection
                title="Office fields"
                description="Kept on the customer record; the discom paperwork needs them."
              >
                <div className="grid gap-4 sm:grid-cols-3">
                  <TextField id="city" label="City" value={city} onValueChange={setCity} required error={errors.city} />
                  <TextField
                    id="state"
                    label="State"
                    value={state}
                    onValueChange={setState}
                    readOnly
                    hint="Fixed — this vendor files only in West Bengal."
                  />
                  <SelectField
                    id="roofType"
                    label="Roof type"
                    value={roofType}
                    onValueChange={(value) => setRoofType(value as RoofType)}
                    options={ROOF_OPTIONS}
                    required
                  />
                </div>
              </StepSection>
            </div>
          )}

          {step === 2 && <StepDealLoan form={form} setForm={setForm} errors={errors} />}

          {step === DOCUMENTS_STEP && (
            <div className="space-y-4">
              <StepSection
                title="Documents"
                description="Photograph each paper at the house. The office reads them here before verifying."
              >
                {errors.__documents && (
                  <p className="mb-2 rounded-[0.9rem] border border-[var(--warning)] bg-[var(--warning-tint)] px-3 py-2 text-xs text-[var(--warning)]">
                    {errors.__documents}
                  </p>
                )}
                <ul className="space-y-2">
                  {DOCUMENT_SLOTS.filter((slot) => slot.type !== 'casteCertificate' || isScSt).map((slot) => {
                    const stored = documentFor(slot.type);
                    return (
                      <li
                        key={slot.type}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-[0.9rem] border border-[var(--border-soft)] px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[var(--foreground)]">{slot.label}</p>
                          <p className="text-[11px] text-[var(--muted)]">{stored ? stored.fileName : slot.hint}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          {stored ? (
                            <>
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--success)]">
                                <CheckCircle2 className="h-3.5 w-3.5" /> On file
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDelete(stored._id)}
                                disabled={deletingId === stored._id}
                                className="ghost-button !px-2 !py-1.5 text-[var(--danger)]"
                                aria-label={`Remove ${slot.label}`}
                              >
                                {deletingId === stored._id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </>
                          ) : (
                            <label className="neutral-button inline-flex cursor-pointer items-center gap-1.5 px-3 py-1.5 text-xs">
                              {uploadingType === slot.type ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Upload className="h-3.5 w-3.5" />
                              )}
                              {uploadingType === slot.type ? 'Uploading...' : 'Upload'}
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                className="hidden"
                                disabled={uploadingType !== null}
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  event.target.value = '';
                                  if (file) void handleUpload(slot.type, file);
                                }}
                              />
                            </label>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </StepSection>

              <StepSection
                title="Bank details"
                description="From the passbook. The subsidy is paid into this account, so it is typed, not guessed."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField id="bankHolder" label="Account holder" value={bankHolder} onValueChange={setBankHolder} />
                  <TextField id="bankAccount" label="Account number" value={bankAccount} onValueChange={setBankAccount} />
                  <TextField
                    id="bankIfsc"
                    label="IFSC"
                    value={bankIfsc}
                    onValueChange={(value) => setBankIfsc(value.toUpperCase())}
                  />
                  <TextField id="bankName" label="Bank" value={bankName} onValueChange={setBankName} />
                  <TextField id="bankBranch" label="Branch" value={bankBranch} onValueChange={setBankBranch} />
                </div>
              </StepSection>
            </div>
          )}

          {step === 4 && (
            <StepSection title="Electricity bill" description="The two ids printed on the consumer's bill.">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  id="consumerId"
                  label="Consumer ID"
                  value={form.electricBill.consumerId}
                  onValueChange={(value) =>
                    setField('electricBill', { ...form.electricBill, consumerId: value.toUpperCase() })
                  }
                />
                <TextField
                  id="installationNo"
                  label="Installation number"
                  value={form.electricBill.installationNo}
                  onValueChange={(value) =>
                    setField('electricBill', { ...form.electricBill, installationNo: value.toUpperCase() })
                  }
                />
              </div>
            </StepSection>
          )}

          {step === 5 && (
            <StepSection
              title="Names on the papers"
              description="Read the name off each document exactly as printed â€” the office compares them."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  id="consumerNameOnPapers"
                  label="Name on the application"
                  value={form.names.consumer}
                  onValueChange={(value) => setField('names', { ...form.names, consumer: value })}
                  hint="As typed on the first page; defaults to the consumer name."
                />
                <TextField
                  id="passbookName"
                  label="Name on passbook"
                  value={form.names.passbook}
                  onValueChange={(value) => setField('names', { ...form.names, passbook: value })}
                />
                <TextField
                  id="aadhaarName"
                  label="Name on Aadhaar"
                  value={form.names.aadhaar}
                  onValueChange={(value) => setField('names', { ...form.names, aadhaar: value })}
                />
                <TextField
                  id="billName"
                  label="Name on electricity bill"
                  value={form.names.electricBill}
                  onValueChange={(value) => setField('names', { ...form.names, electricBill: value })}
                />
              </div>
            </StepSection>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-[var(--border-soft)] pt-4">
          <button
            type="button"
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            disabled={step === 0 || saving}
            className="neutral-button inline-flex items-center gap-1.5 px-4 py-2.5 text-sm disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          {step === LAST_STEP ? (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="primary-button inline-flex items-center gap-1.5 px-4 py-2.5 text-sm"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save customer
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              disabled={savingStep}
              className="primary-button inline-flex items-center gap-1.5 px-4 py-2.5 text-sm disabled:opacity-60"
            >
              {savingStep ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Next <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <aside className="panel h-fit p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">At the house</p>
        <ol className="mt-3 space-y-2 text-sm">
          {STEP_TITLES.map((title, index) => (
            <li
              key={title}
              className={`flex items-center gap-2 ${
                index === step ? 'font-semibold text-[var(--foreground)]' : 'text-[var(--muted)]'
              }`}
            >
              <span
                className={`grid h-6 w-6 place-items-center rounded-full text-[11px] ${
                  index === step
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--surface-muted)] text-[var(--muted)]'
                }`}
              >
                {index + 1}
              </span>
              {title}
            </li>
          ))}
        </ol>
        <p className="mt-4 rounded-[0.9rem] bg-[var(--surface-muted)] px-3 py-2.5 text-[11px] leading-5 text-[var(--muted)]">
          Saving puts the customer in <strong>pending verification</strong>. Only the office can clear it, and only a
          cleared customer can become a scheme application.
        </p>
      </aside>
    </div>
  );
}


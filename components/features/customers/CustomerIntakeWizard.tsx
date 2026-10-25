'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Loader2, Save } from 'lucide-react';
import { customersApi } from '@/lib/api/customers.api';
import { handleApiError } from '@/lib/errors/handleApiError';
import { StepConsumer } from '@/components/features/applications/wizard/StepConsumer';
import { StepSite } from '@/components/features/applications/wizard/StepSite';
import { StepDealLoan } from '@/components/features/applications/wizard/StepDealLoan';
import { SelectField, StepSection, TextField } from '@/components/features/applications/wizard/WizardFields';
import { emptyWizardForm, type WizardForm } from '@/components/features/applications/wizard/wizardTypes';
import type { ApplicationChecklist } from '@/types/application';
import type { RoofType } from '@/types/customer';

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

const STEP_TITLES = ['Consumer', 'Site & address', 'Deal & loan', 'Electricity bill', 'Names'] as const;

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

  const errors = useMemo<Record<string, string>>(() => ({}), []);

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

  const handleSave = async () => {
    const missing = firstMissing();
    if (missing) {
      toast.error(missing);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.consumerName.trim(),
        phone: form.phone.trim(),
        alternatePhone: form.alternatePhone.trim() || undefined,
        aadhaarNumber: form.aadhaarNumber.trim() || undefined,
        panNumber: form.panNumber.trim() || undefined,
        email: form.email.trim() || undefined,
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
          consumerName: form.consumerName.trim(),
          aadhaarName: form.names.aadhaar.trim() || undefined,
          passbookName: form.names.passbook.trim() || undefined,
          electricBillName: form.names.electricBill.trim() || undefined,
        },
      };

      const response = await customersApi.create(payload);
      const created = (response as { data?: { _id?: string } }).data;
      if (!created?._id) throw new Error('The server did not return the new customer.');

      toast.success('Customer saved â€” waiting for office verification', {
        description: 'Attach the Aadhaar, bill and passbook photos on the customer page.',
      });
      router.push(`/customers/${created._id}`);
    } catch (error) {
      toast.error('Could not save the customer', { description: handleApiError(error) });
    } finally {
      setSaving(false);
    }
  };

  const isLast = step === STEP_TITLES.length - 1;

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
                  <TextField id="city" label="City" value={city} onValueChange={setCity} required />
                  <TextField id="state" label="State" value={state} onValueChange={setState} required />
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

          {step === 3 && (
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

          {step === 4 && (
            <StepSection
              title="Names on the papers"
              description="Read the name off each document exactly as printed â€” the office compares them."
            >
              <div className="grid gap-4 sm:grid-cols-2">
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

          {isLast ? (
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
              onClick={() => setStep((current) => Math.min(STEP_TITLES.length - 1, current + 1))}
              className="primary-button inline-flex items-center gap-1.5 px-4 py-2.5 text-sm"
            >
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


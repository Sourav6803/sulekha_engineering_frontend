'use client';

import { AlertTriangle, IndianRupee } from 'lucide-react';
import { CheckboxField, ChoiceField, SelectField, StepSection, TextAreaField, TextField } from './WizardFields';
import type { ApplicationIntention } from '@/types/application';
import type { WizardStepProps } from './wizardTypes';

const INTENTION_OPTIONS = [
  { value: 'yes', label: 'Ready to proceed' },
  { value: 'no', label: 'Not interested' },
  { value: 'undecided', label: 'Undecided' },
];

const YES_NO = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

/**
 * Step 3 — what was proposed, and the loan question.
 *
 * The loan question is mandatory on the paper checklist: "consumer ka pehle se
 * koi loan chal raha hai ya nahi, wo inform karna hoga". The server enforces it
 * (`collectSubmitIssues` refuses a submit until `loan.asked` and
 * `loan.hasExistingLoan` are both recorded), so it is asked here as an explicit
 * pair rather than a checkbox that can be left alone.
 */
export function StepDealLoan({ form, setForm, errors, disabled }: WizardStepProps) {
  const hasExistingLoan = form.loan.hasExistingLoan;

  return (
    <div className="space-y-4">
      <StepSection title="Proposal" description="The size quoted to the consumer and what was proposed.">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="deal-size"
            label="System size (kW)"
            required
            value={form.deal.systemSizeKW}
            onValueChange={(value) => setForm((prev) => ({ ...prev, deal: { ...prev.deal, systemSizeKW: value } }))}
            placeholder="e.g. 3"
            numeric
            allowDecimal
            error={errors['deal.systemSizeKW']}
            disabled={disabled}
          />

          <TextField
            id="deal-proposal"
            label="Proposal amount (₹)"
            required
            value={form.deal.proposalAmount}
            onValueChange={(value) => setForm((prev) => ({ ...prev, deal: { ...prev.deal, proposalAmount: value } }))}
            placeholder="e.g. 145000"
            numeric
            error={errors['deal.proposalAmount']}
            disabled={disabled}
          />

          <TextField
            id="deal-quoted"
            label="Quoted amount (₹)"
            value={form.deal.quotedAmount}
            onValueChange={(value) => setForm((prev) => ({ ...prev, deal: { ...prev.deal, quotedAmount: value } }))}
            placeholder="Optional — if it differs"
            numeric
            error={errors['deal.quotedAmount']}
            disabled={disabled}
          />

          <SelectField
            id="deal-intention"
            label="Intention to proceed"
            value={form.deal.intentionToProceed}
            onValueChange={(value) =>
              setForm((prev) => ({
                ...prev,
                deal: { ...prev.deal, intentionToProceed: value as ApplicationIntention | '' },
              }))
            }
            options={INTENTION_OPTIONS}
            placeholder="Not recorded"
            error={errors['deal.intentionToProceed']}
            disabled={disabled}
          />
        </div>

        <p className="mt-3 flex items-start gap-2 rounded-[1rem] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-2.5 text-[11px] leading-5 text-[var(--muted)]">
          <IndianRupee className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--secondary)]" />
          <span className="min-w-0">
            Amounts are in rupees and stored as numbers. The proposal amount is what the office quotes against.
          </span>
        </p>
      </StepSection>

      <StepSection
        title="Existing loan"
        description="Mandatory: consumer ka pehle se koi loan chal raha hai ya nahi, wo inform karna hoga."
      >
        <div className="space-y-3">
          <CheckboxField
            id="loan-asked"
            label="I asked the consumer whether they already have a loan running."
            checked={form.loan.asked}
            onChange={(checked) => setForm((prev) => ({ ...prev, loan: { ...prev.loan, asked: checked } }))}
            hint="A running loan changes how the subsidy is routed, so the office has to know before processing."
          />
          {errors['loan.asked'] && (
            <p role="alert" className="text-[11px] leading-4 text-[var(--error)]">
              {errors['loan.asked']}
            </p>
          )}

          <ChoiceField
            id="loan-exists"
            label="Does the consumer already have a loan running?"
            required
            value={hasExistingLoan === null ? '' : hasExistingLoan ? 'yes' : 'no'}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                loan: {
                  ...prev.loan,
                  // Answering the question is what "asked" means in practice.
                  asked: true,
                  hasExistingLoan: value === '' ? null : value === 'yes',
                },
              }))
            }
            options={YES_NO}
            error={errors['loan.hasExistingLoan']}
          />

          {hasExistingLoan === true && (
            <div className="grid gap-4 rounded-[1rem] border border-[var(--warning)] bg-[var(--warning-tint)] p-3 sm:grid-cols-3">
              <div className="sm:col-span-3 flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--warning)]" />
                <p className="min-w-0 text-[11px] leading-5 text-[var(--warning)]">
                  A live loan is on record. Name the lender and note the outstanding so the office can route the subsidy
                  correctly.
                </p>
              </div>

              <div className="sm:col-span-3">
                <TextField
                  id="loan-lender"
                  label="Lender / bank name"
                  required
                  value={form.loan.lenderName}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, loan: { ...prev.loan, lenderName: value } }))}
                  placeholder="e.g. SBI, Bangiya Gramin Vikash Bank"
                  maxLength={200}
                  error={errors['loan.lenderName']}
                  disabled={disabled}
                  compact
                />
              </div>

              <TextField
                id="loan-outstanding"
                label="Outstanding (₹)"
                value={form.loan.outstandingAmount}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, loan: { ...prev.loan, outstandingAmount: value } }))
                }
                inputMode="numeric"
                error={errors['loan.outstandingAmount']}
                disabled={disabled}
                compact
              />

              <TextField
                id="loan-emi"
                label="Monthly EMI (₹)"
                value={form.loan.monthlyEmi}
                onValueChange={(value) => setForm((prev) => ({ ...prev, loan: { ...prev.loan, monthlyEmi: value } }))}
                inputMode="numeric"
                error={errors['loan.monthlyEmi']}
                disabled={disabled}
                compact
              />
            </div>
          )}

          <CheckboxField
            id="loan-informed"
            label="I explained to the consumer how a running loan affects the subsidy."
            checked={form.loan.consumerInformed}
            onChange={(checked) => setForm((prev) => ({ ...prev, loan: { ...prev.loan, consumerInformed: checked } }))}
          />

          <TextAreaField
            id="loan-remark"
            label="Loan remark"
            value={form.loan.remark}
            onValueChange={(value) => setForm((prev) => ({ ...prev, loan: { ...prev.loan, remark: value } }))}
            placeholder="Anything the office should know about the existing loan…"
            rows={3}
            maxLength={1000}
            error={errors['loan.remark']}
            disabled={disabled}
          />
        </div>
      </StepSection>
    </div>
  );
}

export default StepDealLoan;

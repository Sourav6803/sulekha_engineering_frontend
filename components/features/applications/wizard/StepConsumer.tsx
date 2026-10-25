'use client';

import { UserRound } from 'lucide-react';
import { StepSection, TextField } from './WizardFields';
import type { WizardStepProps } from './wizardTypes';

/**
 * Step 1 — the consumer's identity.
 *
 * `consumerName` and `phone` are the two fields the create endpoint insists on;
 * everything else here can be filled from the documents and is only required to
 * *submit*, which the completeness panel on the last step keeps pointing out.
 */
export function StepConsumer({ form, setForm, errors, disabled }: WizardStepProps) {
  return (
    <div className="space-y-4">
      <StepSection
        title="Consumer details"
        description="Name and mobile number open the draft — the rest can come off the documents."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="consumer-name"
            label="Consumer name"
            required
            value={form.consumerName}
            onValueChange={(value) => setForm((prev) => ({ ...prev, consumerName: value }))}
            placeholder="As printed on the Aadhaar"
            autoComplete="name"
            maxLength={100}
            error={errors.consumerName}
            disabled={disabled}
          />

          <TextField
            id="consumer-phone"
            label="Mobile number"
            required
            value={form.phone}
            onValueChange={(value) => setForm((prev) => ({ ...prev, phone: value }))}
            placeholder="10-digit mobile"
            inputMode="tel"
            autoComplete="tel"
            error={errors.phone}
            disabled={disabled}
          />

          <TextField
            id="consumer-alt-phone"
            label="Alternate mobile"
            value={form.alternatePhone}
            onValueChange={(value) => setForm((prev) => ({ ...prev, alternatePhone: value }))}
            placeholder="Optional — family contact"
            inputMode="tel"
            error={errors.alternatePhone}
            disabled={disabled}
          />

          <TextField
            id="consumer-email"
            label="Email"
            type="email"
            value={form.email}
            onValueChange={(value) => setForm((prev) => ({ ...prev, email: value }))}
            placeholder="Optional"
            autoComplete="email"
            error={errors.email}
            disabled={disabled}
          />

          <TextField
            id="consumer-aadhaar"
            label="Aadhaar number"
            value={form.aadhaarNumber}
            onValueChange={(value) => setForm((prev) => ({ ...prev, aadhaarNumber: value }))}
            placeholder="12 digits"
            inputMode="numeric"
            hint="Spaces and dashes are fine."
            error={errors.aadhaarNumber}
            disabled={disabled}
          />

          <TextField
            id="consumer-pan"
            label="PAN number"
            value={form.panNumber}
            onValueChange={(value) => setForm((prev) => ({ ...prev, panNumber: value.toUpperCase() }))}
            placeholder="e.g. ABCDE1234F"
            hint="Name and PAN must be readable on the card."
            error={errors.panNumber}
            disabled={disabled}
          />
        </div>
      </StepSection>

      <p className="flex items-start gap-2 rounded-[1rem] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-2.5 text-[11px] leading-5 text-[var(--muted)]">
        <UserRound className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--secondary)]" />
        <span className="min-w-0">
          Aadhaar and PAN are both needed before the file can be submitted. One consumer can hold only one PM Surya
          Ghar application — the server will tell you if one already exists.
        </span>
      </p>
    </div>
  );
}

export default StepConsumer;

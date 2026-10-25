'use client';

import Link from 'next/link';
import { ExternalLink, UserRound } from 'lucide-react';
import { StepSection } from './WizardFields';
import type { WizardStepProps } from './wizardTypes';

/**
 * Step 1 — the consumer's identity, read back from the customer record.
 *
 * These fields used to be typed here, a second time, after the agent had already
 * taken the same details at the customer's house. Two copies of a name and an
 * Aadhaar is how one household ends up as two records, so this step is now a
 * summary: it shows what the customer holds, and sends you there to change it.
 *
 * PAN and Aadhaar are shown masked — this screen is often read over a shoulder.
 */

/** Populated or raw id, depending on what the API returned. */
function customerIdOf(application: WizardStepProps['application']): string | null {
  const customer = application?.customer;
  if (!customer) return null;
  if (typeof customer === 'string') return customer;
  const id = (customer as { _id?: string })._id;
  return typeof id === 'string' ? id : null;
}

const dash = (value?: string | null) => (value && value.trim() ? value : '—');

const maskAadhaar = (value?: string | null) => {
  const digits = (value ?? '').replace(/\D/g, '');
  return digits.length === 12 ? `•••• •••• ${digits.slice(-4)}` : '—';
};

export function StepConsumer({ form, application }: WizardStepProps) {
  const customerId = customerIdOf(application);

  const rows: Array<{ label: string; value: string; muted?: boolean }> = [
    { label: 'Name', value: dash(form.consumerName) },
    { label: 'Mobile', value: dash(form.phone) },
    { label: 'Alternate mobile', value: dash(form.alternatePhone), muted: !form.alternatePhone },
    { label: 'Email', value: dash(form.email), muted: !form.email },
    { label: 'Aadhaar', value: maskAadhaar(form.aadhaarNumber) },
    { label: 'PAN', value: form.panNumber?.trim() ? form.panNumber.trim() : '—', muted: !form.panNumber },
  ];

  return (
    <div className="space-y-4">
      <StepSection
        title="Consumer details"
        description="Collected at the customer's house and carried over here — nothing to retype."
      >
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label} className="min-w-0">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                {row.label}
              </dt>
              <dd
                className={`mt-0.5 truncate text-sm ${
                  row.muted ? 'text-[var(--muted-soft)]' : 'font-medium text-[var(--foreground)]'
                }`}
                title={row.value}
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        {customerId && (
          <Link
            href={`/customers/${customerId}`}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--primary-active)] hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open the customer record to correct anything
          </Link>
        )}
      </StepSection>

      <p className="flex items-start gap-2 rounded-[1rem] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-2.5 text-[11px] leading-5 text-[var(--muted)]">
        <UserRound className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--secondary)]" />
        <span className="min-w-0">
          One consumer can hold only one PM Surya Ghar application — the server refuses a second one. If these details
          are wrong, fix them on the customer record so the KYC and the paperwork stay in step.
        </span>
      </p>
    </div>
  );
}

export default StepConsumer;

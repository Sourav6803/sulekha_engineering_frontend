'use client';

import Link from 'next/link';
import { ExternalLink, MapPin } from 'lucide-react';
import { SelectField, StepSection, TextAreaField } from './WizardFields';
import type { ApplicationChecklist, ApplicationSiteType } from '@/types/application';
import type { WizardStepProps } from './wizardTypes';

interface StepSiteProps extends WizardStepProps {
  checklist: ApplicationChecklist | null;
  checklistLoading: boolean;
  checklistError: string | null;
}

/** Populated or raw id, depending on what the API returned. */
function customerIdOf(application: WizardStepProps['application']): string | null {
  const customer = application?.customer;
  if (!customer) return null;
  if (typeof customer === 'string') return customer;
  const id = (customer as { _id?: string })._id;
  return typeof id === 'string' ? id : null;
}

/**
 * Step 2 — the address as recorded, and where on the property the system goes.
 *
 * The address is read-only: it was written down once, at the customer's house,
 * and is copied onto the application at creation. Retyping it here is how the
 * KYC and the scheme paperwork drift apart.
 *
 * The site type stays editable — it is a decision about this particular job
 * (RCC rooftop, tin shed, high-rise), and the mounting design hangs off it. The
 * options come from GET /applications/checklist, never a hardcoded list.
 */
export function StepSite({
  form,
  setForm,
  errors,
  disabled,
  application,
  checklist,
  checklistLoading,
  checklistError,
}: StepSiteProps) {
  const siteTypeOptions = (checklist?.siteTypes ?? []).map((site) => ({
    value: site.value,
    label: site.label,
  }));

  const customerId = customerIdOf(application);

  const addressRows: Array<{ label: string; value: string }> = [
    { label: 'Street / house', value: form.address.street },
    { label: 'Village', value: form.address.village },
    { label: 'Block', value: form.address.block },
    { label: 'Panchayat', value: form.address.panchayat },
    { label: 'District', value: form.address.district },
    { label: 'Landmark', value: form.address.landmark },
    { label: 'Pincode', value: form.address.pincode },
  ];

  return (
    <div className="space-y-4">
      <StepSection title="Site address" description="As collected for this customer — carried over, not retyped.">
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {addressRows.map((row) => (
            <div key={row.label} className="min-w-0">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                {row.label}
              </dt>
              <dd
                className={`mt-0.5 truncate text-sm ${
                  row.value ? 'font-medium text-[var(--foreground)]' : 'text-[var(--muted-soft)]'
                }`}
                title={row.value || undefined}
              >
                {row.value || '—'}
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
            Correct the address on the customer record
          </Link>
        )}
      </StepSection>

      <StepSection title="Installation site" description="Drives the mounting design, so it is asked at the visit.">
        {checklistLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="skeleton h-[4.5rem] w-full rounded-[1rem]" />
            <div className="skeleton h-[4.5rem] w-full rounded-[1rem]" />
          </div>
        ) : checklistError ? (
          <p className="rounded-[1rem] border border-[var(--warning)] bg-[var(--warning-tint)] px-3 py-2.5 text-xs leading-5 text-[var(--warning)]">
            Could not load the site types: {checklistError}
          </p>
        ) : siteTypeOptions.length === 0 ? (
          <p className="rounded-[1rem] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-2.5 text-xs text-[var(--muted)]">
            The server did not return any site types. Reload the page to try again.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              id="site-type"
              label="Where will the system be installed?"
              required
              value={form.siteType}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, siteType: value as ApplicationSiteType | '' }))
              }
              options={siteTypeOptions}
              placeholder="Pick a site type"
              error={errors.siteType}
              disabled={disabled}
            />

            <TextAreaField
              id="site-notes"
              label="Site notes"
              value={form.siteNotes}
              onValueChange={(value) => setForm((prev) => ({ ...prev, siteNotes: value }))}
              placeholder="Shadow, roof height, access, extra structure needed…"
              rows={3}
              maxLength={1000}
              error={errors.siteNotes}
              disabled={disabled}
            />
          </div>
        )}

        <p className="mt-3 flex items-start gap-2 rounded-[1rem] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-2.5 text-[11px] leading-5 text-[var(--muted)]">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--secondary)]" />
          <span className="min-w-0">
            A high-rise structure needs a different mounting design from a plain RCC rooftop, so pick the site type
            carefully — the roof photo on the customer record should match it.
          </span>
        </p>
      </StepSection>
    </div>
  );
}

export default StepSite;

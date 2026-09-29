'use client';

import { MapPin } from 'lucide-react';
import { SelectField, StepSection, TextAreaField, TextField } from './WizardFields';
import type { ApplicationChecklist, ApplicationSiteType } from '@/types/application';
import type { WizardStepProps } from './wizardTypes';

interface StepSiteProps extends WizardStepProps {
  checklist: ApplicationChecklist | null;
  checklistLoading: boolean;
  checklistError: string | null;
}

/**
 * Step 2 — where the system goes.
 *
 * The site types come from GET /applications/checklist, never a hardcoded list,
 * so a new mounting case (the checklist already carries `high_rise_structure`)
 * appears here the moment the server learns about it.
 */
export function StepSite({ form, setForm, errors, disabled, checklist, checklistLoading, checklistError }: StepSiteProps) {
  const siteTypeOptions = (checklist?.siteTypes ?? []).map((site) => ({
    value: site.value,
    label: site.label,
  }));

  return (
    <div className="space-y-4">
      <StepSection title="Site address" description="The six fields on the printed checklist, plus the landmark.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <TextField
              id="site-street"
              label="Street / house"
              required
              value={form.address.street}
              onValueChange={(value) => setForm((prev) => ({ ...prev, address: { ...prev.address, street: value } }))}
              placeholder="House no, road, para"
              maxLength={200}
              error={errors['address.street']}
              disabled={disabled}
            />
          </div>

          <TextField
            id="site-village"
            label="Village"
            required
            value={form.address.village}
            onValueChange={(value) => setForm((prev) => ({ ...prev, address: { ...prev.address, village: value } }))}
            maxLength={100}
            error={errors['address.village']}
            disabled={disabled}
          />

          <TextField
            id="site-block"
            label="Block"
            required
            value={form.address.block}
            onValueChange={(value) => setForm((prev) => ({ ...prev, address: { ...prev.address, block: value } }))}
            maxLength={100}
            error={errors['address.block']}
            disabled={disabled}
          />

          <TextField
            id="site-panchayat"
            label="Panchayat"
            required
            value={form.address.panchayat}
            onValueChange={(value) => setForm((prev) => ({ ...prev, address: { ...prev.address, panchayat: value } }))}
            maxLength={100}
            error={errors['address.panchayat']}
            disabled={disabled}
          />

          <TextField
            id="site-district"
            label="District"
            required
            value={form.address.district}
            onValueChange={(value) => setForm((prev) => ({ ...prev, address: { ...prev.address, district: value } }))}
            maxLength={100}
            error={errors['address.district']}
            disabled={disabled}
          />

          <TextField
            id="site-landmark"
            label="Landmark"
            required
            value={form.address.landmark}
            onValueChange={(value) => setForm((prev) => ({ ...prev, address: { ...prev.address, landmark: value } }))}
            placeholder="Nearest school, temple, shop"
            maxLength={200}
            error={errors['address.landmark']}
            disabled={disabled}
          />

          <TextField
            id="site-pincode"
            label="Pincode"
            required
            value={form.address.pincode}
            onValueChange={(value) => setForm((prev) => ({ ...prev, address: { ...prev.address, pincode: value } }))}
            placeholder="6 digits"
            inputMode="numeric"
            maxLength={6}
            error={errors['address.pincode']}
            disabled={disabled}
          />
        </div>
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
            carefully — the roof photo (next step) should match it.
          </span>
        </p>
      </StepSection>
    </div>
  );
}

export default StepSite;

import type {
  ApplicationSiteType,
  ApplicationStatus,
  ApplicationStatusTone,
} from '@/types/application';

/**
 * Presentation helpers for the application module.
 *
 * The badge colours are driven by the `tone` values that /applications/checklist
 * serves for each status (muted / info / warning / success / error), mapped here
 * onto the existing design tokens from globals.css. The fallback map below is
 * what renders before the checklist has loaded (and if it fails) — it mirrors
 * backend/src/data/applicationChecklist.js so the two never disagree.
 */

export interface ApplicationStatusStyle {
  label: string;
  tone: ApplicationStatusTone;
}

export const APPLICATION_STATUS_FALLBACK: Record<ApplicationStatus, ApplicationStatusStyle> = {
  draft: { label: 'Draft', tone: 'muted' },
  submitted: { label: 'Submitted', tone: 'info' },
  under_review: { label: 'Under review', tone: 'info' },
  correction_required: { label: 'Correction required', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  quotation_issued: { label: 'Quotation issued', tone: 'success' },
  agreement_issued: { label: 'Agreement issued', tone: 'success' },
  completed: { label: 'Completed', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'error' },
};

/** tone → the shared badge tokens. `badge-*` classes come from globals.css. */
export const STATUS_TONE_CLASS: Record<ApplicationStatusTone, string> = {
  muted: 'bg-[var(--surface-muted)] text-[var(--muted)]',
  info: 'bg-[var(--primary-tint)] text-[var(--primary-active)]',
  warning: 'badge-warning',
  success: 'badge-success',
  error: 'badge-error',
};

export const APPLICATION_SITE_TYPE_LABEL: Record<string, string> = {
  rcc_rooftop: 'RCC rooftop',
  tin_shed: 'Tin shed',
  high_rise_structure: 'High rise structure',
  ground_mount: 'Ground mount',
};

export type ApplicationStatusMeta = Record<string, ApplicationStatusStyle | undefined>;

/** Status label + tone lookup built from /applications/checklist. */
export const statusMetaFromChecklist = (
  statuses: Array<{ value: ApplicationStatus; label: string; tone: ApplicationStatusTone }> | undefined
): ApplicationStatusMeta => {
  const meta: ApplicationStatusMeta = {};
  (statuses ?? []).forEach((status) => {
    meta[status.value] = { label: status.label, tone: status.tone };
  });
  return meta;
};

/** Site type label lookup built from /applications/checklist. */
export const siteTypeLabelsFromChecklist = (
  siteTypes: Array<{ value: ApplicationSiteType; label: string }> | undefined
): Record<string, string> => {
  if (!siteTypes?.length) return APPLICATION_SITE_TYPE_LABEL;
  const labels: Record<string, string> = { ...APPLICATION_SITE_TYPE_LABEL };
  siteTypes.forEach((site) => {
    labels[site.value] = site.label;
  });
  return labels;
};

/** The agent on an application may arrive populated or as a bare id. */
export const applicationAgentName = (agent: unknown): string => {
  if (!agent) return '—';
  if (typeof agent === 'string') return '—';
  const name = (agent as { name?: string }).name;
  return name || '—';
};

/**
 * Behaviour gates mirroring backend/src/data/applicationChecklist.js
 * (AGENT_EDITABLE_STATUSES / DOCUMENT_EDITABLE_STATUSES).
 *
 * Status *labels and tones* still come from /applications/checklist — these
 * arrays only decide which buttons a screen offers, and the server remains the
 * authority (it refuses with a 400 that is shown verbatim).
 */
export const APPLICATION_AGENT_EDITABLE_STATUSES: ApplicationStatus[] = ['draft', 'correction_required'];

export const APPLICATION_DOCUMENT_EDITABLE_STATUSES: ApplicationStatus[] = [
  'draft',
  'correction_required',
  'submitted',
  'under_review',
];

/** The agent may still edit the form (draft / sent back for correction). */
export const isAgentEditableStatus = (status?: ApplicationStatus | null): boolean =>
  Boolean(status && APPLICATION_AGENT_EDITABLE_STATUSES.includes(status));

/** The file set is still open — documents may be added, replaced or removed. */
export const isDocumentEditableStatus = (status?: ApplicationStatus | null): boolean =>
  Boolean(status && APPLICATION_DOCUMENT_EDITABLE_STATUSES.includes(status));

/** "cash_credit" -> "Cash credit"; used for the free-form enum values. */
export const humaniseEnum = (value?: string | null): string =>
  value ? value.replace(/_/g, ' ').replace(/^./, (char) => char.toUpperCase()) : '—';

import {
  APPLICATION_STATUS_FALLBACK,
  STATUS_TONE_CLASS,
  type ApplicationStatusMeta,
} from './applicationDisplay';
import type { ApplicationStatus, ApplicationStatusTone } from '@/types/application';

interface ApplicationStatusBadgeProps {
  status?: ApplicationStatus | null;
  /** Label from /applications/checklist when it is available. */
  label?: string;
  /** Tone from /applications/checklist when it is available. */
  tone?: ApplicationStatusTone;
  className?: string;
}

/**
 * Status pill for a consumer application. The label and tone come from
 * /applications/checklist; when that has not loaded the built-in fallback keeps
 * the badge correct on its own.
 */
export function ApplicationStatusBadge({
  status,
  label,
  tone,
  className = '',
}: ApplicationStatusBadgeProps) {
  const fallback =
    APPLICATION_STATUS_FALLBACK[(status ?? 'draft') as ApplicationStatus] ?? APPLICATION_STATUS_FALLBACK.draft;
  const resolvedTone = tone ?? fallback.tone;

  return (
    <span className={`badge-pill ${STATUS_TONE_CLASS[resolvedTone] ?? STATUS_TONE_CLASS.muted} ${className}`.trim()}>
      {label ?? fallback.label}
    </span>
  );
}

/** Convenience for a row: looks the status up in the checklist-derived map. */
export function applicationStatusBadgeFor(
  status: ApplicationStatus,
  meta: ApplicationStatusMeta,
  className = ''
) {
  const entry = meta[status];
  return <ApplicationStatusBadge status={status} label={entry?.label} tone={entry?.tone} className={className} />;
}

export default ApplicationStatusBadge;

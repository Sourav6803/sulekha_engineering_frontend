import { emptyWizardForm, WIZARD_STEPS, type WizardForm } from './wizardTypes';

/**
 * The wizard's local persistence.
 *
 * One in-progress entry is enough — an agent works one consumer at a time — so a
 * single localStorage key holds `{ applicationId, step, form, savedAt }`. The
 * server draft is still the source of truth once one exists; this only keeps the
 * half-typed form (and the step the agent was on) alive across a reload or a
 * dropped signal.
 */
export const WIZARD_DRAFT_STORAGE_KEY = 'sulekha.application-wizard-draft.v1';

const LAST_STEP_INDEX = WIZARD_STEPS.length - 1;

export interface StoredWizardDraft {
  /** The server draft id, once step 1 has been saved. */
  applicationId: string | null;
  step: number;
  form: WizardForm;
  /** ISO timestamp of the last local save, shown in the restore banner. */
  savedAt: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

/**
 * Overlay a stored form on the empty form so a field added since it was saved
 * still exists — a half-migrated object must never break a step render.
 */
function normaliseForm(value: unknown): WizardForm {
  const base = emptyWizardForm();
  if (!isRecord(value)) return base;
  const stored = value as Partial<WizardForm>;

  return {
    ...base,
    ...stored,
    address: { ...base.address, ...(isRecord(stored.address) ? stored.address : {}) },
    deal: { ...base.deal, ...(isRecord(stored.deal) ? stored.deal : {}) },
    loan: { ...base.loan, ...(isRecord(stored.loan) ? stored.loan : {}) },
    electricBill: { ...base.electricBill, ...(isRecord(stored.electricBill) ? stored.electricBill : {}) },
    names: { ...base.names, ...(isRecord(stored.names) ? stored.names : {}) },
  } as WizardForm;
}

/** Read the saved entry, or null when there is nothing usable stored. */
export function readStoredWizardDraft(): StoredWizardDraft | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(WIZARD_DRAFT_STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;

    const rawStep = typeof parsed.step === 'number' ? parsed.step : 0;
    const step = Number.isFinite(rawStep)
      ? Math.min(Math.max(0, Math.trunc(rawStep)), LAST_STEP_INDEX)
      : 0;

    return {
      applicationId: typeof parsed.applicationId === 'string' ? parsed.applicationId : null,
      step,
      form: normaliseForm(parsed.form),
      savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/** Persist the current entry. Storage failures (private mode, quota) are silent. */
export function writeStoredWizardDraft(draft: StoredWizardDraft): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(WIZARD_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Losing a local convenience copy is not worth interrupting the agent.
  }
}

/** Forget the saved entry. Never throws. */
export function clearStoredWizardDraft(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(WIZARD_DRAFT_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** True when the form is untouched and no draft exists — nothing worth keeping. */
export function isPristineWizardForm(form: WizardForm): boolean {
  return (
    !form.consumerName.trim() &&
    !form.phone.trim() &&
    !form.aadhaarNumber.trim() &&
    !form.panNumber.trim() &&
    !form.address.street.trim() &&
    !form.siteType &&
    !form.deal.systemSizeKW.trim() &&
    !form.electricBill.consumerId.trim() &&
    !form.names.consumer.trim()
  );
}

export default readStoredWizardDraft;

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, History, Loader2, Save, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { isAgentEditableStatus } from '@/components/features/applications/applicationDisplay';
import {
  clearStoredWizardDraft,
  isPristineWizardForm,
  readStoredWizardDraft,
  writeStoredWizardDraft,
} from './wizard/draftStorage';
import { formatDateTime } from '@/lib/format';
import { collectSubmitIssues } from '@/components/features/applications/applicationCompleteness';
import { StepConsumer } from './wizard/StepConsumer';
import { StepSite } from './wizard/StepSite';
import { StepDealLoan } from './wizard/StepDealLoan';
import { StepDocuments, type DocumentExtrasForm } from './wizard/StepDocuments';
import { StepElectricBill } from './wizard/StepElectricBill';
import { StepNamesSubmit } from './wizard/StepNamesSubmit';
import {
  LAST_STEP,
  WIZARD_STEPS,
  buildNameMatchPayload,
  buildStepPayload,
  emptyWizardForm,
  formFromApplication,
  trimOrNull,
  type WizardForm,
} from './wizard/wizardTypes';
import { useApplications } from '@/hooks/useApplications';
import { readApiErrorDetails } from '@/lib/errors/apiErrorDetails';
import type {
  ApplicationChecklist,
  ApplicationDocument,
  ApplicationDocumentKind,
  ApplicationNameMatch,
  ApplicationSubmitIssue,
} from '@/types/application';

/**
 * A sensible step to land on when resuming (`?id=`). It walks the wizard's own
 * slices in order and stops at the first empty one — no document kind is named,
 * so it stays correct if the checklist changes.
 */
function suggestedStepFor(application: ApplicationDocument): number {
  if (!application.consumerName || !application.phone || !application.aadhaarNumber || !application.panNumber) {
    return 0;
  }
  if (!application.address?.street || !application.address?.village || !application.siteType) {
    return 1;
  }
  if (!application.deal?.systemSizeKW || application.deal?.proposalAmount == null) {
    return 2;
  }
  if ((application.documents ?? []).length === 0) {
    return 3;
  }
  if (!application.electricBill?.consumerId || !application.electricBill?.installationNo) {
    return 4;
  }
  return 5;
}

/**
 * The "New consumer application" form.
 *
 * Six steps, mobile-first (an agent fills this in at the consumer's house), and
 * every list it renders — documents, site types, statuses, the bill portal URL —
 * comes from GET /applications/checklist so nothing here can drift from what the
 * API enforces.
 *
 * Saving model: the draft is opened on step 1 (the create endpoint needs
 * consumerName + phone) and every step change PATCHes the slice that step owns.
 * Documents and the electricity bill have their own endpoints and are saved the
 * moment they are uploaded, so a dropped connection never loses a photo.
 */
export function ApplicationWizard({ initialApplicationId }: { initialApplicationId?: string } = {}) {
  const router = useRouter();
  const {
    createApplication,
    updateApplication,
    deleteApplication,
    uploadDocument,
    deleteDocument,
    setElectricBill,
    runNameMatch,
    submitApplication,
    fetchChecklist,
    fetchApplicationDetail,
  } = useApplications();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<WizardForm>(() => emptyWizardForm());
  const [application, setApplication] = useState<ApplicationDocument | null>(null);
  const [checklist, setChecklist] = useState<ApplicationChecklist | null>(null);
  const [checklistLoading, setChecklistLoading] = useState(true);
  const [checklistError, setChecklistError] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  /**
   * Set when the server refuses a second application for a consumer who already
   * has one. The refusal carries the existing application's id and number, so
   * the banner can send the agent straight to that draft instead of only
   * reporting a clash.
   */
  const [duplicate, setDuplicate] = useState<{ applicationId?: string; applicationNo?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  /**
   * Local persistence / resume state. `hydrated` gates the save effect so the
   * empty initial form can never overwrite a stored entry before the restore
   * pass has run.
   */
  const [hydrated, setHydrated] = useState(false);
  const [restoredAt, setRestoredAt] = useState<string | null>(null);
  const [restoreDismissed, setRestoreDismissed] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  /** Set once a submit succeeds so no effect re-persists the cleared entry. */
  const submittedRef = useRef(false);

  const [nameMatch, setNameMatch] = useState<ApplicationNameMatch | null>(null);
  const [checkingNames, setCheckingNames] = useState(false);
  const [nameMatchError, setNameMatchError] = useState<string | null>(null);
  const [confirmNameMatch, setConfirmNameMatch] = useState(false);
  const [note, setNote] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitIssues, setSubmitIssues] = useState<ApplicationSubmitIssue[]>([]);
  const [leaveOpen, setLeaveOpen] = useState(false);

  const applicationId = application?._id ?? null;

  // ---------------------------------------------------------------- checklist
  useEffect(() => {
    let active = true;

    async function load() {
      setChecklistLoading(true);
      const result = await fetchChecklist();
      if (!active) return;
      if (result) {
        setChecklist(result);
        // The form definition drives the config, so a failure here is worth
        // saying out loud — the site types and the document list come from it.
        setChecklistError(null);
      } else {
        setChecklistError('The form config could not be loaded.');
      }
      setChecklistLoading(false);
    }

    void load();
    return () => {
      active = false;
    };
  }, [fetchChecklist]);

  // ------------------------------------------------------- restore on mount
  useEffect(() => {
    let active = true;

    async function restore() {
      // ?id= → the server is the source of truth; hydrate from it and replace
      // whatever this device had remembered for that in-progress entry.
      if (initialApplicationId) {
        const detail = await fetchApplicationDetail(initialApplicationId);
        if (!active) return;
        if (detail) {
          const nextForm = formFromApplication(detail.application);
          const nextStep = suggestedStepFor(detail.application);
          setApplication(detail.application);
          setForm(nextForm);
          setNameMatch(detail.application.nameMatch ?? null);
          setStep(nextStep);
          writeStoredWizardDraft({
            applicationId: detail.application._id,
            step: nextStep,
            form: nextForm,
            savedAt: new Date().toISOString(),
          });
        } else {
          setSaveError(
            'That application could not be opened. It may have been deleted, or it may belong to another agent.'
          );
        }
        setHydrated(true);
        return;
      }

      const stored = readStoredWizardDraft();
      if (!stored) {
        setHydrated(true);
        return;
      }

      setForm(stored.form);
      setStep(stored.step);
      setRestoredAt(stored.savedAt);

      if (stored.applicationId) {
        const detail = await fetchApplicationDetail(stored.applicationId);
        if (!active) return;
        if (detail) {
          // Server stays authoritative for the stored slices (documents, bill,
          // names); the local form may be a keystroke ahead and wins for editing.
          setApplication(detail.application);
          setNameMatch(detail.application.nameMatch ?? null);
        } else {
          setSaveError(
            'The draft this device remembered is no longer on the server. Fill in step 1 and press Next to start a fresh draft.'
          );
        }
      }

      setHydrated(true);
    }

    void restore();
    return () => {
      active = false;
    };
  }, [initialApplicationId, fetchApplicationDetail]);

  // ------------------------------------------------- persist locally (debounced)
  useEffect(() => {
    if (!hydrated || submittedRef.current) return;

    const timer = window.setTimeout(() => {
      if (!applicationId && isPristineWizardForm(form)) {
        clearStoredWizardDraft();
        return;
      }
      writeStoredWizardDraft({
        applicationId,
        step,
        form,
        savedAt: new Date().toISOString(),
      });
    }, 400);

    return () => window.clearTimeout(timer);
  }, [hydrated, applicationId, step, form]);

  // ------------------------------------------------------- unsaved-work guard
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const updateForm = useCallback<typeof setForm>((action) => {
    setDirty(true);
    setForm(action);
  }, []);

  const scrollToTop = useCallback(() => {
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const refresh = useCallback(
    async (id: string) => {
      const detail = await fetchApplicationDetail(id);
      if (detail) {
        setApplication(detail.application);
        setNameMatch(detail.application.nameMatch ?? null);
      }
    },
    [fetchApplicationDetail]
  );

  // ---------------------------------------------------------------- step saves
  const applyFieldErrors = useCallback((issues: ApplicationSubmitIssue[]) => {
    if (issues.length === 0) return;
    setErrors(Object.fromEntries(issues.map((issue) => [issue.field, issue.message])));
  }, []);

  /**
   * Save one step. `strict` decides whether a refusal blocks navigation —
   * going forward it does, going back it only warns (the agent should never be
   * trapped on a step just because a later field is half-typed).
   */
  const saveStep = useCallback(
    async (index: number, strict: boolean): Promise<boolean> => {
      setSaveError(null);
      setDuplicate(null);

      // ---- Step 1 without a draft yet: POST it -----------------------------
      if (index === 0 && !applicationId) {
        const localErrors: Record<string, string> = {};
        if (form.consumerName.trim().length < 2) {
          localErrors.consumerName = 'Consumer name must be at least 2 characters';
        }
        if (!/^(\+91[- ]?)?[0-9]{10}$/.test(form.phone.trim())) {
          localErrors.phone = 'Please enter a valid 10-digit mobile number';
        }
        if (Object.keys(localErrors).length > 0) {
          setErrors(localErrors);
          return false;
        }

        setSaving(true);
        try {
          const response = await createApplication({
            consumerName: form.consumerName.trim(),
            phone: form.phone.trim(),
            alternatePhone: trimOrNull(form.alternatePhone),
            aadhaarNumber: trimOrNull(form.aadhaarNumber),
            panNumber: trimOrNull(form.panNumber),
            email: trimOrNull(form.email),
          });
          setApplication(response.data);
          // Hydrate from the server so normalised values (Aadhaar digits,
          // uppercased PAN, the 10-digit phone) are what the agent sees next.
          setForm(formFromApplication(response.data));
          setErrors({});
          setDirty(false);
          return true;
        } catch (err) {
          const details = readApiErrorDetails(err);
          applyFieldErrors(details.issues);
          setSaveError(details.message);
          setDuplicate(
            details.code === 'DUPLICATE_APPLICATION'
              ? {
                  applicationId:
                    typeof details.data.applicationId === 'string' ? details.data.applicationId : undefined,
                  applicationNo:
                    typeof details.data.applicationNo === 'string' ? details.data.applicationNo : undefined,
                }
              : null
          );
          toast.error('Could not start the application', { description: details.message });
          return false;
        } finally {
          setSaving(false);
        }
      }

      if (!applicationId) return true;

      // ---- Step 5: the two bill ids have their own PUT ---------------------
      if (index === 4) {
        const localErrors: Record<string, string> = {};
        if (!form.electricBill.consumerId.trim()) {
          localErrors['electricBill.consumerId'] = 'Consumer ID is required';
        }
        if (!form.electricBill.installationNo.trim()) {
          localErrors['electricBill.installationNo'] = 'Installation ID is required';
        }
        if (Object.keys(localErrors).length > 0) {
          if (strict) {
            setErrors(localErrors);
            return false;
          }
          return true;
        }

        setSaving(true);
        try {
          const response = await setElectricBill(applicationId, {
            consumerId: form.electricBill.consumerId.trim(),
            installationNo: form.electricBill.installationNo.trim(),
          });
          setApplication((prev) => (prev ? { ...prev, electricBill: response.data.electricBill } : prev));
          setErrors({});
          setDirty(false);
          return true;
        } catch (err) {
          const details = readApiErrorDetails(err);
          applyFieldErrors(details.issues);
          setSaveError(details.message);
          if (strict) toast.error('Could not save the bill details', { description: details.message });
          return !strict;
        } finally {
          setSaving(false);
        }
      }

      // ---- Steps 2-3: a plain PATCH of that step's slice -------------------
      const payload = buildStepPayload(index, form);
      if (!payload) return true; // documents + names own their own endpoints

      setSaving(true);
      try {
        const response = await updateApplication(applicationId, payload);
        setApplication(response.data.application);
        setNameMatch(response.data.application.nameMatch ?? null);
        setErrors({});
        setDirty(false);
        return true;
      } catch (err) {
        const details = readApiErrorDetails(err);
        applyFieldErrors(details.issues);
        setSaveError(details.message);
        setDuplicate(
          details.code === 'DUPLICATE_APPLICATION'
            ? {
                applicationId:
                  typeof details.data.applicationId === 'string' ? details.data.applicationId : undefined,
                applicationNo:
                  typeof details.data.applicationNo === 'string' ? details.data.applicationNo : undefined,
              }
            : null
        );
        if (strict) toast.error('Could not save this step', { description: details.message });
        return !strict;
      } finally {
        setSaving(false);
      }
    },
    [applicationId, form, createApplication, updateApplication, setElectricBill, applyFieldErrors]
  );

  const goNext = useCallback(async () => {
    if (step >= LAST_STEP) return;
    setErrors({});
    const ok = await saveStep(step, true);
    if (!ok) return;
    setStep((prev) => Math.min(LAST_STEP, prev + 1));
    scrollToTop();
  }, [step, saveStep, scrollToTop]);

  const goBack = useCallback(async () => {
    if (step === 0) return;
    // Best-effort: never trap the agent on a step because a later field is invalid.
    await saveStep(step, false);
    setErrors({});
    setStep((prev) => Math.max(0, prev - 1));
    scrollToTop();
  }, [step, saveStep, scrollToTop]);

  const goToStep = useCallback(
    async (target: number) => {
      if (target === step) return;
      if (target < step) {
        await saveStep(step, false);
        setErrors({});
        setStep(target);
        scrollToTop();
        return;
      }
      const ok = await saveStep(step, true);
      if (!ok) return;
      setErrors({});
      setStep(target);
      scrollToTop();
    },
    [step, saveStep, scrollToTop]
  );

  // ------------------------------------------------------------- documents
  const handleUpload = useCallback(
    async (
      kind: ApplicationDocumentKind,
      file: File,
      extras: DocumentExtrasForm
    ): Promise<string | null> => {
      if (!applicationId) return 'Start the application first — step 1 has to be saved.';
      try {
        await uploadDocument(applicationId, file, {
          kind,
          accountNumber: extras.accountNumber.trim() || undefined,
          ifsc: extras.ifsc.trim() || undefined,
          branchName: extras.branchName.trim() || undefined,
          accountType: extras.accountType || undefined,
        });
        await refresh(applicationId);
        const label = checklist?.documents.find((entry) => entry.kind === kind)?.label ?? kind;
        toast.success(`${label} uploaded`);
        return null;
      } catch (err) {
        const details = readApiErrorDetails(err);
        toast.error('Upload refused', { description: details.message });
        return details.message;
      }
    },
    [applicationId, uploadDocument, refresh, checklist]
  );

  const handleDeleteDocument = useCallback(
    async (documentId: string): Promise<string | null> => {
      if (!applicationId) return 'Start the application first — step 1 has to be saved.';
      try {
        await deleteDocument(applicationId, documentId);
        await refresh(applicationId);
        toast.success('Document removed');
        return null;
      } catch (err) {
        const details = readApiErrorDetails(err);
        toast.error('Could not remove the document', { description: details.message });
        return details.message;
      }
    },
    [applicationId, deleteDocument, refresh]
  );

  // ------------------------------------------------------------- name match
  const handleCheckNames = useCallback(async () => {
    if (!applicationId) {
      setNameMatchError('Start the application first — step 1 has to be saved.');
      return;
    }

    setCheckingNames(true);
    setNameMatchError(null);
    try {
      // The consumer name sits on step 1; if it was corrected here, save it
      // first so the verdict is computed against what is actually stored.
      const desiredConsumer = form.names.consumer.trim() || form.consumerName.trim();
      if (desiredConsumer && desiredConsumer !== application?.consumerName) {
        const patched = await updateApplication(applicationId, { consumerName: desiredConsumer });
        setApplication(patched.data.application);
        setForm((prev) => ({ ...prev, consumerName: desiredConsumer }));
      }

      const response = await runNameMatch(applicationId, buildNameMatchPayload(form));
      const result = response.data;
      setNameMatch(result);
      setApplication((prev) => (prev ? { ...prev, nameMatch: result } : prev));

      if (result?.verdict === 'match') {
        toast.success('Names match on all three documents');
      } else if (result?.verdict === 'near_match') {
        toast.warning('Names are close but not identical — the office will confirm');
      } else if (result?.verdict === 'mismatch') {
        toast.error('Name mismatch', { description: result.message ?? undefined });
      } else {
        toast.info(result?.message ?? 'Enter all four names and check again');
      }
    } catch (err) {
      const details = readApiErrorDetails(err);
      setNameMatchError(details.message);
      toast.error('Could not check the names', { description: details.message });
    } finally {
      setCheckingNames(false);
    }
  }, [applicationId, application?.consumerName, form, updateApplication, runNameMatch]);

  // ----------------------------------------------------------------- submit
  const handleSubmit = useCallback(async () => {
    if (!applicationId) {
      setSubmitError('Start the application first — step 1 has to be saved.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSubmitIssues([]);
    try {
      await submitApplication(applicationId, {
        confirmNameMatch,
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      // The entry is no longer in progress — forget the local copy so a fresh
      // visit does not offer to resume a submitted application.
      submittedRef.current = true;
      clearStoredWizardDraft();
      toast.success('Application submitted', {
        description: `${application?.applicationNo ?? 'The application'} is now with the office for review.`,
      });
      router.push('/applications');
    } catch (err) {
      const details = readApiErrorDetails(err);
      setSubmitError(details.message);
      setSubmitIssues(details.issues);
      toast.error('Could not submit the application', { description: details.message });
      // Re-read the draft so the completeness panel reflects the server's view.
      await refresh(applicationId);
    } finally {
      setSubmitting(false);
    }
  }, [applicationId, application?.applicationNo, confirmNameMatch, note, submitApplication, refresh, router]);

  /** Flush the local entry immediately instead of waiting on the debounce. */
  const persistLocally = useCallback(() => {
    if (submittedRef.current) return;
    if (!applicationId && isPristineWizardForm(form)) return;
    writeStoredWizardDraft({ applicationId, step, form, savedAt: new Date().toISOString() });
  }, [applicationId, step, form]);

  const handleLeave = useCallback(() => {
    persistLocally();
    if (dirty) {
      setLeaveOpen(true);
      return;
    }
    router.push('/applications');
  }, [dirty, persistLocally, router]);

  // ------------------------------------------------------------- discard saved
  const discardDeletesServer =
    Boolean(applicationId) && isAgentEditableStatus(application?.status ?? undefined);

  const discardStatusLabel =
    checklist?.statuses.find((entry) => entry.value === application?.status)?.label ??
    application?.status ??
    'draft';

  const discardMessage = discardDeletesServer
    ? `This forgets the information saved on this device AND deletes the server draft${
        application?.applicationNo ? ` ${application.applicationNo}` : ''
      } (status: ${discardStatusLabel}). This cannot be undone.`
    : applicationId
      ? `This only forgets the copy saved on this device. The application${
          application?.applicationNo ? ` ${application.applicationNo}` : ''
        } stays on the server — nothing is deleted.`
      : 'This forgets the information saved on this device. Nothing has been sent to the server yet.';

  const handleDiscard = useCallback(async () => {
    setDiscarding(true);
    const serverId = applicationId;
    const shouldDeleteServer =
      Boolean(serverId) && isAgentEditableStatus(application?.status ?? undefined);

    try {
      clearStoredWizardDraft();

      if (shouldDeleteServer && serverId) {
        await deleteApplication(serverId);
        toast.success('Saved information discarded', {
          description: 'The information on this device was cleared and the server draft was deleted.',
        });
      } else {
        toast.success('Saved information discarded', {
          description: applicationId
            ? 'Only the copy saved on this device was cleared — the application stays on the server.'
            : 'The information saved on this device was cleared.',
        });
      }

      // Reset the wizard to a clean slate.
      setApplication(null);
      setForm(emptyWizardForm());
      setStep(0);
      setNameMatch(null);
      setErrors({});
      setSaveError(null);
      setDuplicate(null);
      setDirty(false);
      setRestoredAt(null);
      setRestoreDismissed(false);
      setDiscardOpen(false);

      // A restored ?id= no longer belongs to this entry — land on a clean form.
      if (initialApplicationId) {
        router.replace('/applications/new');
      }
    } catch (err) {
      const details = readApiErrorDetails(err);
      toast.error('Could not discard the saved information', { description: details.message });
    } finally {
      setDiscarding(false);
    }
  }, [applicationId, application?.status, deleteApplication, initialApplicationId, router]);

  // The live mirror of the server's submit gate.
  const issues = useMemo(() => collectSubmitIssues(application, checklist?.documents), [application, checklist]);

  const currentStep = WIZARD_STEPS[step];

  return (
    <div className="space-y-4">
      {/* Progress rail */}
      <nav aria-label="Form progress" className="panel p-3 sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--primary-active)]">
            Step {step + 1} of {WIZARD_STEPS.length}
          </p>
          <p className="shrink-0 text-[11px] text-[var(--muted)]">
            {saving ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" /> Saving…
              </span>
            ) : dirty ? (
              <span className="inline-flex items-center gap-1.5">
                <Save className="h-3 w-3" /> Unsaved changes
              </span>
            ) : applicationId ? (
              <span className="inline-flex items-center gap-1.5 text-[var(--success)]">
                <CheckCircle2 className="h-3 w-3" /> Draft saved
              </span>
            ) : (
              <span>Not saved yet</span>
            )}
          </p>
        </div>

        <ol className="-mx-1 mt-3 flex snap-x gap-1.5 overflow-x-auto pb-1">
          {WIZARD_STEPS.map((meta, index) => {
            const active = index === step;
            const done = index < step;
            return (
              <li key={meta.id} className="shrink-0 snap-start">
                <button
                  type="button"
                  onClick={() => void goToStep(index)}
                  aria-current={active ? 'step' : undefined}
                  className={
                    active
                      ? 'inline-flex items-center gap-1.5 rounded-[var(--radius-full)] bg-[var(--primary)] px-3 py-1.5 text-[11px] font-semibold text-[var(--primary-foreground)]'
                      : done
                        ? 'inline-flex items-center gap-1.5 rounded-[var(--radius-full)] bg-[var(--success-tint)] px-3 py-1.5 text-[11px] font-semibold text-[var(--success)]'
                        : 'inline-flex items-center gap-1.5 rounded-[var(--radius-full)] bg-[var(--surface-muted)] px-3 py-1.5 text-[11px] font-medium text-[var(--muted)]'
                  }
                >
                  <span className="tabular-nums">{index + 1}</span>
                  <span className="hidden sm:inline">{meta.title}</span>
                  <span className="sm:hidden">{meta.short}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {checklistError && (
        <p className="flex items-start gap-2 rounded-[1rem] border border-[var(--warning)] bg-[var(--warning-tint)] px-3 py-2.5 text-xs leading-5 text-[var(--warning)]">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0">
            {checklistError} Site types and the document list come from the server, so those steps will be empty — use
            “Back to applications”, reload the page and try again.
          </span>
        </p>
      )}

      {restoredAt && !restoreDismissed && (
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-[1rem] border border-[var(--primary)] bg-[var(--primary-tint)] px-3 py-2.5 text-xs leading-5 text-[var(--primary-active)]">
          <p className="flex min-w-0 items-start gap-2">
            <History className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="min-w-0 [overflow-wrap:anywhere]">
              Restored your unsaved entry from {formatDateTime(restoredAt)}.
            </span>
          </p>
          <span className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setDiscardOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--primary)] px-3 py-1.5 text-[11px] font-semibold text-[var(--primary-active)] transition hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)]"
            >
              <Trash2 className="h-3.5 w-3.5" /> Discard saved information
            </button>
            <button
              type="button"
              aria-label="Dismiss restored entry notice"
              onClick={() => setRestoreDismissed(true)}
              className="ghost-button !p-1.5 text-[var(--primary-active)] hover:text-[var(--foreground)]"
            >
              <X className="h-4 w-4" />
            </button>
          </span>
        </div>
      )}

      {saveError && (
        <div
          role="alert"
          className="rounded-[1rem] border border-[var(--error)] bg-[var(--error-tint)] px-3 py-2.5 text-xs leading-5 text-[var(--error)]"
        >
          <p className="[overflow-wrap:anywhere]">{saveError}</p>

          {duplicate &&
            (duplicate.applicationId ? (
              <button
                type="button"
                onClick={() => router.push(`/applications/new?id=${duplicate.applicationId}`)}
                className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[var(--error)] px-3 py-1.5 text-[11px] font-semibold text-[var(--error)] transition hover:bg-[var(--error)] hover:text-white"
              >
                Continue your existing draft
                {duplicate.applicationNo ? ` (${duplicate.applicationNo})` : ''}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.push('/applications')}
                className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[var(--error)] px-3 py-1.5 text-[11px] font-semibold text-[var(--error)] transition hover:bg-[var(--error)] hover:text-white"
              >
                Open my applications
                {duplicate.applicationNo ? ` to find ${duplicate.applicationNo}` : ''}
              </button>
            ))}
        </div>
      )}

      {/* Steps */}
      <div>
        {step === 0 && <StepConsumer form={form} setForm={updateForm} errors={errors} disabled={saving} />}

        {step === 1 && (
          <StepSite
            form={form}
            setForm={updateForm}
            errors={errors}
            disabled={saving}
            checklist={checklist}
            checklistLoading={checklistLoading}
            checklistError={checklistError}
          />
        )}

        {step === 2 && <StepDealLoan form={form} setForm={updateForm} errors={errors} disabled={saving} />}

        {step === 3 &&
          (applicationId ? (
            <StepDocuments
              checklist={checklist}
              checklistLoading={checklistLoading}
              checklistError={checklistError}
              application={application}
              disabled={false}
              onUpload={handleUpload}
              onDelete={handleDeleteDocument}
            />
          ) : (
            <div className="panel">
              <EmptyState
                icon={AlertTriangle}
                title="Save the consumer first"
                description="The draft has to exist before documents can be attached. Go back to step 1, fill the consumer name and mobile number, then press Next."
                action={
                  <button type="button" className="brand-button px-4 py-2 text-sm" onClick={() => setStep(0)}>
                    Back to step 1
                  </button>
                }
              />
            </div>
          ))}

        {step === 4 && (
          <StepElectricBill
            form={form}
            setForm={updateForm}
            errors={errors}
            disabled={saving}
            checklist={checklist}
            application={application}
            onUpload={handleUpload}
            onDelete={handleDeleteDocument}
            onCopy={async (label, value) => {
              if (!value) return;
              try {
                if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
                await navigator.clipboard.writeText(value);
                toast.success(`${label} copied`);
              } catch {
                toast.error(`Could not copy the ${label}`, {
                  description: 'Select it and copy by hand.',
                });
              }
            }}
          />
        )}

        {step === 5 &&
          (applicationId ? (
            <StepNamesSubmit
              form={form}
              setForm={updateForm}
              errors={errors}
              disabled={submitting}
              nameMatch={nameMatch}
              checkingNames={checkingNames}
              nameMatchError={nameMatchError}
              onCheckNames={() => void handleCheckNames()}
              issues={issues}
              onGoToStep={(target) => void goToStep(target)}
              confirmNameMatch={confirmNameMatch}
              setConfirmNameMatch={setConfirmNameMatch}
              note={note}
              setNote={setNote}
              submitting={submitting}
              submitError={submitError}
              submitIssues={submitIssues}
              onSubmit={() => void handleSubmit()}
            />
          ) : (
            <div className="panel">
              <EmptyState
                icon={AlertTriangle}
                title="Save the consumer first"
                description="There is no draft to submit yet. Go back to step 1 and save the consumer name and mobile number."
                action={
                  <button type="button" className="brand-button px-4 py-2 text-sm" onClick={() => setStep(0)}>
                    Back to step 1
                  </button>
                }
              />
            </div>
          ))}
      </div>

      {/* Sticky nav — thumb-reachable on a phone */}
      <div className="sticky bottom-0 z-20 -mx-4 border-t border-[var(--border-soft)] bg-[var(--surface)]/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-[1.25rem] sm:border sm:px-4">
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <button type="button" className="neutral-button px-4 py-2 text-sm" onClick={() => void goBack()} disabled={step === 0 || saving}>
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button type="button" className="ghost-button px-3 py-2 text-sm" onClick={handleLeave}>
              Close
            </button>
          </div>

          <div className="flex items-center gap-2">
            <p className="hidden min-w-0 truncate text-[11px] text-[var(--muted)] sm:block">
              {currentStep.title}
            </p>
            {step < LAST_STEP ? (
              <button type="button" className="brand-button px-5 py-2.5 text-sm" onClick={() => void goNext()} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Next <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                className="brand-button px-5 py-2.5 text-sm"
                onClick={() => void handleSubmit()}
                disabled={submitting || !confirmNameMatch}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Submit application
              </button>
            )}
          </div>
        </div>

        {application?.applicationNo && (
          <p className="mt-2 truncate font-mono text-[11px] text-[var(--muted-soft)]">
            Draft {application.applicationNo} • saved automatically as you move between steps
          </p>
        )}
      </div>

      <p className="px-1 text-[11px] leading-5 text-[var(--muted-soft)]">
        Need to check something later?{' '}
        <Link href="/applications" className="font-semibold text-[var(--primary-active)] hover:underline">
          Your applications
        </Link>{' '}
        keeps every draft exactly where it was left.
      </p>

      <ConfirmDialog
        open={leaveOpen}
        title="Leave this step?"
        message="This step has changes that have not reached the server yet. They are kept on this device, so New application will offer to restore them — the saved draft also stays in your applications."
        confirmLabel="Leave"
        cancelLabel="Keep editing"
        busy={false}
        onConfirm={() => {
          persistLocally();
          setLeaveOpen(false);
          router.push('/applications');
        }}
        onCancel={() => setLeaveOpen(false)}
      />

      <ConfirmDialog
        open={discardOpen}
        title="Discard saved information?"
        message={discardMessage}
        confirmLabel="Discard saved information"
        cancelLabel="Keep it"
        busy={discarding}
        onConfirm={() => void handleDiscard()}
        onCancel={() => setDiscardOpen(false)}
      />
    </div>
  );
}

export default ApplicationWizard;

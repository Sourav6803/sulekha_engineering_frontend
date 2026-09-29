'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Briefcase, ShieldAlert, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/shared/PageContainer';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { EmptyState } from '@/components/shared/EmptyState';
import { Modal } from '@/components/shared/Modal';
import { QuotationForm } from '@/components/features/quotations/QuotationForm';
import { useQuotationDefaults, useQuotations } from '@/hooks/useQuotations';
import { useAuth } from '@/hooks/useAuth';
import { handleApiError } from '@/lib/errors/handleApiError';
import { canManageQuotations } from '@/lib/permissions';
import type {
  QuotationNextNumber,
  QuotationPayload,
  QuotationType,
  QuotationTypeOption,
} from '@/types/quotation';

/**
 * What each sheet is, shown before the form opens. The server sends the same
 * list (GET /quotations/defaults) so the two can never drift; this is only the
 * copy shown while that request is still in flight.
 */
const FALLBACK_TYPES: QuotationTypeOption[] = [
  {
    value: 'consumer',
    label: 'Consumer (PM Surya Ghar)',
    title: 'Quotation for PM Surya Ghar Muft Bijli Yojana',
    tagline: '',
    showSerialColumn: false,
    showSpecificationColumn: false,
    showSections: false,
    amountIncludesGST: true,
    acceptance: 'client',
    itemLimit: 14,
    terms: [],
    paymentTerms: [],
  },
  {
    value: 'partner',
    label: 'Business / solar partner',
    title: 'Quotation for grid connected solar power plant',
    tagline: '',
    showSerialColumn: true,
    showSpecificationColumn: true,
    showSections: true,
    amountIncludesGST: false,
    acceptance: 'vendor',
    itemLimit: 30,
    terms: [],
    paymentTerms: [],
  },
];

const SHEET_BLURB: Record<QuotationType, string> = {
  consumer:
    'The household sheet. One fixed format for every consumer quotation, with the standard 8-line BOQ, GST-inclusive total and the consumer signing the acceptance.',
  partner:
    'The business sheet, for a solar partner, an institutional client or a material supply order. No fixed pattern — you lay out the lines, the sections and the wording yourself.',
};

export default function NewQuotationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const canEdit = canManageQuotations(user?.role);

  const { createQuotation, fetchNextNumber, checkNumber } = useQuotations();
  const { defaults } = useQuotationDefaults();

  const [quotationType, setQuotationType] = useState<QuotationType | null>(null);
  const [nextNumber, setNextNumber] = useState<QuotationNextNumber | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typeOptions = defaults?.quotationTypes?.length ? defaults.quotationTypes : FALLBACK_TYPES;
  const chosen = quotationType ? typeOptions.find((t) => t.value === quotationType) : undefined;

  const loadNextNumber = useCallback(
    (schemeCode?: string, issueDate?: string) => {
      void fetchNextNumber({ schemeCode, issueDate }).then(setNextNumber);
    },
    [fetchNextNumber]
  );

  /**
   * Preview the number the save will use. It is a preview only — the server
   * assigns the final number inside the create request, and the same global
   * sequence serves both sheets, so the number is the last one plus one either
   * way. The date is part of the request because the number carries a financial
   * year.
   */
  useEffect(() => {
    if (!quotationType) return;
    loadNextNumber();
  }, [loadNextNumber, quotationType]);

  const handleSubmit = async (payload: QuotationPayload) => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await createQuotation({ ...payload, quotationType: quotationType ?? 'consumer' });
      toast.success('Quotation created', { description: response.message });
      router.push(`/quotations/${response.data._id}`);
    } catch (err) {
      const message = handleApiError(err);
      setError(message);
      toast.error('Could not create the quotation', { description: message });
    } finally {
      setSubmitting(false);
    }
  };

  if (!canEdit) {
    return (
      <PageContainer>
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Quotations', href: '/quotations' },
            { label: 'New' },
          ]}
        />
        <div className="mt-6">
          <EmptyState
            icon={ShieldAlert}
            title="You cannot create quotations"
            description="Only an administrator or manager can create and edit quotations. Ask an admin for access."
            action={
              <button type="button" onClick={() => router.push('/quotations')} className="neutral-button">
                Back to quotations
              </button>
            }
          />
        </div>
      </PageContainer>
    );
  }

  /**
   * The sheet is chosen before the form opens, because the choice decides which
   * fields the form shows. Escape or a backdrop click goes back to the list
   * rather than leaving an empty form behind.
   */
  const chooser = (
    <Modal
      open={quotationType === null}
      onClose={() => router.push('/quotations')}
      title="Which quotation are you making?"
      eyebrow="New quotation"
      size="md"
    >
      <div className="space-y-3">
        {typeOptions.map((option) => {
          const Icon = option.value === 'consumer' ? Sun : Briefcase;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setQuotationType(option.value)}
              className="flex w-full items-start gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-left transition-colors hover:border-[var(--primary)] hover:bg-[var(--surface-muted)]"
            >
              <span className="mt-0.5 rounded-full bg-[var(--surface-muted)] p-2 text-[var(--primary)]">
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-[var(--foreground)]">{option.label}</span>
                <span className="mt-1 block text-xs text-[var(--muted)]">{SHEET_BLURB[option.value]}</span>
                <span className="mt-1 block text-xs text-[var(--muted)]">
                  Up to {option.itemLimit} BOQ lines · {option.amountIncludesGST ? 'total includes GST' : 'total before GST'}
                  {option.showSections ? ' · section sub-totals' : ''}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </Modal>
  );

  if (quotationType === null) {
    return (
      <PageContainer>
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Quotations', href: '/quotations' },
            { label: 'New' },
          ]}
        />
        {chooser}
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Quotations', href: '/quotations' },
          { label: 'New' },
        ]}
      />

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push('/quotations')}
          className="rounded p-1.5 text-[var(--secondary)] transition-colors hover:text-[var(--foreground)]"
          title="Back to quotations"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            New {quotationType === 'consumer' ? 'consumer' : 'business'} quotation
          </h1>
          <p className="text-sm text-[var(--muted)]">
            The next free number is filled in for you — the same sequence serves both sheets. Type over it
            if the office has already issued one; a number that is taken is flagged before you save.
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)]">
          {quotationType === 'consumer' ? <Sun className="h-3.5 w-3.5" /> : <Briefcase className="h-3.5 w-3.5" />}
          {chosen?.label ?? quotationType}
        </span>
        <button
          type="button"
          onClick={() => setQuotationType(null)}
          className="text-xs text-[var(--muted)] underline hover:text-[var(--foreground)]"
        >
          Change sheet type
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--error)]">
          {error}
        </p>
      )}

      <div className="mt-4">
        <QuotationForm
          key={quotationType}
          mode="create"
          quotationType={quotationType}
          submitting={submitting}
          nextNumber={nextNumber}
          defaults={defaults}
          onSchemeChange={loadNextNumber}
          onIssueDateChange={(issueDate) => loadNextNumber(undefined, issueDate)}
          onCheckNumber={checkNumber}
          onSubmit={handleSubmit}
        />
      </div>
    </PageContainer>
  );
}

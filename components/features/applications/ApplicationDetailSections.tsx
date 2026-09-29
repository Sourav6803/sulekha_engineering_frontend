'use client';

import { useState, type ReactNode } from 'react';
import { ExternalLink, FileText, Loader2, ShieldCheck, ShieldOff } from 'lucide-react';
import { humaniseEnum } from './applicationDisplay';
import { formatDateShort, formatINR } from '@/lib/format';
import type { ApplicationViewMode } from './ApplicationDocumentsSection';
import type {
  ApplicationDocument,
  ApplicationElectricBillVerifyPayload,
  ApplicationNameMatchVerdict,
} from '@/types/application';

/** A value that is not filled yet renders as an em dash, never "undefined". */
export function dash(value: unknown): string {
  return value === null || value === undefined || value === '' ? '—' : String(value);
}

/** Tri-state boolean: the loan question has a real "not answered yet". */
export function yesNo(value: boolean | null | undefined): string {
  return value === true ? 'Yes' : value === false ? 'No' : '—';
}

export function money(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : formatINR(value);
}

/** A titled panel with a definition grid — the read-only counterpart of a wizard step. */
export function DetailSection({
  title,
  description,
  badges,
  children,
}: {
  title: string;
  description?: string;
  badges?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="panel p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-[var(--foreground)]">{title}</h2>
          {description && <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{description}</p>}
        </div>
        {badges && <div className="flex shrink-0 flex-wrap items-center gap-1.5">{badges}</div>}
      </div>
      <dl className="mt-4 grid gap-x-6 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-3">{children}</dl>
    </section>
  );
}

/** One labelled value. `span` widens it across the whole grid (notes, addresses). */
export function DetailField({
  label,
  value,
  span = false,
}: {
  label: string;
  value: ReactNode;
  span?: boolean;
}) {
  return (
    <div className={`min-w-0 ${span ? 'sm:col-span-2 lg:col-span-3' : ''}`}>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-soft)]">{label}</dt>
      <dd className="mt-0.5 text-sm leading-5 text-[var(--foreground)] [overflow-wrap:anywhere]">
        {value === '' || value === null || value === undefined ? '—' : value}
      </dd>
    </div>
  );
}

const MONO = 'font-mono tabular-nums';

// ---------------------------------------------------------------- sections

export function ConsumerSection({ application }: { application: ApplicationDocument }) {
  return (
    <DetailSection title="Consumer details" description="Who the application is for.">
      <DetailField label="Consumer name" value={application.consumerName} />
      <DetailField label="Mobile" value={<span className={MONO}>{dash(application.phone)}</span>} />
      <DetailField
        label="Alternate mobile"
        value={<span className={MONO}>{dash(application.alternatePhone)}</span>}
      />
      <DetailField
        label="Aadhaar number"
        value={<span className={MONO}>{dash(application.aadhaarNumber)}</span>}
      />
      <DetailField label="PAN" value={<span className={MONO}>{dash(application.panNumber)}</span>} />
      <DetailField label="Email" value={dash(application.email)} />
    </DetailSection>
  );
}

export function SiteSection({
  application,
  siteTypeLabels,
}: {
  application: ApplicationDocument;
  siteTypeLabels: Record<string, string>;
}) {
  const address = application.address ?? {};
  const siteTypeLabel = application.siteType
    ? siteTypeLabels[application.siteType] ?? humaniseEnum(application.siteType)
    : '—';

  return (
    <DetailSection title="Site & address" description="Where the system will be installed.">
      <DetailField label="Site type" value={siteTypeLabel} />
      <DetailField label="Street" value={dash(address.street)} />
      <DetailField label="Village" value={dash(address.village)} />
      <DetailField label="Block" value={dash(address.block)} />
      <DetailField label="Panchayat" value={dash(address.panchayat)} />
      <DetailField label="District" value={dash(address.district)} />
      <DetailField label="Landmark" value={dash(address.landmark)} />
      <DetailField label="Pincode" value={<span className={MONO}>{dash(address.pincode)}</span>} />
      <DetailField label="Site notes" value={dash(application.siteNotes)} span />
    </DetailSection>
  );
}

export function DealSection({ application }: { application: ApplicationDocument }) {
  const deal = application.deal ?? {};
  return (
    <DetailSection title="Deal" description="What was proposed to the consumer.">
      <DetailField
        label="System size"
        value={deal.systemSizeKW != null ? `${deal.systemSizeKW} kW` : '—'}
      />
      <DetailField label="Proposal amount" value={money(deal.proposalAmount)} />
      <DetailField label="Quoted amount" value={money(deal.quotedAmount)} />
      <DetailField
        label="Intention to proceed"
        value={deal.intentionToProceed ? humaniseEnum(deal.intentionToProceed) : '—'}
      />
    </DetailSection>
  );
}

export function LoanSection({ application }: { application: ApplicationDocument }) {
  const loan = application.loan ?? {};
  return (
    <DetailSection title="Loan" description="What the consumer told the agent about an existing loan.">
      <DetailField label="Asked about a loan" value={yesNo(loan.asked)} />
      <DetailField label="Has a running loan" value={yesNo(loan.hasExistingLoan)} />
      <DetailField label="Lender / bank" value={dash(loan.lenderName)} />
      <DetailField label="Loan amount" value={money(loan.loanAmount)} />
      <DetailField label="Outstanding" value={money(loan.outstandingAmount)} />
      <DetailField label="Monthly EMI" value={money(loan.monthlyEmi)} />
      <DetailField label="Consumer informed about subsidy impact" value={yesNo(loan.consumerInformed)} />
      <DetailField label="Remark" value={dash(loan.remark)} span />
    </DetailSection>
  );
}

interface ElectricBillSectionProps {
  application: ApplicationDocument;
  /** Office mode adds the verify / withdraw-verification control. */
  mode?: ApplicationViewMode;
  /** PATCH /applications/:id/electric-bill/verify */
  onVerifyBill?: (payload: ApplicationElectricBillVerifyPayload) => Promise<string | null>;
}

export function ElectricBillSection({ application, mode = 'field', onVerifyBill }: ElectricBillSectionProps) {
  const bill = application.electricBill ?? {};
  const [note, setNote] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const office = mode === 'office' && Boolean(onVerifyBill);
  const idsRecorded = Boolean(bill.consumerId && bill.installationNo);
  const billAttached = Boolean(bill.fileUrl);
  const canVerify = idsRecorded && billAttached;

  const verify = async (verified: boolean) => {
    if (!onVerifyBill) return;
    setPending(true);
    setError(null);
    try {
      const failure = await onVerifyBill({ verified, note: note.trim() || undefined });
      if (failure) {
        setError(failure);
        return;
      }
      setNote('');
    } finally {
      setPending(false);
    }
  };

  return (
    <DetailSection
      title="Electricity bill"
      description="The two ids off the bill and the downloaded file."
      badges={
        bill.verified ? (
          <span className="badge-pill badge-success">Verified</span>
        ) : (
          <span className="badge-pill bg-[var(--surface-muted)] text-[var(--muted)]">Not verified</span>
        )
      }
    >
      <DetailField label="Consumer ID" value={<span className={MONO}>{dash(bill.consumerId)}</span>} />
      <DetailField
        label="Installation ID"
        value={<span className={MONO}>{dash(bill.installationNo)}</span>}
      />
      <DetailField label="Verified by office" value={yesNo(bill.verified)} />
      <DetailField
        label="Portal"
        value={
          bill.portalUrl ? (
            <a
              href={bill.portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex max-w-full items-center gap-1.5 font-medium text-[var(--primary-active)] hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">WBSEDCL bill portal</span>
            </a>
          ) : (
            '—'
          )
        }
      />
      <DetailField
        label="Bill file"
        value={
          bill.fileUrl ? (
            <a
              href={bill.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex max-w-full items-center gap-1.5 font-medium text-[var(--primary-active)] hover:underline"
            >
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{bill.fileName ?? 'Open the bill'}</span>
            </a>
          ) : (
            'Not attached'
          )
        }
        span
      />

      {office && (
        <div className="min-w-0 sm:col-span-2 lg:col-span-3">
          <div className="rounded-[1rem] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-soft)]">
              Office verification
            </p>
            <p className="mt-1 text-[11px] leading-4 text-[var(--muted)]">
              Confirm the consumer ID and installation ID match the bill file. The server refuses this until both ids
              and the bill file are on record.
            </p>
            <input
              className="form-input mt-2 w-full"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Verification note (optional)"
              disabled={pending}
              aria-label="Verification note"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className="brand-button inline-flex items-center gap-1.5 px-4 py-2 text-xs"
                onClick={() => void verify(true)}
                disabled={pending || !canVerify}
                title={canVerify ? undefined : 'Record both ids and attach the bill file first'}
              >
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                Mark verified
              </button>
              <button
                type="button"
                className="neutral-button inline-flex items-center gap-1.5 px-4 py-2 text-xs"
                onClick={() => void verify(false)}
                disabled={pending || !canVerify || !bill.verified}
                title={bill.verified ? undefined : 'The bill is not verified'}
              >
                <ShieldOff className="h-3.5 w-3.5" /> Mark unverified
              </button>
            </div>
            {!canVerify && (
              <p className="mt-2 text-[11px] leading-4 text-[var(--muted)]">
                Record the consumer ID and installation ID and attach the bill file before verifying.
              </p>
            )}
            {error && (
              <p role="alert" className="mt-2 text-[11px] leading-4 text-[var(--error)] [overflow-wrap:anywhere]">
                {error}
              </p>
            )}
          </div>
        </div>
      )}
    </DetailSection>
  );
}

const VERDICT_TONE: Record<ApplicationNameMatchVerdict, string> = {
  match: 'badge-success',
  near_match: 'badge-warning',
  mismatch: 'badge-error',
  incomplete: 'bg-[var(--surface-muted)] text-[var(--muted)]',
};

export function NameMatchSection({ application }: { application: ApplicationDocument }) {
  const match = application.nameMatch ?? {};
  const verdict = match.verdict ?? undefined;

  return (
    <DetailSection
      title="Names & name match"
      description="The name as read off each document, and the server's verdict."
      badges={
        verdict ? (
          <span className={`badge-pill ${VERDICT_TONE[verdict] ?? VERDICT_TONE.incomplete}`}>
            {humaniseEnum(verdict)}
          </span>
        ) : (
          <span className="badge-pill bg-[var(--surface-muted)] text-[var(--muted)]">Not checked</span>
        )
      }
    >
      <DetailField label="Consumer name" value={dash(match.consumerName ?? application.consumerName)} />
      <DetailField label="On the Aadhaar" value={dash(match.aadhaarName)} />
      <DetailField label="On the passbook" value={dash(match.passbookName)} />
      <DetailField label="On the electricity bill" value={dash(match.electricBillName)} />
      <DetailField
        label="Checked at"
        value={match.checkedAt ? formatDateShort(match.checkedAt) : '—'}
      />
      <DetailField
        label="Mismatched documents"
        value={match.mismatched && match.mismatched.length > 0 ? match.mismatched.join(', ') : '—'}
      />
      <DetailField label="Verdict note" value={dash(match.message)} span />
    </DetailSection>
  );
}

export default DetailSection;

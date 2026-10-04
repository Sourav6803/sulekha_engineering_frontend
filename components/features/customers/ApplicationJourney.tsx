'use client';

import { Check, Route } from 'lucide-react';
import { REQUIRED_DOCUMENT_TYPES, uploadedDocumentTypes } from './documentCatalogue';
import type { Customer, CustomerDocument } from '@/types/customer';
import type { InstallationDocument } from '@/types/installation';

interface ApplicationJourneyProps {
  customer: Customer;
  installations: InstallationDocument[];
}

type StageState = 'done' | 'current' | 'upcoming';

interface Stage {
  key: string;
  label: string;
  description: string;
  done: boolean;
}

function Marker({ state }: { state: StageState }) {
  if (state === 'done') {
    return (
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-[var(--shadow-xs)]">
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
    );
  }

  if (state === 'current') {
    return (
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-[var(--warning)] bg-white">
        <span className="live-dot h-2 w-2 rounded-full bg-[var(--warning)]" aria-hidden="true" />
      </span>
    );
  }

  return <span className="mt-0.5 h-6 w-6 shrink-0 rounded-full border-2 border-[var(--border)]" />;
}

/**
 * Where the file stands in the PM Surya Ghar process, derived from what is
 * actually on the record.
 *
 * Every stage is tied to evidence — a document of a specific type, or a
 * completed installation — rather than to a field someone has to remember to
 * update. That means the journey is sometimes out of order (a net-metering
 * copy uploaded before the eToken is), which is reported as it is: each stage
 * carries its own flag, so a stage that is genuinely done still shows a tick
 * even if an earlier one is still open. Reordering the truth to make a tidier
 * picture would hide exactly the gap worth chasing.
 */
export function ApplicationJourney({ customer, installations }: ApplicationJourneyProps) {
  // Types with a file behind them, matching how the documents card counts.
  const typesPresent = uploadedDocumentTypes(customer.documents);
  const has = (type: CustomerDocument['type']) => typesPresent.has(type);

  const requiredPresent = REQUIRED_DOCUMENT_TYPES.filter((type) => has(type)).length;
  const requiredTotal = REQUIRED_DOCUMENT_TYPES.length;
  const hasCompletedInstallation = installations.some((item) => item.status === 'completed');

  const stages: Stage[] = [
    {
      key: 'registration',
      label: 'Registration',
      description: 'Customer record created in the CRM',
      done: true,
    },
    {
      key: 'documents',
      label: 'KYC documents',
      description: `${requiredPresent} of ${requiredTotal} required documents on file`,
      done: requiredTotal > 0 && requiredPresent === requiredTotal,
    },
    {
      key: 'feasibility',
      label: 'Feasibility & approval',
      description: 'RTS report filed and feasibility approved',
      done: has('rtsFeasibilityReport') || has('feasibilityApproval'),
    },
    {
      key: 'etoken',
      label: 'eToken issued',
      description: 'Portal e-token generated against the application',
      done: has('eToken'),
    },
    {
      key: 'installation',
      label: 'Installation',
      description: 'Panels and inverter commissioned on site',
      done: has('sitePhotoAfter') || hasCompletedInstallation,
    },
    {
      key: 'netmetering',
      label: 'Net metering',
      description: 'Net-metering agreement filed and meter changed',
      done: has('netMetering'),
    },
  ];

  const doneCount = stages.filter((stage) => stage.done).length;
  const currentIndex = stages.findIndex((stage) => !stage.done);
  const percent = Math.round((doneCount / stages.length) * 100);

  return (
    <section className="card-luxe wash-mint anim-rise p-6 sm:p-8" style={{ animationDelay: '60ms' }}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(140deg,#34C46B_0%,#0B7A3D_100%)] text-white shadow-[var(--shadow-sm)]">
            <Route className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Application journey</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {doneCount} of {stages.length} stages complete
            </p>
          </div>
        </div>

        <span className="badge-pill bg-[var(--primary-tint)] text-[var(--primary-active)]">
          {percent}% complete
        </span>
      </div>

      <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-[var(--surface-strong)]">
        <div
          className="meter-fill h-full rounded-full"
          style={{ width: `${percent}%`, backgroundImage: 'var(--gradient-leaf)' }}
        />
      </div>

      <ol className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {stages.map((stage, index) => {
          const state: StageState = stage.done ? 'done' : index === currentIndex ? 'current' : 'upcoming';

          return (
            <li
              key={stage.key}
              className={`flex items-start gap-3 rounded-[var(--radius-sm)] border p-3.5 ${
                state === 'done'
                  ? 'border-[var(--primary-soft)] bg-white/80'
                  : state === 'current'
                    ? 'border-[var(--warning)] bg-[var(--warning-tint)]'
                    : 'border-[var(--border-soft)] bg-white/50'
              }`}
            >
              <Marker state={state} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-[var(--foreground)]">{stage.label}</p>
                  {state === 'current' && (
                    <span className="badge-pill badge-warning !px-2 !py-0.5 !text-[0.625rem]">Next</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-[var(--muted)]">{stage.description}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

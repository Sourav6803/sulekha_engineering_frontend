'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle,
  Download,
  ExternalLink,
  FileText,
  MapPin,
  Phone,
  Settings2,
  ShieldCheck,
  StickyNote,
  Upload,
  Wrench,
} from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDateShort, formatINR, formatNumber } from '@/lib/format';
import { customerStatusStyle, ROOF_TYPE_LABEL, TIME_SLOT_LABEL } from './customerStatus';
import { DOCUMENT_CATALOGUE, uploadedDocumentTypes } from './documentCatalogue';
import { CustomerHero } from './CustomerHero';
import { ApplicationJourney } from './ApplicationJourney';
import { SchemeReferenceCard } from './SchemeReferenceCard';
import { DocumentUploadDialog } from './DocumentUploadDialog';
import { PanelSerialNumbersCard } from './PanelSerialNumbersCard';
import type { CSSProperties, ComponentType, ReactNode } from 'react';
import type { Customer, CustomerDocument } from '@/types/customer';
import type { InstallationDocument, InstallationStatus } from '@/types/installation';
import type { CustomerHistorySummary } from '@/lib/api/customers.api';

interface CustomerDetailViewProps {
  customer: Customer;
  summary: CustomerHistorySummary;
  installations: InstallationDocument[];
  loading?: boolean;
  canEdit?: boolean;
  onEdit?: () => void;
  onRefetch?: () => void;
  /** Saves the panel serial list on its own, without opening the edit modal. */
  onSavePanelSerials?: (serials: string[]) => Promise<void>;
}

const INSTALL_STATUS: Record<InstallationStatus, { label: string; className: string }> = {
  pending_quotation: { label: 'Pending quotation', className: 'badge-warning' },
  quoted: { label: 'Quoted', className: 'badge-pill bg-[var(--surface-muted)] text-[var(--muted)]' },
  scheduled: { label: 'Scheduled', className: 'badge-pill bg-[var(--surface-muted)] text-[var(--muted)]' },
  in_progress: { label: 'In progress', className: 'badge-warning' },
  completed: { label: 'Completed', className: 'badge-success' },
  cancelled: { label: 'Cancelled', className: 'badge-error' },
};

/** Shared card header: gradient icon tile, title, supporting line. */
function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  tile,
  action,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  tile: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-4">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-[var(--shadow-sm)] ${tile}`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

/** One label/value line inside a FieldGroup. */
function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-sm text-[var(--muted)]">{label}</dt>
      <dd className="text-right text-sm font-medium text-[var(--foreground)]">{value ?? '—'}</dd>
    </div>
  );
}

/** A titled cluster of fields, on its own tinted panel. */
function FieldGroup({
  icon: Icon,
  title,
  tile,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  tile: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-[var(--border-soft)] bg-white/70 p-5">
      <div className="flex items-center gap-2.5">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-white ${tile}`}>
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{title}</h3>
      </div>
      <dl className="mt-3 divide-y divide-[var(--border-soft)]">{children}</dl>
    </div>
  );
}

/**
 * Documents on file, as a ring.
 *
 * The figure is the count of document records, not of the catalogue slots
 * filled — a customer can hold two quotations and no PAN, and the ring
 * reports that honestly rather than capping at 100%.
 */
function DocumentRing({ uploaded, total }: { uploaded: number; total: number }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const ratio = total > 0 ? Math.min(uploaded / total, 1) : 0;
  const dash = circumference * ratio;

  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90" aria-hidden="true">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="var(--surface-strong)" strokeWidth="8" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          className="ring-draw"
          style={{ '--ring-circumference': `${circumference}` } as CSSProperties}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-xl font-semibold text-[var(--foreground)]">{uploaded}</span>
        <span className="text-[0.625rem] uppercase tracking-[0.12em] text-[var(--muted-soft)]">
          of {total}
        </span>
      </div>
    </div>
  );
}

export function CustomerDetailView({
  customer,
  summary,
  installations,
  loading = false,
  canEdit = false,
  onEdit,
  onRefetch,
  onSavePanelSerials,
}: CustomerDetailViewProps) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const documents = customer.documents ?? [];
  const fullAddress = [customer.address, customer.city, customer.state, customer.pincode]
    .filter(Boolean)
    .join(', ');

  /*
   * Everything below counts catalogue slots filled, not document records held.
   * The two differ: a customer can hold two quotations and no PAN, and only
   * the slot count means anything as a completion figure — counting records
   * would let the ring read "20 of 18".
   */
  const uploadedTypes = uploadedDocumentTypes(documents);
  const uploadedCount = DOCUMENT_CATALOGUE.filter((item) => uploadedTypes.has(item.type)).length;
  const requiredMissing = DOCUMENT_CATALOGUE.filter(
    (item) => item.required && !uploadedTypes.has(item.type),
  ).length;

  /** "pending" is a record with no file behind it — worth distinguishing from
   *  nothing at all, because the record is the reminder that it was started. */
  const getDocumentStatus = (typeValue: CustomerDocument['type']): 'uploaded' | 'pending' | 'missing' => {
    if (uploadedTypes.has(typeValue)) return 'uploaded';
    return documents.some((item) => item.type === typeValue) ? 'pending' : 'missing';
  };

  return (
    <div className="space-y-6">
      <CustomerHero customer={customer} summary={summary} canEdit={canEdit} onEdit={onEdit} />

      <ApplicationJourney customer={customer} installations={installations} />

      {/* Documents */}
      <section className="card-luxe wash-sky anim-rise p-6 sm:p-8" style={{ animationDelay: '100ms' }}>
        <SectionHeader
          icon={FileText}
          title="Documents"
          subtitle={
            requiredMissing === 0
              ? 'Every required document is on file'
              : `${requiredMissing} required document${requiredMissing === 1 ? '' : 's'} still missing`
          }
          tile="bg-[linear-gradient(140deg,#4A90D9_0%,#1F5FA8_100%)]"
          action={
            <div className="flex items-center gap-4">
              <DocumentRing uploaded={uploadedCount} total={DOCUMENT_CATALOGUE.length} />
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setUploadDialogOpen(true)}
                  className="brand-button"
                >
                  <Upload className="h-4 w-4" />
                  Upload
                </button>
              )}
            </div>
          }
        />

        {/* Status grid — every type the CRM tracks, so a gap is visible
            without opening the record. */}
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {DOCUMENT_CATALOGUE.map((item, index) => {
            const status = getDocumentStatus(item.type);

            const chipClass =
              status === 'uploaded'
                ? 'border-[var(--success)] bg-[var(--success-tint)]'
                : status === 'pending'
                  ? 'border-[var(--warning)] bg-[var(--warning-tint)]'
                  : item.required
                    ? 'border-[var(--border)] bg-white/70'
                    : 'border-[var(--border-soft)] bg-white/50';

            return (
              <div
                key={item.type}
                className={`anim-pop flex items-center gap-2 rounded-lg border px-3 py-2 ${chipClass}`}
                style={{ animationDelay: `${150 + index * 22}ms` }}
              >
                {status === 'uploaded' ? (
                  <CheckCircle className="h-4 w-4 shrink-0 text-[var(--success)]" />
                ) : status === 'pending' ? (
                  <AlertCircle className="h-4 w-4 shrink-0 text-[var(--warning)]" />
                ) : (
                  <span
                    className={`h-4 w-4 shrink-0 rounded-full border-2 ${
                      item.required ? 'border-[var(--muted-soft)]' : 'border-[var(--border)]'
                    }`}
                  />
                )}
                <span
                  className={`truncate text-xs font-medium ${
                    status === 'uploaded' ? 'text-[var(--success)]' : 'text-[var(--muted)]'
                  }`}
                  title={item.label}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Files on file */}
        {documents.length > 0 && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {documents.map((doc) => (
              <article
                key={doc._id}
                className="group flex items-start justify-between gap-3 rounded-[var(--radius-sm)] border border-[var(--border-soft)] bg-white/80 p-4 transition-all duration-[var(--duration)] ease-out hover:-translate-y-0.5 hover:border-[var(--primary-soft)] hover:shadow-[var(--shadow-card-hover)]"
              >
                <div className="flex min-w-0 gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-tint)] text-[var(--primary-active)]">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--foreground)]" title={doc.fileName}>
                      {doc.fileName}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--muted-soft)]">
                      {doc.type.replace(/([A-Z])/g, ' $1').trim()}
                      {doc.fileSize ? ` · ${(doc.fileSize / 1024).toFixed(0)} KB` : ''}
                      {doc.uploadedAt ? ` · ${formatDateShort(doc.uploadedAt)}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ghost-button !px-2 !py-1.5"
                    title="View"
                    aria-label={`View ${doc.fileName}`}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <a
                    href={doc.url}
                    download
                    className="ghost-button !px-2 !py-1.5"
                    title="Download"
                    aria-label={`Download ${doc.fileName}`}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/*
        Rendered only when the caller can save it. A card whose Save button is
        wired to nothing would be worse than no card: the installer would type six
        serial numbers, press Save, and be told nothing.
      */}
      {onSavePanelSerials && (
        <PanelSerialNumbersCard
          serials={customer.panelSerialNumbers ?? []}
          systemSizeKW={customer.systemSizeKW}
          canEdit={canEdit}
          onSave={onSavePanelSerials}
        />
      )}

      {/* Record details */}
      <section className="card-luxe wash-mint p-6 sm:p-8">
        <SectionHeader
          icon={Phone}
          title="Customer record"
          subtitle={`${customer.customerId} · ${customerStatusStyle(customer.status).label}`}
          tile="bg-[linear-gradient(140deg,#2BB3A8_0%,#0F7A5A_100%)]"
        />

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <FieldGroup
            icon={Phone}
            title="Contact"
            tile="bg-[linear-gradient(140deg,#34C46B_0%,#0B7A3D_100%)]"
          >
            <Field label="Phone" value={<span className="font-mono">{customer.phone}</span>} />
            <Field
              label="Alternate phone"
              value={customer.alternatePhone ? <span className="font-mono">{customer.alternatePhone}</span> : '—'}
            />
            <Field label="Email" value={customer.email} />
          </FieldGroup>

          <FieldGroup
            icon={MapPin}
            title="Location"
            tile="bg-[linear-gradient(140deg,#4A90D9_0%,#1F5FA8_100%)]"
          >
            <Field label="Address" value={fullAddress} />
            <Field label="Village" value={customer.village} />
            <Field label="Block" value={customer.block} />
            <Field label="Panchayat" value={customer.panchayat} />
            <Field label="Landmark" value={customer.landmark} />
          </FieldGroup>

          <FieldGroup
            icon={ShieldCheck}
            title="Identity & KYC"
            tile="bg-[linear-gradient(140deg,#6D5BD0_0%,#4635A3_100%)]"
          >
            <Field label="PAN number" value={customer.panNumber} />
            <Field label="GST number" value={customer.gstNumber} />
            <Field label="Referred by" value={customer.referredBy} />
          </FieldGroup>

          <FieldGroup
            icon={Settings2}
            title="System & preference"
            tile="bg-[linear-gradient(140deg,#E8B03A_0%,#C98A08_100%)]"
          >
            <Field
              label="Roof area"
              value={customer.roofArea != null ? `${formatNumber(customer.roofArea)} sq ft` : '—'}
            />
            <Field label="Roof type" value={ROOF_TYPE_LABEL[customer.roofType] ?? customer.roofType} />
            <Field
              label="Preferred date"
              value={
                customer.preferredInstallationDate
                  ? formatDateShort(customer.preferredInstallationDate)
                  : 'No preferred date'
              }
            />
            <Field
              label="Time slot"
              value={
                customer.preferredTimeSlot
                  ? TIME_SLOT_LABEL[customer.preferredTimeSlot] ?? customer.preferredTimeSlot
                  : 'Anytime'
              }
            />
          </FieldGroup>

          <div className="lg:col-span-2">
            <FieldGroup
              icon={StickyNote}
              title="Notes"
              tile="bg-[linear-gradient(140deg,#5E7A69_0%,#33503F_100%)]"
            >
              <div className="py-2.5 text-sm text-[var(--foreground)]">
                {customer.notes ?? 'No notes recorded for this customer.'}
              </div>
            </FieldGroup>
          </div>
        </div>
      </section>

      {/* Installations */}
      <section className="card-luxe wash-teal p-6 sm:p-8">
        <SectionHeader
          icon={Wrench}
          title="Installations"
          subtitle={
            installations.length === 0
              ? 'No installations recorded yet'
              : `${formatNumber(installations.length)} on file · ${formatINR(summary.totalCost)} total value`
          }
          tile="bg-[linear-gradient(140deg,#34C46B_0%,#0B7A3D_100%)]"
        />

        {loading ? (
          <div className="skeleton mt-6 h-32 w-full" />
        ) : installations.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={Wrench}
              title="No installations yet"
              description="Installations created for this customer will appear here."
            />
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-3 text-left text-sm">
              <thead className="table-head">
                <tr className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-soft)]">
                  <th scope="col" className="px-4 py-2">Installation</th>
                  <th scope="col" className="px-4 py-2">Date</th>
                  <th scope="col" className="px-4 py-2 text-right">Size</th>
                  <th scope="col" className="px-4 py-2 text-right">Value</th>
                  <th scope="col" className="px-4 py-2">Status</th>
                  <th scope="col" className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {installations.map((installation) => {
                  const isStatus = (installation.status ?? 'pending_quotation') as InstallationStatus;
                  const instStatus = INSTALL_STATUS[isStatus] ?? INSTALL_STATUS.pending_quotation;
                  return (
                    <tr
                      key={installation._id}
                      className="rounded-[1.25rem] border border-[var(--border)] bg-white shadow-[var(--shadow-xs)] transition-colors duration-[var(--duration)] hover:bg-[var(--primary-tint)]/40"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm font-semibold text-[var(--foreground)]">
                          {installation.installationId}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--muted)]">{formatDateShort(installation.installDate)}</td>
                      <td className="px-4 py-3 text-right font-mono text-[var(--foreground)]">
                        {formatNumber(installation.systemSizeKW)} kW
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[var(--foreground)]">
                        {installation.totalCost != null ? formatINR(installation.totalCost) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge-pill ${instStatus.className}`}>{instStatus.label}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/installations/${installation._id}`}
                          aria-label={`View ${installation.installationId}`}
                          className="ghost-button !p-2"
                          title="View installation"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <SchemeReferenceCard systemSizeKW={customer.systemSizeKW} roofArea={customer.roofArea} />

      {/* Upload Dialog */}
      {canEdit && (
        <DocumentUploadDialog
          customerId={customer._id}
          existingDocuments={documents}
          open={uploadDialogOpen}
          onClose={() => setUploadDialogOpen(false)}
          onSuccess={() => {
            onRefetch?.();
          }}
        />
      )}
    </div>
  );
}

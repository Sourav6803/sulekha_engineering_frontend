'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Download, ExternalLink, FileText, Pencil, Users, Wrench, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDateShort, formatINR, formatNumber } from '@/lib/format';
import { customerStatusStyle, ROOF_TYPE_LABEL, TIME_SLOT_LABEL } from './customerStatus';
import { DocumentUploadDialog } from './DocumentUploadDialog';
import type { Customer } from '@/types/customer';
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
}

const INSTALL_STATUS: Record<InstallationStatus, { label: string; className: string }> = {
  pending_quotation: { label: 'Pending quotation', className: 'badge-warning' },
  quoted: { label: 'Quoted', className: 'badge-pill bg-[var(--surface-muted)] text-[var(--muted)]' },
  scheduled: { label: 'Scheduled', className: 'badge-pill bg-[var(--surface-muted)] text-[var(--muted)]' },
  in_progress: { label: 'In progress', className: 'badge-warning' },
  completed: { label: 'Completed', className: 'badge-success' },
  cancelled: { label: 'Cancelled', className: 'badge-error' },
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--border-soft)] py-3 last:border-0">
      <span className="text-sm text-[var(--muted)]">{label}</span>
      <span className="text-right text-sm font-medium text-[var(--foreground)]">{value ?? '—'}</span>
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
}: CustomerDetailViewProps) {
  const status = customerStatusStyle(customer.status);
  const fullAddress = [customer.address, customer.city, customer.state, customer.pincode]
    .filter(Boolean)
    .join(', ');

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const documents = customer.documents || [];

  const getDocumentStatus = (typeValue: string) => {
    const doc = documents.find(d => d.type === typeValue);
    if (!doc) return 'missing';
    if (doc.url) return 'uploaded';
    return 'pending';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="surface-card overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--secondary)]">
              <Users className="h-7 w-7" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold text-[var(--foreground)]">{customer.name}</h1>
                <span className={`badge-pill ${status.className}`}>{status.label}</span>
              </div>
              <p className="mt-1 font-mono text-sm text-[var(--muted-soft)]">{customer.customerId}</p>
            </div>
          </div>

          {canEdit && onEdit && (
            <button type="button" className="brand-button" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
              Edit customer
            </button>
          )}
        </div>

        {/* Stat strip */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[var(--radius)] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted)]">Installations</p>
            <p className="mt-3 font-mono text-3xl font-semibold text-[var(--foreground)]">
              {formatNumber(summary.totalInstallations)}
            </p>
            <p className="mt-1 text-xs text-[var(--muted-soft)]">
              {formatNumber(summary.completedInstallations)} completed
            </p>
          </div>
          <div className="rounded-[var(--radius)] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted)]">System capacity</p>
            <p className="mt-3 font-mono text-3xl font-semibold text-[var(--foreground)]">
              {formatNumber(summary.totalSystemCapacity)} <span className="text-base">kW</span>
            </p>
            <p className="mt-1 text-xs text-[var(--muted-soft)]">
              Avg {formatNumber(summary.averageSystemSize)} kW
            </p>
          </div>
          <div className="rounded-[var(--radius)] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted)]">Total value</p>
            <p className="mt-3 font-mono text-3xl font-semibold text-[var(--foreground)]">
              {formatINR(summary.totalCost)}
            </p>
          </div>
          <div className="rounded-[var(--radius)] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted)]">System size</p>
            <p className="mt-3 font-mono text-3xl font-semibold text-[var(--foreground)]">
              {formatNumber(customer.systemSizeKW)} <span className="text-base">kW</span>
            </p>
            <p className="mt-1 text-xs text-[var(--muted-soft)]">{ROOF_TYPE_LABEL[customer.roofType] ?? customer.roofType}</p>
          </div>
        </div>
      </section>

      {/* Details */}
      <section className="surface-card p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-[var(--primary)]" />
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Details</h2>
        </div>
        <div className="mt-4 divide-y divide-[var(--border-soft)] sm:grid sm:grid-cols-2 sm:gap-x-8 sm:divide-y-0">
          <div className="divide-y divide-[var(--border-soft)]">
            <InfoRow label="Phone" value={<span className="font-mono">{customer.phone}</span>} />
            <InfoRow label="Alternate phone" value={customer.alternatePhone ? <span className="font-mono">{customer.alternatePhone}</span> : '—'} />
            <InfoRow label="Email" value={customer.email ?? '—'} />
            <InfoRow label="Village" value={customer.village ?? '—'} />
            <InfoRow label="Block" value={customer.block ?? '—'} />
            <InfoRow label="Panchayat" value={customer.panchayat ?? '—'} />
            <InfoRow label="Landmark" value={customer.landmark ?? '—'} />
          </div>
          <div className="divide-y divide-[var(--border-soft)]">
            <InfoRow label="Address" value={fullAddress} />
            <InfoRow label="Roof area" value={customer.roofArea != null ? `${formatNumber(customer.roofArea)} sq ft` : '—'} />
            <InfoRow label="GST number" value={customer.gstNumber ?? '—'} />
            <InfoRow label="PAN number" value={customer.panNumber ?? '—'} />
            <InfoRow label="Referred by" value={customer.referredBy ?? '—'} />
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[var(--radius)] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted)]">Installation preference</p>
            <p className="mt-2 text-sm text-[var(--foreground)]">
              {customer.preferredInstallationDate ? formatDateShort(customer.preferredInstallationDate) : 'No preferred date'}
            </p>
            <p className="mt-1 text-xs text-[var(--muted-soft)]">
              {customer.preferredTimeSlot ? TIME_SLOT_LABEL[customer.preferredTimeSlot] ?? customer.preferredTimeSlot : 'Any time'}
            </p>
          </div>
          <div className="rounded-[var(--radius)] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted)]">Notes</p>
            <p className="mt-2 text-sm text-[var(--foreground)]">{customer.notes ?? 'No notes'}</p>
          </div>
        </div>
      </section>

      {/* Documents */}
      <section className="surface-card overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[var(--primary)]" />
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Documents</h2>
            <span className="badge-pill bg-[var(--primary-tint)] text-[var(--primary-active)]">
              {documents.length}/15
            </span>
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={() => setUploadDialogOpen(true)}
              className="brand-button"
            >
              <Upload className="h-4 w-4" />
              Upload Documents
            </button>
          )}
        </div>

        {/* Document Status Bar */}
        <div className="mt-6 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-[var(--foreground)]">Document Status</p>
            <span className="text-xs text-[var(--muted)]">
              {documents.length} of 15 uploaded
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { type: 'aadhar', label: 'Aadhar', required: true },
              { type: 'panCard', label: 'PAN', required: true },
              { type: 'passbookOrCheque', label: 'Passbook', required: true },
              { type: 'landRecord', label: 'Land Record', required: true },
              { type: 'sitePhotoBefore', label: 'Site Before', required: true },
              { type: 'sitePhotoAfter', label: 'Site After', required: true },
              { type: 'rtsFeasibilityReport', label: 'RTS Report', required: true },
              { type: 'feasibilityApproval', label: 'Feasibility', required: true },
              { type: 'voterId', label: 'Voter ID', required: false },
              { type: 'electricBill', label: 'Electric Bill', required: false },
              { type: 'loanApprovalLetter', label: 'Loan Letter', required: false },
              { type: 'agreement', label: 'Agreement', required: false },
              { type: 'quotation', label: 'Quotation', required: false },
              { type: 'dcrCertificate', label: 'DCR Cert', required: false },
              { type: 'panelSerialNumber', label: 'Panel Serial', required: false },
            ].map(item => {
              const status = getDocumentStatus(item.type);
              return (
                <div
                  key={item.type}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                    status === 'uploaded'
                      ? 'border-[var(--success)] bg-[var(--success-tint)]'
                      : status === 'pending'
                        ? 'border-[var(--warning)] bg-[var(--warning-tint)]'
                        : 'border-[var(--border-soft)] bg-white'
                  }`}
                >
                  {status === 'uploaded' ? (
                    <CheckCircle className="h-4 w-4 text-[var(--success)]" />
                  ) : status === 'pending' ? (
                    <AlertCircle className="h-4 w-4 text-[var(--warning)]" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-[var(--border)]" />
                  )}
                  <span className={`text-xs font-medium ${
                    status === 'uploaded' ? 'text-[var(--success)]' : 'text-[var(--muted)]'
                  }`}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Documents Grid */}
        {documents.length > 0 && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
              <div key={doc._id} className="rounded-xl border border-[var(--border-soft)] bg-white p-4 shadow-[var(--shadow-xs)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--foreground)] truncate">{doc.fileName}</p>
                    <p className="mt-1 text-xs text-[var(--muted-soft)]">
                      {doc.type.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    {doc.fileSize && (
                      <p className="text-xs text-[var(--muted-soft)]">{(doc.fileSize / 1024).toFixed(1)} KB</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ghost-button !px-2 !py-1.5 text-xs"
                      title="View"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <a
                      href={doc.url}
                      download
                      className="ghost-button !px-2 !py-1.5 text-xs"
                      title="Download"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Installations */}
      <section className="surface-card overflow-hidden p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-[var(--primary)]" />
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Installations</h2>
        </div>

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
              <thead>
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
                    <tr key={installation._id} className="rounded-[1.25rem] border border-[var(--border)] bg-white shadow-[var(--shadow-xs)]">
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

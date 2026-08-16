'use client';

import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Ruler,
  Sun,
  Users,
  Wrench,
} from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/shared/Modal';
import { BOMAssignmentForm } from './BOMAssignmentForm';
import { BOMExcelEditor } from './BOMExcelEditor';
import { installationStatusStyle, INSTALLATION_STATUS, ROOF_TYPE_LABEL } from './installationStatus';
import { formatINR, formatNumber, formatDateShort } from '@/lib/format';
import { downloadBlob } from '@/lib/downloadBlob';
import { installationsApi, type BomVariant, type AssignMaterialsDto } from '@/lib/api/installations.api';
import { handleApiError } from '@/lib/errors/handleApiError';
import type { InstallationDocument, InstallationMaterialUsage, SuggestedBOMSection } from '@/types/installation';

interface InstallationDetailViewProps {
  installation: InstallationDocument;
  canAssign: boolean;
  onRefetch: () => Promise<void> | void;
}

function customerName(installation: InstallationDocument): string {
  const c = installation.customer as unknown as { name?: string } | string | undefined;
  if (c && typeof c === 'object' && 'name' in c && c.name) return String(c.name);
  return installation.customerNameSnapshot ?? '—';
}

function materialName(usage: InstallationMaterialUsage): string {
  const m = usage.material;
  if (m && typeof m === 'object' && 'name' in m && m.name) return String(m.name);
  return usage.materialNameSnapshot ?? '—';
}

function materialCode(usage: InstallationMaterialUsage): string {
  const m = usage.material;
  if (m && typeof m === 'object' && 'materialCode' in m && m.materialCode) return String(m.materialCode);
  return usage.materialCodeSnapshot ?? '—';
}

function suggestedGroups(sections: SuggestedBOMSection[]) {
  const map = new Map<string, { order: number; items: typeof sections[number]['items'] }>();
  (sections ?? []).forEach((section) => {
    const order = section.order ?? map.size;
    const existing = map.get(section.section);
    if (existing) {
      existing.items.push(...(section.items ?? []));
    } else {
      map.set(section.section, { order, items: [...(section.items ?? [])] });
    }
  });
  return Array.from(map.entries())
    .sort((a, b) => a[1].order - b[1].order)
    .map(([section, group]) => ({ section, items: group.items }));
}

export function InstallationDetailView({ installation, canAssign, onRefetch }: InstallationDetailViewProps) {
  const status = installationStatusStyle(installation.status);
  const installed = installation.materialsUsed.filter((u) => u.status !== 'reversed');
  const hasConfirmed = installed.length > 0;

  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [reverseTarget, setReverseTarget] = useState<InstallationMaterialUsage | null>(null);
  const [reverseReason, setReverseReason] = useState('');
  const [reversing, setReversing] = useState(false);
  const [reverseError, setReverseError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<BomVariant | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<string>(installation.status ?? 'pending_quotation');

  const handleStatusUpdate = async () => {
    if (newStatus === installation.status) return;
    setStatusUpdating(true);
    try {
      await installationsApi.updateStatus(installation._id, { status: newStatus });
      toast.success('Status updated');
      await onRefetch();
      setNewStatus(installation.status ?? 'pending_quotation');
    } catch (err) {
      toast.error('Could not update status', { description: handleApiError(err) });
    } finally {
      setStatusUpdating(false);
    }
  };

  const groups = useMemo(() => suggestedGroups(installation.suggestedMaterials ?? []), [installation.suggestedMaterials]);

  const handleConfirm = async (items: AssignMaterialsDto['items']) => {
    setConfirming(true);
    setConfirmError(null);
    try {
      await installationsApi.assignMaterials(installation._id, { items });
      await onRefetch();
      toast.success('Materials confirmed', {
        description: 'Stock was deducted in a single atomic transaction.',
      });
    } catch (err) {
      const message = handleApiError(err);
      setConfirmError(message);
      toast.error('Could not confirm materials', { description: message });
    } finally {
      setConfirming(false);
    }
  };

  const handleReverse = async () => {
    if (!reverseTarget) return;
    if (!reverseReason.trim()) {
      setReverseError('A reversal reason is required.');
      return;
    }
    setReversing(true);
    setReverseError(null);
    try {
      await installationsApi.reverseMaterial(installation._id, reverseTarget._id, { reason: reverseReason.trim() });
      setReverseTarget(null);
      setReverseReason('');
      await onRefetch();
      toast.success('Material reversed', { description: 'Stock has been added back to inventory.' });
    } catch (err) {
      const message = handleApiError(err);
      setReverseError(message);
      toast.error('Could not reverse material', { description: message });
    } finally {
      setReversing(false);
    }
  };

  const handleDownloadPdf = async (variant: BomVariant) => {
    setDownloading(variant);
    try {
      const buffer = await installationsApi.getBomPdf(installation._id, variant);
      downloadBlob(buffer, `BOM-${installation.installationId}-${variant}.pdf`);
      toast.success('BOM downloaded');
    } catch (err) {
      toast.error('Could not download BOM', { description: handleApiError(err) });
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary header */}
      <section className="surface-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary-tint)] text-[var(--primary)]">
              <Sun className="h-6 w-6" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-semibold text-[var(--foreground)]">{installation.installationId}</h2>
                <span className={`badge-pill ${status.className}`}>{status.label}</span>
                <select
                  className="form-input !h-8 !py-1 text-xs"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  {Object.entries(INSTALLATION_STATUS).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="brand-button !h-8 !py-1 text-xs"
                  disabled={newStatus === installation.status || statusUpdating}
                  onClick={handleStatusUpdate}
                >
                  {statusUpdating ? 'Updating…' : 'Update status'}
                </button>
              </div>
              <p className="mt-1.5 flex items-center gap-2 text-sm text-[var(--muted)]">
                <Users className="h-4 w-4" />
                {customerName(installation)}
                {installation.customerPhoneSnapshot && (
                  <span className="font-mono text-xs text-[var(--muted-soft)]">{installation.customerPhoneSnapshot}</span>
                )}
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                <FileText className="mr-1.5 inline h-4 w-4 align-[-2px]" />
                {ROOF_TYPE_LABEL[installation.roofType] ?? installation.roofType} • {formatNumber(installation.systemSizeKW)} kW
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="neutral-button"
              onClick={() => void handleDownloadPdf('suggested')}
              disabled={downloading === 'suggested'}
            >
              {downloading === 'suggested' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Suggested PDF
            </button>
            <button
              type="button"
              className="brand-button"
              onClick={() => void handleDownloadPdf('final')}
              disabled={!hasConfirmed || downloading === 'final'}
              title={hasConfirmed ? undefined : 'Confirm materials first'}
            >
              {downloading === 'final' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Final BOM
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: 'Install date', value: formatDateShort(installation.installDate) },
            { label: 'Order date', value: installation.orderDate ? formatDateShort(installation.orderDate) : '—' },
            { label: 'Inverter', value: installation.inverterCapacity ? `${formatNumber(installation.inverterCapacity)} kW` : '—' },
            { label: 'Labor', value: formatINR(installation.laborCost) },
            { label: 'Materials', value: formatINR(installation.materialsCost) },
            { label: 'Total', value: formatINR(installation.totalCost) },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-[var(--surface-muted)] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted-soft)]">{stat.label}</p>
              <p className="mt-1 truncate text-sm font-semibold text-[var(--foreground)]">{stat.value}</p>
            </div>
          ))}
        </div>

        {(installation.projectNo || installation.quotationNo) && (
          <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm text-[var(--muted)]">
            {installation.projectNo && (
              <span>
                Project No: <span className="font-medium text-[var(--foreground)]">{installation.projectNo}</span>
              </span>
            )}
            {installation.quotationNo && (
              <span>
                Quotation No: <span className="font-medium text-[var(--foreground)]">{installation.quotationNo}</span>
              </span>
            )}
          </div>
        )}
      </section>

      {/* Editable BOM Excel */}
      <section className="surface-card p-5 sm:p-6">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          <Ruler className="h-4 w-4" /> {hasConfirmed ? 'Final BOM (As Built)' : 'BOM Template'}
        </h3>
        <div className="mt-4">
          <BOMExcelEditor
            installationId={installation._id}
            customerName={customerName(installation)}
            mobileNo={installation.customerPhoneSnapshot || undefined}
            projectNo={installation.projectNo || undefined}
            quotationNo={installation.quotationNo || undefined}
            systemSizeKW={installation.systemSizeKW}
            roofType={installation.roofType || undefined}
            variant={hasConfirmed ? 'final' : 'suggested'}
            readonly={hasConfirmed}
            materialsUsed={installed}
            onSave={onRefetch}
          />
        </div>
      </section>

      {/* Load analysis */}
      {installation.loadAnalysisDetails && (
        <section className="surface-card p-5 sm:p-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            <Sun className="h-4 w-4" /> Load analysis
          </h3>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted-soft)]">Daily generation</p>
              <p className="mt-1 font-semibold text-[var(--foreground)]">
                {formatNumber(installation.loadAnalysisDetails.dailyGenerationKWh)} kWh
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted-soft)]">Recommended inverter</p>
              <p className="mt-1 font-semibold text-[var(--foreground)]">
                {formatNumber(installation.loadAnalysisDetails.recommendedInverterKW)} kW
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted-soft)]">Submersible pump</p>
              <p className="mt-1 font-semibold text-[var(--foreground)]">
                {installation.canRunSubmersible ? (
                  <span className="inline-flex items-center gap-1 text-[var(--success)]">
                    <CheckCircle2 className="h-4 w-4" /> Supported
                  </span>
                ) : (
                  'Not supported'
                )}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted-soft)]">Load suitability</p>
              <p className="mt-1 font-semibold text-[var(--foreground)]">
                {installation.loadAnalysisDetails.loadSuitability ?? '—'}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Actual usage / confirm */}
      <section className="surface-card p-5 sm:p-6">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          <Wrench className="h-4 w-4" /> Actual usage
        </h3>

        {confirmError && (
          <div role="alert" className="mt-4 rounded-lg border border-[var(--error)] bg-[var(--error-tint)] p-4 text-sm text-[var(--error)]">
            {confirmError}
          </div>
        )}

        {hasConfirmed ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--border)]">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-soft)] bg-[var(--surface-muted)] text-xs uppercase tracking-[0.12em] text-[var(--muted-soft)]">
                    <th className="px-5 py-3 font-semibold">Material</th>
                    <th className="hidden px-3 py-3 font-semibold md:table-cell">Code</th>
                    <th className="hidden px-3 py-3 font-semibold sm:table-cell">UOM</th>
                    <th className="px-3 py-3 text-right font-semibold">Qty</th>
                    <th className="hidden px-3 py-3 text-right font-semibold lg:table-cell">Cost</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-3 py-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {installed.map((usage) => (
                    <tr key={usage._id} className="border-b border-[var(--border-soft)] last:border-0">
                      <td className="px-5 py-3">
                        <p className="font-medium text-[var(--foreground)]">{materialName(usage)}</p>
                        {usage.reversalReason && (
                          <p className="mt-0.5 text-xs text-[var(--muted)]">{usage.reversalReason}</p>
                        )}
                      </td>
                      <td className="hidden px-3 py-3 font-mono text-xs text-[var(--muted-soft)] md:table-cell">
                        {materialCode(usage)}
                      </td>
                      <td className="hidden px-3 py-3 text-xs text-[var(--muted)] sm:table-cell">{usage.unitSnapshot}</td>
                      <td className="px-3 py-3 text-right font-mono text-[var(--foreground)]">{formatNumber(usage.qty)}</td>
                      <td className="hidden px-3 py-3 text-right text-[var(--muted)] lg:table-cell">
                        {formatINR(usage.totalCostSnapshot)}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`badge-pill ${usage.status === 'reversed' ? 'badge-error' : 'badge-success'}`}>
                          {usage.status === 'installed' ? 'Installed' : usage.status ?? '—'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          className="ghost-button !px-3 !py-1.5 text-xs"
                          onClick={() => {
                            setReverseTarget(usage);
                            setReverseReason('');
                            setReverseError(null);
                          }}
                        >
                          Reverse
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : canAssign ? (
          <div className="mt-4">
            <BOMAssignmentForm sections={installation.suggestedMaterials ?? []} submitting={confirming} onSubmit={handleConfirm} />
          </div>
        ) : (
          <p className="mt-4 text-sm text-[var(--muted)]">No materials have been confirmed for this installation yet.</p>
        )}
      </section>

      {/* Reverse reason modal */}
      <Modal
        open={Boolean(reverseTarget)}
        onClose={() => !reversing && setReverseTarget(null)}
        title="Reverse material"
        eyebrow="Add stock back"
        size="sm"
        footer={
          <>
            <button type="button" className="neutral-button" onClick={() => setReverseTarget(null)} disabled={reversing}>
              Cancel
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-full)] bg-[var(--error)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => void handleReverse()}
              disabled={reversing}
            >
              {reversing ? 'Reversing…' : 'Reverse & restock'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted)]">
            Reverse <strong className="text-[var(--foreground)]">{materialName(reverseTarget ?? ({} as InstallationMaterialUsage))}</strong>{' '}
            ({formatNumber(reverseTarget?.qty ?? 0)} {reverseTarget?.unitSnapshot})? Stock will be added back to inventory.
          </p>
          {reverseError && (
            <div role="alert" className="rounded-lg border border-[var(--error)] bg-[var(--error-tint)] p-3 text-sm text-[var(--error)]">
              {reverseError}
            </div>
          )}
          <label className="block space-y-2">
            <span className="form-label">Reason <span className="ml-1 text-[var(--error)]">*</span></span>
            <textarea
              className="form-input w-full min-h-[88px] resize-y"
              value={reverseReason}
              onChange={(e) => setReverseReason(e.target.value)}
              placeholder="Why is this material being reversed?"
              maxLength={500}
              autoFocus
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}
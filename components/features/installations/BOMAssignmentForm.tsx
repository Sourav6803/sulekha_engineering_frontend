'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { formatNumber } from '@/lib/format';
import type { AssignMaterialsDto } from '@/lib/api/installations.api';
import type { SuggestedBOMItem, SuggestedBOMSection } from '@/types/installation';

/** Extract a usable material ObjectId (hex string) from a suggested BOM item's `material` value. */
function materialIdOf(item: SuggestedBOMItem): string | null {
  const m = item.material;
  if (!m) return null;
  if (typeof m === 'string') return /^[0-9a-fA-F]{24}$/.test(m) ? m : null;
  if (typeof m === 'object' && m._id) {
    const id = String(m._id);
    return /^[0-9a-fA-F]{24}$/.test(id) ? id : null;
  }
  return null;
}

interface Row {
  key: string;
  materialId: string | null;
  materialName: string;
  materialCode: string;
  unit: string;
  suggestedQty: number;
  currentStock?: number;
}

function buildRows(sections: SuggestedBOMSection[]): Row[] {
  const rows: Row[] = [];
  (sections ?? []).forEach((section, si) => {
    const list = Array.isArray(section.items) ? section.items : [];
    list.forEach((item, ii) => {
      rows.push({
        key: `${si}-${ii}`,
        materialId: materialIdOf(item),
        materialName: item.materialName ?? 'Unknown material',
        materialCode: item.materialCode ?? '—',
        unit: item.unit ?? 'pcs',
        suggestedQty: item.quantity ?? 0,
        currentStock: item.currentStock,
      });
    });
  });
  return rows;
}

interface BOMAssignmentFormProps {
  sections: SuggestedBOMSection[];
  submitting?: boolean;
  onSubmit: (items: AssignMaterialsDto['items']) => Promise<void> | void;
}

/**
 * Confirm actual materials used. Pre-filled from the suggested BOM so the
 * install team adjusts quantities rather than entering from scratch. Flags
 * lines where the requested quantity exceeds current stock before submit.
 * Submission runs the backend's atomic stock-decrement transaction.
 */
export function BOMAssignmentForm({ sections, submitting = false, onSubmit }: BOMAssignmentFormProps) {
  const rows = useMemo(() => buildRows(sections), [sections]);

  const [quantities, setQuantities] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    rows.forEach((row) => {
      initial[row.key] = row.suggestedQty > 0 ? String(row.suggestedQty) : '';
    });
    return initial;
  });

  const setQty = (key: string, value: string) => {
    setQuantities((prev) => ({ ...prev, [key]: value }));
  };

  const effectiveRows = rows.filter((row) => {
    const value = quantities[row.key];
    return value !== undefined && value.trim() !== '' && Number(value) > 0;
  });

  const lowStockRows = effectiveRows.filter((row) => {
    const qty = Number(quantities[row.key]);
    return row.currentStock != null && Number.isFinite(qty) && qty > row.currentStock;
  });

  const canSubmit = effectiveRows.length > 0 && lowStockRows.length === 0 && !submitting;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    const items = effectiveRows
      .map((row) => ({
        material: row.materialId as string,
        qty: Number(quantities[row.key]),
      }))
      .filter((row) => row.material != null);
    if (items.length === 0) return;
    void onSubmit(items);
  };

  if (rows.length === 0) {
    return <p className="text-sm text-[var(--muted)]">No suggested materials to confirm.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-[var(--muted)]">
        Confirm the quantity actually installed for each item. This runs the stock-decrement transaction — quantities
        are deducted from inventory in one atomic step.
      </p>

      {lowStockRows.length > 0 && (
        <div role="alert" className="flex items-start gap-3 rounded-lg border border-[var(--error)] bg-[var(--error-tint)] p-4 text-sm text-[var(--error)]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {lowStockRows.length} line{lowStockRows.length > 1 ? 's' : ''} exceed current stock. Reduce these or the
            transaction will be rejected.
          </span>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="table-head">
              <tr className="text-xs uppercase tracking-[0.12em] text-[var(--muted-soft)]">
                <th className="px-5 py-3 font-semibold">Material</th>
                <th className="hidden px-3 py-3 font-semibold md:table-cell">Code</th>
                <th className="hidden px-3 py-3 font-semibold sm:table-cell">UOM</th>
                <th className="hidden px-3 py-3 font-semibold md:table-cell">Stock</th>
                <th className="px-3 py-3 text-right font-semibold">Actual qty</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const raw = quantities[row.key];
                const qty = raw.trim() === '' ? 0 : Number(raw);
                const low = row.currentStock != null && Number.isFinite(qty) && qty > row.currentStock;
                return (
                  <tr key={row.key} className="border-b border-[var(--border-soft)] last:border-0">
                    <td className="px-5 py-3">
                      <p className="font-medium text-[var(--foreground)]">{row.materialName}</p>
                      {!row.materialId && (
                        <p className="mt-0.5 text-xs text-[var(--warning)]">No stock link — skipped on confirm</p>
                      )}
                    </td>
                    <td className="hidden px-3 py-3 font-mono text-xs text-[var(--muted-soft)] md:table-cell">
                      {row.materialCode}
                    </td>
                    <td className="hidden px-3 py-3 text-xs text-[var(--muted)] sm:table-cell">{row.unit}</td>
                    <td className="hidden px-3 py-3 md:table-cell">
                      {row.currentStock != null ? (
                        <span className={low ? 'text-xs font-semibold text-[var(--error)]' : 'text-xs text-[var(--muted)]'}>
                          {low ? `Low (${formatNumber(row.currentStock)})` : formatNumber(row.currentStock)}
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--muted-soft)]">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        className="form-input w-24 !py-1.5 text-right"
                        value={quantities[row.key]}
                        placeholder={row.suggestedQty > 0 ? String(row.suggestedQty) : '0'}
                        onChange={(e) => setQty(row.key, e.target.value)}
                        aria-label={`Actual quantity for ${row.materialName}`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <button type="submit" className="brand-button" disabled={!canSubmit}>
          {submitting ? 'Confirming…' : `Confirm ${effectiveRows.length} item${effectiveRows.length === 1 ? '' : 's'}`}
        </button>
      </div>
    </form>
  );
}
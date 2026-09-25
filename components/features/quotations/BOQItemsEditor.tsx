'use client';

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import type { QuotationItem } from '@/types/quotation';

const UNITS = ['nos', 'mtr', 'kg', 'lot', 'pair', 'bag', 'roll', 'box'] as const;

interface BOQItemsEditorProps {
  items: QuotationItem[];
  onChange: (items: QuotationItem[]) => void;
  /** Maximum lines that fit on a single page (CompanyProfile.quotationItemLimit). */
  limit?: number;
  disabled?: boolean;
}

const emptyLine = (order: number): QuotationItem => ({
  description: '',
  brandModel: '',
  qty: 1,
  unit: 'nos',
  amount: null,
  isOptional: false,
  order,
});

/**
 * The Bill of Quantities editor.
 *
 * The amount column is intentionally not per line by default: the printed
 * document carries one merged amount for the whole BOQ, so the total lives in
 * the quotation form. A per-line amount can still be typed and the total will
 * then follow the sum.
 */
export function BOQItemsEditor({ items, onChange, limit = 14, disabled = false }: BOQItemsEditorProps) {
  const rows = items.length > 0 ? items : [];
  const atLimit = rows.length >= limit;

  const update = (index: number, patch: Partial<QuotationItem>) => {
    onChange(rows.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    onChange(next.map((item, i) => ({ ...item, order: i + 1 })));
  };

  const remove = (index: number) => {
    const next = rows.filter((_, i) => i !== index);
    onChange(next.map((item, i) => ({ ...item, order: i + 1 })));
  };

  const add = () => {
    if (atLimit) return;
    onChange([...rows, emptyLine(rows.length + 1)]);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="form-label mb-0">Bill of quantities</p>
          <p className="text-xs text-[var(--muted)]">
            {rows.length} of {limit} lines · the document prints on one page
          </p>
        </div>
        <button
          type="button"
          onClick={add}
          disabled={disabled || atLimit}
          className="neutral-button inline-flex items-center gap-1.5 px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          Add line
        </button>
      </div>

      {atLimit && (
        <p className="text-xs text-[var(--warning)]" role="status">
          The line limit is reached — remove a line to add another, otherwise the quotation will not fit one page.
        </p>
      )}

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[var(--border-soft)] px-3 py-4 text-center text-sm text-[var(--muted)]">
          No lines yet. Saving without lines uses the standard 8-line template.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-[var(--muted)]">
                <th className="w-8 pb-1">#</th>
                <th className="pb-1">Description</th>
                <th className="w-40 pb-1">Brand / model</th>
                <th className="w-20 pb-1">Qty</th>
                <th className="w-24 pb-1">Unit</th>
                <th className="w-32 pb-1 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item, index) => (
                <tr key={item._id ?? `line-${index}`} className="align-top">
                  <td className="py-1 pr-2 text-xs text-[var(--muted)]">{index + 1}</td>
                  <td className="py-1 pr-2">
                    <input
                      className="form-input w-full"
                      value={item.description}
                      disabled={disabled}
                      onChange={(event) => update(index, { description: event.target.value })}
                      placeholder="e.g. Solar Modules Bifacial TOPcon Panel(610 wp)."
                    />
                  </td>
                  <td className="py-1 pr-2">
                    <input
                      className="form-input w-full"
                      value={item.brandModel ?? ''}
                      disabled={disabled}
                      onChange={(event) => update(index, { brandModel: event.target.value })}
                      placeholder="Waaree/Adani"
                    />
                  </td>
                  <td className="py-1 pr-2">
                    <input
                      className="form-input w-full text-right"
                      type="number"
                      min={0.001}
                      step="any"
                      value={item.qty ?? ''}
                      disabled={disabled}
                      onChange={(event) => update(index, { qty: Number(event.target.value) })}
                    />
                  </td>
                  <td className="py-1 pr-2">
                    <select
                      className="form-input w-full"
                      value={item.unit ?? ''}
                      disabled={disabled}
                      onChange={(event) => update(index, { unit: (event.target.value || null) as QuotationItem['unit'] })}
                    >
                      <option value="">(blank)</option>
                      {UNITS.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-1">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        title="Move up"
                        disabled={disabled || index === 0}
                        onClick={() => move(index, -1)}
                        className="rounded p-1 text-[var(--secondary)] hover:text-[var(--foreground)] disabled:opacity-30"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Move down"
                        disabled={disabled || index === rows.length - 1}
                        onClick={() => move(index, 1)}
                        className="rounded p-1 text-[var(--secondary)] hover:text-[var(--foreground)] disabled:opacity-30"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Remove line"
                        disabled={disabled}
                        onClick={() => remove(index)}
                        className="rounded p-1 text-[var(--secondary)] hover:text-[var(--error)] disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default BOQItemsEditor;

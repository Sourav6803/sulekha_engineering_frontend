'use client';

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import type { QuotationItem } from '@/types/quotation';

const UNITS = ['nos', 'mtr', 'kg', 'lot', 'pair', 'bag', 'roll', 'box', 'kwp', 'set', 'job'] as const;

interface BOQItemsEditorProps {
  items: QuotationItem[];
  onChange: (items: QuotationItem[]) => void;
  /** Maximum lines allowed. The domestic sheet is capped so it fits one page. */
  limit?: number;
  /** Business sheets carry a technical specification column of their own. */
  showSpecification?: boolean;
  /** Business sheets group lines into named plant sections, each with a sub-total. */
  showSections?: boolean;
  /**
   * Business sheets price per section: the section's figure is typed against one
   * of its lines and the document prints it once, merged down the section. The
   * domestic sheet keeps its single total in the form instead, so this column
   * stays off there and the form is unchanged.
   */
  showAmountColumn?: boolean;
  /** Only the domestic sheet has a standard template to fall back on. */
  hasStandardTemplate?: boolean;
  disabled?: boolean;
}

const emptyLine = (order: number): QuotationItem => ({
  description: '',
  brandModel: '',
  specification: '',
  section: '',
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
 *
 * On the business sheet two extra columns appear. `specification` is the sheet's
 * own technical column. `section` is free text: consecutive lines sharing the
 * same label print under one heading with their own sub-total, which is how the
 * project sheets are laid out.
 */
export function BOQItemsEditor({
  items,
  onChange,
  limit = 14,
  showSpecification = false,
  showSections = false,
  showAmountColumn = false,
  hasStandardTemplate = true,
  disabled = false,
}: BOQItemsEditorProps) {
  const rows = items.length > 0 ? items : [];
  const atLimit = rows.length >= limit;

  // Distinct section labels already used, offered as suggestions so the same
  // heading can be repeated down a group without retyping it from scratch.
  const sectionSuggestions = Array.from(
    new Set(rows.map((row) => (row.section ?? '').trim()).filter(Boolean))
  );

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

  /** Copy a line's section label down to every following line still blank. */
  const repeatSectionDown = (index: number) => {
    const label = (rows[index]?.section ?? '').trim();
    if (!label) return;
    const next = [...rows];
    for (let i = index + 1; i < next.length; i += 1) {
      if ((next[i].section ?? '').trim()) break;
      next[i] = { ...next[i], section: label };
    }
    onChange(next);
  };

  const columnCount =
    5 + (showSpecification ? 1 : 0) + (showSections ? 1 : 0) + (showAmountColumn ? 1 : 0);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="form-label mb-0">Bill of quantities</p>
          <p className="text-xs text-[var(--muted)]">
            {rows.length} of {limit} lines
            {showSections ? ' · lines sharing a section print under one heading' : ' · the document prints on one page'}
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
          The line limit is reached — remove a line to add another.
        </p>
      )}

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[var(--border-soft)] px-3 py-4 text-center text-sm text-[var(--muted)]">
          {hasStandardTemplate
            ? 'No lines yet. Saving without lines uses the standard 8-line template.'
            : 'No lines yet. Add a line for every item on this quotation.'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table
            className={`w-full text-sm ${
              showAmountColumn ? 'min-w-[1320px]' : showSpecification ? 'min-w-[1180px]' : 'min-w-[760px]'
            }`}
          >
            <thead className="table-head">
              <tr className="text-left text-xs uppercase tracking-wide text-[var(--muted)]">
                <th className="w-8 pb-1">#</th>
                {showSections && <th className="w-44 pb-1">Section</th>}
                <th className="pb-1">Description</th>
                {showSpecification && <th className="pb-1">Specification</th>}
                <th className="w-40 pb-1">Brand / model</th>
                <th className="w-20 pb-1">Qty</th>
                <th className="w-24 pb-1">Unit</th>
                {showAmountColumn && <th className="w-32 pb-1 text-right">Amount (₹)</th>}
                <th className="w-32 pb-1 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item, index) => {
                const previousSection = index > 0 ? (rows[index - 1].section ?? '').trim() : '';
                const thisSection = (item.section ?? '').trim();
                const startsSection = showSections && thisSection && thisSection !== previousSection;

                return (
                  <tr key={item._id ?? `line-${index}`} className="align-top">
                    <td className="py-1 pr-2 text-xs text-[var(--muted)]">{index + 1}</td>

                    {showSections && (
                      <td className="py-1 pr-2">
                        <input
                          className={`form-input w-full text-xs ${startsSection ? 'font-semibold' : ''}`}
                          value={item.section ?? ''}
                          disabled={disabled}
                          list="boq-section-options"
                          onChange={(event) => update(index, { section: event.target.value })}
                          placeholder={index === 0 ? 'e.g. 5KWP SOLAR POWER PLANT (ON-GRID)' : '(same as above)'}
                        />
                        {startsSection && index < rows.length - 1 && (
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => repeatSectionDown(index)}
                            className="mt-0.5 text-[10px] text-[var(--muted)] underline hover:text-[var(--foreground)]"
                            title="Fill this section down to the following blank lines"
                          >
                            repeat down
                          </button>
                        )}
                      </td>
                    )}

                    <td className="py-1 pr-2">
                      <input
                        className="form-input w-full"
                        value={item.description}
                        disabled={disabled}
                        onChange={(event) => update(index, { description: event.target.value })}
                        placeholder="e.g. Solar PV Module"
                      />
                    </td>

                    {showSpecification && (
                      <td className="py-1 pr-2">
                        <textarea
                          className="form-input w-full text-xs"
                          rows={2}
                          value={item.specification ?? ''}
                          disabled={disabled}
                          onChange={(event) => update(index, { specification: event.target.value })}
                          placeholder="e.g. Mono crystalline/CIGS, 550Wp-600Wp (MNRE listed)"
                        />
                      </td>
                    )}

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
                        onChange={(event) =>
                          update(index, { unit: (event.target.value || null) as QuotationItem['unit'] })
                        }
                      >
                        <option value="">(blank)</option>
                        {UNITS.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </td>
                    {showAmountColumn && (
                      <td className="py-1 pr-2">
                        <input
                          className="form-input w-full text-right"
                          type="number"
                          min={0}
                          step="any"
                          value={item.amount ?? ''}
                          disabled={disabled}
                          onChange={(event) =>
                            update(index, {
                              amount: event.target.value === '' ? null : Number(event.target.value),
                            })
                          }
                          placeholder={startsSection ? 'section price' : ''}
                          title="One figure per section: type it on the section's first line"
                        />
                      </td>
                    )}
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
                );
              })}
            </tbody>
          </table>

          {showSections && sectionSuggestions.length > 0 && (
            <datalist id="boq-section-options">
              {sectionSuggestions.map((section) => (
                <option key={section} value={section} />
              ))}
            </datalist>
          )}

          {columnCount > 5 && (
            <p className="mt-2 text-xs text-[var(--muted)]">
              Section headings print in the order the lines are in. Rows with the same heading, one after
              another, share a sub-total.
              {showAmountColumn
                ? ' Put the section\u2019s price on the first line of the section — the document prints one figure per section, merged down its rows. Lines priced individually are summed instead.'
                : ''}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default BOQItemsEditor;

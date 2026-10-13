/**
 * The domestic sheet's standard BOQ, built in the browser.
 *
 * The server keeps the template (CompanyProfile.defaultItems) and still seeds it
 * when a quotation is saved with no lines at all. This mirrors that build so the
 * form can show the same eight lines from the start, pre-filled and editable —
 * the panel line in particular, which has to be reworded for non-DCR or a
 * different module, and whose count is often not settled until the survey.
 *
 * It mirrors `buildDefaultItems` in backend/src/utils/quotationDefaults.js: the
 * same placeholder tokens, the same structure line, the same panel sizing rule.
 * If that function changes, change this one with it.
 */

import type {
  QuotationBoqTemplateLine,
  QuotationDefaults,
  QuotationItem,
  StructureType,
} from '@/types/quotation';

/** Replace `{{token}}` placeholders. Unknown tokens are left untouched. */
export function fillTemplate(
  template: string,
  values: Record<string, string | number>
): string {
  return String(template ?? '').replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key] ?? '') : match
  );
}

/** 3 -> "3", 3.5 -> "3.5", 5 -> "5" — never "3.0". Mirrors the server's formatNumber. */
function formatNumber(value: string | number | null | undefined): string {
  const n = Number.parseFloat(String(value ?? ''));
  if (!Number.isFinite(n)) return '';
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)));
}

/**
 * Suggested panel count: `ceil(kW * 1000 * factor / Wp)`.
 *
 * The factor (1.2 by default) deliberately oversizes the array, so 3 kW at
 * 610 Wp suggests 6 panels rather than 5. Returns null when there is not enough
 * to go on.
 */
export function suggestedPanelCount(
  systemSizeKW: string | number | null | undefined,
  panelWp: string | number | null | undefined,
  sizingFactor: number | null | undefined
): number | null {
  const kW = Number(systemSizeKW);
  const wp = Number(panelWp);
  const factor = Number(sizingFactor) || 1.2;
  if (!Number.isFinite(kW) || kW <= 0 || !Number.isFinite(wp) || wp <= 0) return null;
  return Math.max(1, Math.ceil((kW * 1000 * factor) / wp));
}

export interface TemplateBuildInput {
  template?: QuotationBoqTemplateLine[] | null;
  structures?: QuotationDefaults['structures'] | null;
  structureType?: StructureType | string;
  systemSizeKW?: string | number | null;
  panelWp?: string | number | null;
  inverterCapacityKW?: string | number | null;
  /** An explicitly chosen panel count, already resolved by the caller. */
  panelQty?: number | null;
  panelBrand?: string;
  inverterBrand?: string;
  sizingFactor?: number | null;
}

/**
 * Build the eight lines for the current form values.
 *
 * A new array every time, so the caller can keep edited lines and re-derive only
 * the untouched ones.
 */
export function buildTemplateItems(input: TemplateBuildInput): QuotationItem[] {
  const template = input.template ?? [];
  if (template.length === 0) return [];

  const structures = input.structures ?? [];
  const structure =
    structures.find((entry) => entry.value === input.structureType) ??
    structures[0] ??
    null;

  const panelWp = Number(input.panelWp) || 0;
  const explicitQty = Number(input.panelQty);
  const panelQty =
    Number.isFinite(explicitQty) && explicitQty > 0
      ? explicitQty
      : suggestedPanelCount(input.systemSizeKW, panelWp, input.sizingFactor) ?? 1;

  const inverterCapacityKW = input.inverterCapacityKW ?? input.systemSizeKW ?? '';

  return template
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((line, index) => {
      const description = line.isStructureLine
        ? structure?.defaultLine ?? ''
        : fillTemplate(line.description, {
            panelWp,
            systemSizeKW: formatNumber(input.systemSizeKW),
            inverterCapacityKW: formatNumber(inverterCapacityKW),
          });

      // The first line carries the panel brand, the second the inverter brand,
      // falling back to whatever the template ships with.
      let brandModel = line.brandModel ?? '';
      if (index === 0 && input.panelBrand) brandModel = input.panelBrand;
      if (index === 1 && input.inverterBrand) brandModel = input.inverterBrand;

      const ruleQty = line.qtyRule === 'panel' ? panelQty : Number(line.qtyRule);
      const qty = Number.isFinite(ruleQty) && ruleQty > 0 ? ruleQty : 1;

      return {
        description,
        brandModel,
        qty,
        unit: line.unit ?? null,
        amount: null,
        isOptional: false,
        order: line.order ?? index + 1,
      } satisfies QuotationItem;
    });
}

export default { fillTemplate, suggestedPanelCount, buildTemplateItems };

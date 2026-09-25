import type { StructureType } from '@/types/quotation';

/** Mounting structure labels. Mirrors the backend STRUCTURE_TYPES enum. */
export const STRUCTURE_LABEL: Record<StructureType, string> = {
  high_rise: 'High-rise rooftop',
  tin_shed: 'Tin shed',
  rcc_rooftop: 'RCC rooftop',
  ground_mount: 'Ground mount',
};

export const STRUCTURE_OPTIONS: Array<{ value: StructureType; label: string }> = (
  Object.keys(STRUCTURE_LABEL) as StructureType[]
).map((value) => ({ value, label: STRUCTURE_LABEL[value] }));

export const structureLabel = (value?: StructureType | null): string =>
  value ? STRUCTURE_LABEL[value] ?? value : '—';

/**
 * The amount exactly as it is printed on the quotation: two decimals, no
 * currency symbol and no thousands separators (195000.00), which is what the
 * existing manual quotations show.
 */
export const formatDocumentAmount = (value?: number | null): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return '';
  return Number(value).toFixed(2);
};

/**
 * The register shows dates the way the old sheet did: dd.mm.yyyy.
 * Returns an empty string for records that never had a date (12 legacy rows).
 */
export const formatRegisterDate = (value?: string | Date | null): string => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}.${date.getFullYear()}`;
};

/** Up to 4 initials for the customer avatar in list rows. */
export const initialsOf = (name?: string): string => {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
};

export const kWLabel = (value?: number | null): string =>
  value === null || value === undefined ? '—' : `${Number(value)} kW`;

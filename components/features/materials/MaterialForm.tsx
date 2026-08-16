'use client';

import { useMemo, useState } from 'react';
import type { CreateMaterialDto, UpdateMaterialDto } from '@/lib/api/materials.api';
import type { MaterialDocument, MaterialUnit } from '@/types/material';

const UNITS: MaterialUnit[] = ['nos', 'mtr', 'kg', 'packet', 'pair', 'bag', 'roll', 'box'];

interface MaterialFormProps {
  initial?: MaterialDocument | null;
  mode: 'create' | 'edit';
  submitting?: boolean;
  onSubmit: (payload: CreateMaterialDto | UpdateMaterialDto) => Promise<void> | void;
}

interface FormState {
  name: string;
  unit: MaterialUnit | '';
  unitCost: string;
  currentStock: string;
  minimumStockLevel: string;
  maximumStockLevel: string;
  isConsumable: boolean;
  preferredSupplier: string;
  alternateSuppliers: string;
}

const emptyForm = (): FormState => ({
  name: '',
  unit: '',
  unitCost: '',
  currentStock: '',
  minimumStockLevel: '',
  maximumStockLevel: '',
  isConsumable: false,
  preferredSupplier: '',
  alternateSuppliers: '',
});

function fromMaterial(material: MaterialDocument): FormState {
  const preferred =
    material.preferredSupplier && typeof material.preferredSupplier === 'object'
      ? material.preferredSupplier._id
      : (material.preferredSupplier as string | undefined) ?? '';
  const alternates = Array.isArray(material.alternateSuppliers)
    ? material.alternateSuppliers
        .map((s) => (typeof s === 'object' ? s._id : s))
        .join(', ')
    : '';

  return {
    name: material.name ?? '',
    unit: (material.unit as MaterialUnit) ?? '',
    unitCost: material.unitCost != null ? String(material.unitCost) : '',
    currentStock: material.currentStock != null ? String(material.currentStock) : '',
    minimumStockLevel: material.minimumStockLevel != null ? String(material.minimumStockLevel) : '',
    maximumStockLevel: material.maximumStockLevel != null ? String(material.maximumStockLevel) : '',
    isConsumable: Boolean(material.isConsumable),
    preferredSupplier: preferred,
    alternateSuppliers: alternates,
  };
}

function toNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed === '') return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}

function Field({ label, required, hint, children }: FieldProps) {
  return (
    <label className="block space-y-2">
      <span className="form-label">
        {label}
        {required && <span className="ml-1 text-[var(--error)]">*</span>}
      </span>
      {children}
      {hint && <span className="block text-xs text-[var(--muted-soft)]">{hint}</span>}
    </label>
  );
}

const inputClass = 'form-input w-full';
const selectClass = 'form-input w-full appearance-none';

/**
 * Create/edit material form. Validation mirrors backend/src/validations/
 * material.validation.js so clients get immediate, consistent feedback.
 */
export function MaterialForm({ initial, mode, submitting = false, onSubmit }: MaterialFormProps) {
  const [form, setForm] = useState<FormState>(() => (initial ? fromMaterial(initial) : emptyForm()));
  const [formError, setFormError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validationMessage = useMemo(() => {
    if (!form.name.trim()) return 'Material name is required.';
    if (form.name.trim().length < 2) return 'Material name must be at least 2 characters.';
    if (form.name.trim().length > 100) return 'Material name cannot exceed 100 characters.';
    if (!form.unit) return 'Unit is required.';

    const unitCost = toNumber(form.unitCost);
    if (unitCost != null && unitCost < 0) return 'Unit cost cannot be negative.';

    const min = toNumber(form.minimumStockLevel);
    const max = toNumber(form.maximumStockLevel);
    if (min != null && min < 0) return 'Minimum stock level cannot be negative.';
    if (max != null && max < 0) return 'Maximum stock level cannot be negative.';
    if (min != null && max != null && min > max) {
      return 'Minimum stock level cannot exceed maximum stock level.';
    }

    if (mode === 'create') {
      const stock = toNumber(form.currentStock);
      if (stock != null && stock < 0) return 'Initial stock cannot be negative.';
    }

    return null;
  }, [form, mode]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }
    setFormError(null);

    const payload: CreateMaterialDto & UpdateMaterialDto = {
      name: form.name.trim(),
      unit: form.unit as MaterialUnit,
      unitCost: toNumber(form.unitCost),
      minimumStockLevel: toNumber(form.minimumStockLevel),
      maximumStockLevel: toNumber(form.maximumStockLevel),
      isConsumable: form.isConsumable,
      preferredSupplier: form.preferredSupplier.trim() || undefined,
      alternateSuppliers: form.alternateSuppliers
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    if (mode === 'create') {
      payload.currentStock = toNumber(form.currentStock) ?? 0;
    }

    void onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formError && (
        <div
          role="alert"
          className="rounded-lg border border-[var(--error)] bg-[var(--error-tint)] p-4 text-sm text-[var(--error)]"
        >
          {formError}
        </div>
      )}

      {/* Core details */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Core details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Material name" required>
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. 550W Mono PERC Solar Panel"
                maxLength={100}
              />
            </Field>
          </div>
          <Field label="Unit" required>
            <select
              className={selectClass}
              value={form.unit}
              onChange={(e) => set('unit', e.target.value as MaterialUnit)}
            >
              <option value="" disabled>
                Select unit
              </option>
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Unit cost (₹)">
            <input
              className={inputClass}
              type="number"
              min={0}
              step="any"
              value={form.unitCost}
              onChange={(e) => set('unitCost', e.target.value)}
              placeholder="0"
            />
          </Field>
        </div>
      </section>

      {/* Stock levels */}
      <section className="space-y-4 border-t border-[var(--border-soft)] pt-6">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Stock levels</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {mode === 'create' && (
            <Field label="Initial stock" hint="Opening quantity on hand">
              <input
                className={inputClass}
                type="number"
                min={0}
                value={form.currentStock}
                onChange={(e) => set('currentStock', e.target.value)}
                placeholder="0"
              />
            </Field>
          )}
          <Field label="Minimum level" hint="Re-order point">
            <input
              className={inputClass}
              type="number"
              min={0}
              value={form.minimumStockLevel}
              onChange={(e) => set('minimumStockLevel', e.target.value)}
              placeholder="0"
            />
          </Field>
          <Field label="Maximum level" hint="Storage capacity">
            <input
              className={inputClass}
              type="number"
              min={0}
              value={form.maximumStockLevel}
              onChange={(e) => set('maximumStockLevel', e.target.value)}
              placeholder="0"
            />
          </Field>
          {mode === 'edit' && (
            <div className="flex items-end pb-1">
              <span className="text-xs text-[var(--muted-soft)]">
                Current stock is managed via stock adjustments.
              </span>
            </div>
          )}
        </div>
        <label className="inline-flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={form.isConsumable}
            onChange={(e) => set('isConsumable', e.target.checked)}
            className="h-4 w-4 rounded border-[var(--border)] accent-[var(--primary)]"
          />
          <span className="text-sm text-[var(--foreground)]">Consumable item (used up during installation)</span>
        </label>
      </section>

      {/* Suppliers */}
      <section className="space-y-4 border-t border-[var(--border-soft)] pt-6">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Suppliers</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Preferred supplier" hint="Supplier record ID">
            <input
              className={inputClass}
              value={form.preferredSupplier}
              onChange={(e) => set('preferredSupplier', e.target.value)}
              placeholder="24-char supplier ID (optional)"
            />
          </Field>
          <Field label="Alternate suppliers" hint="Comma-separated supplier IDs">
            <input
              className={inputClass}
              value={form.alternateSuppliers}
              onChange={(e) => set('alternateSuppliers', e.target.value)}
              placeholder="Optional"
            />
          </Field>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          className="neutral-button"
          onClick={() => setForm(initial ? fromMaterial(initial) : emptyForm())}
          disabled={submitting}
        >
          Reset
        </button>
        <button type="submit" className="brand-button" disabled={submitting}>
          {submitting ? (mode === 'create' ? 'Creating…' : 'Saving…') : mode === 'create' ? 'Create material' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}

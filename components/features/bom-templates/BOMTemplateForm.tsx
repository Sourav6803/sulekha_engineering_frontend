'use client';

import { useEffect, useMemo, useState } from 'react';
import type { BOMTemplateCreatePayload, BOMTemplateUpdatePayload } from '@/lib/api/bomTemplates.api';
import type { BOMTemplateDocument, FormulaType, QtyFormula, QtyFormulaStep, RoofType } from '@/types/bomTemplate';
import { materialsApi } from '@/lib/api/materials.api';
import type { MaterialDocument } from '@/types/material';

const ROOF_TYPES: { value: RoofType; label: string }[] = [
  { value: 'rcc_rooftop', label: 'RCC Rooftop' },
  { value: 'tin_shed', label: 'Tin Shed' },
  { value: 'ground_mount', label: 'Ground Mount' },
];

const FORMULA_TYPES: { value: FormulaType; label: string }[] = [
  { value: 'fixed', label: 'Fixed (flat quantity)' },
  { value: 'per_kw', label: 'Per kW (multiplied by system size)' },
  { value: 'linear', label: 'Linear (formula + min)' },
  { value: 'step', label: 'Step (kW range → quantity)' },
];

interface FormState {
  templateName: string;
  roofType: RoofType | '';
  systemSizeKW: string;
  section: string;
  sectionOrder: string;
  material: string;
  formulaType: FormulaType | '';
  formulaValue: string;
  formulaMinQty: string;
  formulaMaxQty: string;
  isOptional: boolean;
  defaultRemark: string;
  wastageFactor: string;
  priority: string;
  stepSizes: QtyFormulaStep[];
}

interface BOMTemplateFormProps {
  initial?: BOMTemplateDocument | null;
  mode: 'create' | 'edit';
  submitting?: boolean;
  onSubmit: (payload: BOMTemplateCreatePayload | BOMTemplateUpdatePayload) => Promise<void> | void;
}

const emptyForm = (): FormState => ({
  templateName: '',
  roofType: '',
  systemSizeKW: '',
  section: '',
  sectionOrder: '',
  material: '',
  formulaType: '',
  formulaValue: '',
  formulaMinQty: '',
  formulaMaxQty: '',
  isOptional: false,
  defaultRemark: '',
  wastageFactor: '',
  priority: '1',
  stepSizes: [],
});

function fromTemplate(tpl: BOMTemplateDocument): FormState {
  const materialId = typeof tpl.material === 'object' ? tpl.material._id : tpl.material;
  const formula = tpl.qtyFormula;
  return {
    templateName: tpl.templateName ?? '',
    roofType: tpl.roofType ?? '',
    systemSizeKW: tpl.systemSizeKW != null ? String(tpl.systemSizeKW) : '',
    section: tpl.section ?? '',
    sectionOrder: tpl.sectionOrder != null ? String(tpl.sectionOrder) : '',
    material: materialId ?? '',
    formulaType: formula?.type ?? '',
    formulaValue: formula?.value != null ? String(formula.value) : '',
    formulaMinQty: formula?.minQty != null ? String(formula.minQty) : '',
    formulaMaxQty: formula?.maxQty != null ? String(formula.maxQty) : '',
    isOptional: Boolean(tpl.isOptional),
    defaultRemark: tpl.defaultRemark ?? '',
    wastageFactor: tpl.wastageFactor != null ? String(tpl.wastageFactor) : '',
    priority: tpl.priority != null ? String(tpl.priority) : '1',
    stepSizes: Array.isArray(formula?.stepSizes) ? formula.stepSizes : [],
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
const selectClass = 'form-input w-full';

export function BOMTemplateForm({ initial, mode, submitting = false, onSubmit }: BOMTemplateFormProps) {
  const [form, setForm] = useState<FormState>(() => (initial ? fromTemplate(initial) : emptyForm()));
  const [materials, setMaterials] = useState<MaterialDocument[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (initial) {
      setForm(fromTemplate(initial));
    }
  }, [initial]);

  useEffect(() => {
    let active = true;
    materialsApi
      .list({ limit: 100, search: '' })
      .then((res) => {
        if (active) {
          const items = Array.isArray(res.data) ? res.data : [];
          setMaterials(items);
          setMaterialsLoading(false);
        }
      })
      .catch(() => {
        if (active) setMaterialsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validationMessage = useMemo(() => {
    if (!form.templateName.trim()) return 'Template name is required.';
    if (form.templateName.trim().length < 2) return 'Template name must be at least 2 characters.';
    if (!form.roofType) return 'Roof type is required.';
    const systemSize = toNumber(form.systemSizeKW);
    if (systemSize == null || systemSize < 0.1) return 'System size must be at least 0.1 kW.';
    if (!form.section.trim()) return 'Section is required.';
    if (!form.material) return 'Material is required.';
    if (!form.formulaType) return 'Formula type is required.';
    const formulaValue = toNumber(form.formulaValue);
    if (formulaValue == null) return 'Formula value is required.';
    if (formulaValue < 0) return 'Formula value cannot be negative.';
    const waste = toNumber(form.wastageFactor);
    if (waste != null && (waste < 0 || waste > 100)) return 'Wastage factor must be between 0 and 100.';
    const priority = toNumber(form.priority);
    if (priority == null || priority < 1) return 'Priority must be at least 1.';
    return null;
  }, [form]);

  const buildQtyFormula = (): QtyFormula => {
    return {
      type: form.formulaType as FormulaType,
      value: toNumber(form.formulaValue) ?? 0,
      minQty: toNumber(form.formulaMinQty),
      maxQty: toNumber(form.formulaMaxQty),
      stepSizes: form.formulaType === 'step' ? form.stepSizes : undefined,
    };
  };

  const buildPayload = (): BOMTemplateCreatePayload | BOMTemplateUpdatePayload => {
    const base = {
      templateName: form.templateName.trim(),
      roofType: form.roofType as RoofType,
      systemSizeKW: toNumber(form.systemSizeKW)!,
      section: form.section.trim(),
      material: form.material,
      qtyFormula: buildQtyFormula(),
    };

    if (mode === 'create') {
      return {
        ...base,
        sectionOrder: toNumber(form.sectionOrder) ?? 0,
        isOptional: form.isOptional,
        defaultRemark: form.defaultRemark.trim() || undefined,
        wastageFactor: toNumber(form.wastageFactor) ?? 0,
        priority: toNumber(form.priority) ?? 1,
        } as BOMTemplateCreatePayload;
    }

    return {
      ...base,
      sectionOrder: toNumber(form.sectionOrder),
      isOptional: form.isOptional,
      defaultRemark: form.defaultRemark.trim() || undefined,
      wastageFactor: toNumber(form.wastageFactor),
      priority: toNumber(form.priority),
    } as BOMTemplateUpdatePayload;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }
    setFormError(null);
    void onSubmit(buildPayload() as BOMTemplateCreatePayload & BOMTemplateUpdatePayload);
  };

  const addStepSize = () => {
    setForm((prev) => ({
      ...prev,
      stepSizes: [...prev.stepSizes, { fromKW: 0, toKW: 0, qty: 0 }],
    }));
  };

  const removeStepSize = (index: number) => {
    setForm((prev) => ({
      ...prev,
      stepSizes: prev.stepSizes.filter((_, i) => i !== index),
    }));
  };

  const updateStepSize = (index: number, field: keyof QtyFormulaStep, value: string) => {
    setForm((prev) => ({
      ...prev,
      stepSizes: prev.stepSizes.map((step, i) => (i === index ? { ...step, [field]: Number(value) } : step)),
    }));
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

      {/* Basic info */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Basic Information</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Template name" required>
              <input
                className={inputClass}
                value={form.templateName}
                onChange={(e) => set('templateName', e.target.value)}
                placeholder="e.g. RCC Rooftop 5kW - Structure"
                maxLength={100}
              />
            </Field>
          </div>

          <Field label="Roof type" required>
            <select className={selectClass} value={form.roofType} onChange={(e) => set('roofType', e.target.value as RoofType)}>
              <option value="" disabled>
                Select roof type
              </option>
              {ROOF_TYPES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="System size (kW)" required>
            <input
              className={inputClass}
              type="number"
              min={0.1}
              step="0.1"
              value={form.systemSizeKW}
              onChange={(e) => set('systemSizeKW', e.target.value)}
              placeholder="e.g. 5"
            />
          </Field>

          <Field label="Section" required>
            <input
              className={inputClass}
              value={form.section}
              onChange={(e) => set('section', e.target.value)}
              placeholder="e.g. Structure, Cables, SPV Modules"
            />
          </Field>

          <Field label="Section order" hint="Order within the section (optional)">
            <input
              className={inputClass}
              type="number"
              min={0}
              value={form.sectionOrder}
              onChange={(e) => set('sectionOrder', e.target.value)}
              placeholder="0"
            />
          </Field>

          <Field label="Material" required>
            <select
              className={selectClass}
              value={form.material}
              onChange={(e) => set('material', e.target.value)}
              disabled={materialsLoading}
            >
              <option value="" disabled>
                {materialsLoading ? 'Loading materials…' : 'Select material'}
              </option>
              {materials.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name} ({m.materialCode}) — {m.unit}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      {/* Quantity formula */}
      <section className="space-y-4 border-t border-[var(--border-soft)] pt-6">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Quantity Formula</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Formula type" required>
            <select
              className={selectClass}
              value={form.formulaType}
              onChange={(e) => set('formulaType', e.target.value as FormulaType)}
            >
              <option value="" disabled>
                Select type
              </option>
              {FORMULA_TYPES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Formula value" required hint="Base quantity / multiplier">
            <input
              className={inputClass}
              type="number"
              min={0}
              step="any"
              value={form.formulaValue}
              onChange={(e) => set('formulaValue', e.target.value)}
              placeholder={form.formulaType === 'per_kw' ? 'e.g. 16 (panels per kW)' : 'e.g. 50'}
            />
          </Field>

          {form.formulaType === 'linear' && (
            <Field label="Minimum quantity" hint="Added as a floor">
              <input
                className={inputClass}
                type="number"
                min={0}
                value={form.formulaMinQty}
                onChange={(e) => set('formulaMinQty', e.target.value)}
                placeholder="e.g. 2"
              />
            </Field>
          )}

          <Field label="Maximum quantity" hint="Ceiling (optional)">
            <input
              className={inputClass}
              type="number"
              min={0}
              value={form.formulaMaxQty}
              onChange={(e) => set('formulaMaxQty', e.target.value)}
              placeholder="Optional"
            />
          </Field>
        </div>

        {form.formulaType === 'step' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--foreground)]">Step sizes (kW ranges)</span>
              <button type="button" className="ghost-button text-xs" onClick={addStepSize}>
                Add range
              </button>
            </div>
            {form.stepSizes.length === 0 && (
              <p className="text-xs text-[var(--muted-soft)]">No ranges defined. Add at least one range for step formulas.</p>
            )}
            {form.stepSizes.map((step, index) => (
              <div key={index} className="grid grid-cols-4 gap-2 rounded-lg border border-[var(--border-soft)] p-3 sm:grid-cols-5">
                <Field label="From (kW)" required>
                  <input
                    className={inputClass}
                    type="number"
                    min={0}
                    step="0.1"
                    value={step.fromKW}
                    onChange={(e) => updateStepSize(index, 'fromKW', e.target.value)}
                  />
                </Field>
                <Field label="To (kW)" required>
                  <input
                    className={inputClass}
                    type="number"
                    min={0}
                    step="0.1"
                    value={step.toKW}
                    onChange={(e) => updateStepSize(index, 'toKW', e.target.value)}
                  />
                </Field>
                <Field label="Quantity" required>
                  <input
                    className={inputClass}
                    type="number"
                    min={0}
                    step="any"
                    value={step.qty}
                    onChange={(e) => updateStepSize(index, 'qty', e.target.value)}
                  />
                </Field>
                <div className="flex items-end">
                  <button type="button" className="ghost-button text-xs text-[var(--error)]" onClick={() => removeStepSize(index)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Additional settings */}
      <section className="space-y-4 border-t border-[var(--border-soft)] pt-6">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Additional Settings</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Priority" hint="Lower numbers appear first">
            <input
              className={inputClass}
              type="number"
              min={1}
              value={form.priority}
              onChange={(e) => set('priority', e.target.value)}
            />
          </Field>
          <Field label="Wastage factor (%)" hint="Extra quantity added for breakage">
            <input
              className={inputClass}
              type="number"
              min={0}
              max={100}
              value={form.wastageFactor}
              onChange={(e) => set('wastageFactor', e.target.value)}
              placeholder="0"
            />
          </Field>
        </div>

        <Field label="Default remark">
          <textarea
            className={inputClass}
            rows={2}
            value={form.defaultRemark}
            onChange={(e) => set('defaultRemark', e.target.value)}
            placeholder="e.g. Use M10 SS bolts for structure mounting"
          />
        </Field>

        <label className="inline-flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={form.isOptional}
            onChange={(e) => set('isOptional', e.target.checked)}
            className="h-4 w-4 rounded border-[var(--border)] accent-[var(--primary)]"
          />
          <span className="text-sm text-[var(--foreground)]">Optional item (can be omitted from BOM)</span>
        </label>
      </section>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          className="neutral-button"
          onClick={() => setForm(initial ? fromTemplate(initial) : emptyForm())}
          disabled={submitting}
        >
          Reset
        </button>
        <button type="submit" className="brand-button" disabled={submitting}>
          {submitting ? (mode === 'create' ? 'Creating…' : 'Saving…') : mode === 'create' ? 'Create template' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}

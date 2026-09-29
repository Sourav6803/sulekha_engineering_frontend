'use client';

import { Check } from 'lucide-react';
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';

/**
 * Small, phone-first form primitives shared by every wizard step.
 *
 * Deliberately opinionated: one label style, one input style, one error slot.
 * `error` is expected to be a real message from the API (or the same wording the
 * API would use), never "Invalid input".
 */

const errorInputClass = 'border-[var(--error)] focus:border-[var(--error)] focus:ring-[rgba(183,43,40,0.14)]';

function FieldShell({
  id,
  label,
  required,
  hint,
  hintBn,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  hintBn?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="form-label block text-[13px] leading-5">
        {label} {required && <span className="text-[var(--error)]">*</span>}
      </label>

      {(hint || hintBn) && (
        <p className="mt-1 text-[11px] leading-4 text-[var(--muted-soft)] [overflow-wrap:anywhere]">
          {hint}
          {hintBn ? <span className="ml-1 text-[var(--muted)]">• {hintBn}</span> : null}
        </p>
      )}

      <div className="mt-1.5">{children}</div>

      {error && (
        <p role="alert" className="mt-1 text-[11px] leading-4 text-[var(--error)] [overflow-wrap:anywhere]">
          {error}
        </p>
      )}
    </div>
  );
}

export interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'id' | 'className'> {
  id: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  hint?: string;
  hintBn?: string;
  error?: string;
  compact?: boolean;
  /**
   * Strip anything that is not a digit (or a single decimal point) as the agent
   * types. `type="number"` alone is not enough: a browser still lets letters
   * through when the field is scrolled or when the value is pasted, and on a
   * phone the numeric keypad needs `inputMode`.
   */
  numeric?: boolean;
  /** With `numeric`, also allow one decimal point — kW and rupee amounts. */
  allowDecimal?: boolean;
}

export function TextField({
  id,
  label,
  value,
  onValueChange,
  hint,
  hintBn,
  error,
  compact = false,
  numeric = false,
  allowDecimal = false,
  ...inputProps
}: TextFieldProps) {
  const sanitize = (raw: string) => {
    if (!numeric) return raw;

    let cleaned = raw.replace(allowDecimal ? /[^0-9.]/g : /[^0-9]/g, '');

    if (allowDecimal) {
      // Keep only the first separator, so "1.2.3" cannot be pasted in.
      const firstDot = cleaned.indexOf('.');
      if (firstDot !== -1) {
        cleaned = `${cleaned.slice(0, firstDot + 1)}${cleaned.slice(firstDot + 1).replace(/\./g, '')}`;
      }
    }

    return cleaned;
  };

  return (
    <FieldShell id={id} label={label} required={inputProps.required} hint={hint} hintBn={hintBn} error={error}>
      <input
        {...inputProps}
        id={id}
        value={value}
        inputMode={numeric ? (allowDecimal ? 'decimal' : 'numeric') : inputProps.inputMode}
        onChange={(event) => onValueChange(sanitize(event.target.value))}
        aria-invalid={Boolean(error)}
        className={`form-input ${compact ? 'py-2.5 text-sm' : ''} ${error ? errorInputClass : ''}`}
      />
    </FieldShell>
  );
}

export interface TextAreaFieldProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value' | 'id' | 'className'> {
  id: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  hint?: string;
  hintBn?: string;
  error?: string;
}

export function TextAreaField({
  id,
  label,
  value,
  onValueChange,
  hint,
  hintBn,
  error,
  ...textAreaProps
}: TextAreaFieldProps) {
  return (
    <FieldShell id={id} label={label} required={textAreaProps.required} hint={hint} hintBn={hintBn} error={error}>
      <textarea
        {...textAreaProps}
        id={id}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        aria-invalid={Boolean(error)}
        className={`form-input resize-y text-sm ${error ? errorInputClass : ''}`}
      />
    </FieldShell>
  );
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  /** Rendered as the empty value, e.g. "Choose a site type". */
  placeholder?: string;
  required?: boolean;
  hint?: string;
  hintBn?: string;
  error?: string;
  disabled?: boolean;
}

export function SelectField({
  id,
  label,
  value,
  onValueChange,
  options,
  placeholder = 'Not selected',
  required,
  hint,
  hintBn,
  error,
  disabled,
}: SelectFieldProps) {
  return (
    <FieldShell id={id} label={label} required={required} hint={hint} hintBn={hintBn} error={error}>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onValueChange(event.target.value)}
        aria-invalid={Boolean(error)}
        className={`form-input text-sm ${error ? errorInputClass : ''}`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

/**
 * A two-state question with explicit Yes / No buttons — the mandatory loan
 * question needs an unmissable, tappable answer rather than a tiny checkbox.
 */
export function ChoiceField({
  id,
  label,
  hint,
  hintBn,
  error,
  value,
  onChange,
  options,
  required,
}: {
  id: string;
  label: string;
  hint?: string;
  hintBn?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  required?: boolean;
}) {
  return (
    <FieldShell id={id} label={label} required={required} hint={hint} hintBn={hintBn} error={error}>
      <div id={id} role="group" className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.value)}
              className={
                active
                  ? 'inline-flex items-center gap-1.5 rounded-[var(--radius-full)] border border-[var(--primary)] bg-[var(--primary-tint)] px-4 py-2.5 text-sm font-semibold text-[var(--primary-active)]'
                  : 'inline-flex items-center gap-1.5 rounded-[var(--radius-full)] border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-medium text-[var(--muted)] transition-colors hover:border-[var(--secondary)] hover:text-[var(--foreground)]'
              }
            >
              {active && <Check className="h-3.5 w-3.5" />}
              {option.label}
            </button>
          );
        })}
      </div>
    </FieldShell>
  );
}

/** A single checkbox with a wrapping label — used for the confirmations. */
export function CheckboxField({
  id,
  label,
  checked,
  onChange,
  hint,
  tone = 'default',
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
  tone?: 'default' | 'primary';
}) {
  return (
    <div
      className={
        tone === 'primary'
          ? 'rounded-[1rem] border border-[var(--primary)] bg-[var(--primary-tint)] p-3'
          : 'rounded-[1rem] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-3'
      }
    >
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)]"
        />
        <span className="min-w-0 text-[13px] font-medium leading-5 text-[var(--foreground)] [overflow-wrap:anywhere]">
          {label}
        </span>
      </label>
      {hint && <p className="mt-1 pl-7 text-[11px] leading-4 text-[var(--muted)]">{hint}</p>}
    </div>
  );
}

/** A section heading inside a step. */
export function StepSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="panel p-4 sm:p-5">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-[var(--foreground)]">{title}</h2>
        {description && <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{description}</p>}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default TextField;

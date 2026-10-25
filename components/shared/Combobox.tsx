'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

interface ComboboxProps {
  id: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  /** Shown inside the panel when there is nothing to pick. */
  emptyText?: string;
}

/**
 * A select with a search box.
 *
 * The site step needs this because a district has up to 29 blocks and a block up
 * to a few hundred villages — scrolling a native select that long is slower than
 * typing three letters. No dependency: the panel is a plain list filtered by the
 * query, with arrow keys, Enter and Escape handled here.
 */
export function Combobox({
  id,
  label,
  value,
  onValueChange,
  options,
  placeholder = 'Choose',
  hint,
  error,
  required,
  disabled,
  emptyText = 'Nothing to choose from yet',
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((option) => option.toLowerCase().includes(needle));
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const onClickAway = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickAway);
    // The search box takes focus the moment the panel opens, so typing filters
    // immediately instead of needing a second click.
    searchRef.current?.focus();
    return () => document.removeEventListener('mousedown', onClickAway);
  }, [open]);

  const choose = (option: string) => {
    onValueChange(option);
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
        {label}
        {required && <span className="ml-0.5 text-[var(--danger)]">*</span>}
      </label>

      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`form-input mt-1 flex w-full items-center justify-between gap-2 text-left ${
          error ? 'border-[var(--danger)]' : ''
        } ${disabled ? 'opacity-60' : ''}`}
      >
        <span className={value ? 'truncate text-[var(--foreground)]' : 'truncate text-[var(--muted-soft)]'}>
          {value || placeholder}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-[var(--muted)]" />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-[0.9rem] border border-[var(--border-soft)] bg-[var(--surface)] shadow-[var(--shadow-lg)]">
          <div className="flex items-center gap-2 border-b border-[var(--border-soft)] px-3 py-2">
            <Search className="h-3.5 w-3.5 text-[var(--muted)]" />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  setActive((current) => Math.min(current + 1, filtered.length - 1));
                } else if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  setActive((current) => Math.max(current - 1, 0));
                } else if (event.key === 'Enter') {
                  event.preventDefault();
                  if (filtered[active]) choose(filtered[active]);
                } else if (event.key === 'Escape') {
                  setOpen(false);
                }
              }}
              placeholder="Search…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--muted-soft)]"
            />
          </div>

          <ul role="listbox" className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-xs text-[var(--muted)]">{emptyText}</li>
            )}
            {filtered.map((option, index) => (
              <li key={option}>
                <button
                  type="button"
                  role="option"
                  aria-selected={option === value}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(option)}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm ${
                    index === active ? 'bg-[var(--surface-muted)]' : ''
                  }`}
                >
                  <span className="truncate">{option}</span>
                  {option === value && <Check className="h-3.5 w-3.5 shrink-0 text-[var(--primary)]" />}
                </button>
              </li>
            ))}
          </ul>

          {filtered.length > 0 && (
            <p className="border-t border-[var(--border-soft)] px-3 py-1.5 text-[10px] text-[var(--muted-soft)]">
              {filtered.length} of {options.length}
            </p>
          )}
        </div>
      )}

      {error ? (
        <p className="mt-1 text-xs text-[var(--danger)]">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-[11px] text-[var(--muted)]">{hint}</p>
      ) : null}
    </div>
  );
}

export default Combobox;

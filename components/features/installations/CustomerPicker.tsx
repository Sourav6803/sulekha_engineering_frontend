'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Loader2, Search, Users } from 'lucide-react';
import { customersApi } from '@/lib/api/customers.api';
import type { Customer } from '@/types/customer';

export interface CustomerPickResult {
  customer: Customer | null;
  /** True once we've confirmed this customer already has an active installation. */
  hasInstallation: boolean;
  /** True while we're checking existing installations after a selection. */
  checking: boolean;
}

interface CustomerPickerProps {
  onChange: (result: CustomerPickResult) => void;
  /** Optional preselected customer (e.g. arriving from a customer's page). */
  value?: Customer | null;
  disabled?: boolean;
}

/** Debounced searchable dropdown over the CRM, enforcing the one-installation rule. */
export function CustomerPicker({ onChange, value, disabled = false }: CustomerPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);

  // Close the dropdown on outside click.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    if (!value) return;
    let active = true;
    customersApi
      .getInstallations(value._id, { page: 1, limit: 1 })
      .then((res) => {
        if (!active) return;
        const total = res.pagination?.total ?? 0;
        onChange({ customer: value, hasInstallation: total > 0, checking: false });
      })
      .catch(() => {
        if (!active) return;
        onChange({ customer: value, hasInstallation: false, checking: false });
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?._id]);

  const runSearch = (term: string) => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (term.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const res = await customersApi.search(term.trim(), 10);
        setResults(Array.isArray(res.data) ? res.data : []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const handleSelect = (customer: Customer) => {
    setQuery('');
    setResults([]);
    setOpen(false);
    setChecking(true);
    onChange({ customer, hasInstallation: false, checking: true });

    customersApi
      .getInstallations(customer._id, { page: 1, limit: 1 })
      .then((res) => {
        const total = res.pagination?.total ?? 0;
        setChecking(false);
        onChange({ customer, hasInstallation: total > 0, checking: false });
      })
      .catch(() => {
        setChecking(false);
        onChange({ customer, hasInstallation: false, checking: false });
      });
  };

  return (
    <div ref={containerRef} className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-soft)]" />
        <input
          className="form-input w-full !pl-11"
          placeholder={value ? value.name : 'Search customers by name or phone…'}
          value={query}
          disabled={disabled}
          onFocus={() => {
            setOpen(true);
            if (results.length === 0) runSearch(query);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            runSearch(e.target.value);
            // Clearing the box clears the selection.
            if (value) onChange({ customer: null, hasInstallation: false, checking: false });
          }}
          aria-label="Search customers"
        />
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-soft)]" />
        {searching && (
          <Loader2 className="pointer-events-none absolute right-10 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[var(--primary)]" />
        )}
      </div>

      {open && (
        <div className="z-20 overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-[var(--shadow-lg)]">
          {results.length === 0 ? (
            <div className="px-4 py-4 text-sm text-[var(--muted)]">
              {searching ? 'Searching…' : 'No matching customers. Type at least 2 characters.'}
            </div>
          ) : (
            <ul role="listbox" className="max-h-72 overflow-y-auto">
              {results.map((customer) => (
                <li key={customer._id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={value?._id === customer._id}
                    onClick={() => handleSelect(customer)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--primary-tint)]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--secondary)]">
                      <Users className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-[var(--foreground)]">{customer.name}</span>
                      <span className="block truncate font-mono text-xs text-[var(--muted-soft)]">
                        {customer.customerId} • {customer.phone}
                      </span>
                    </span>
                    {value?._id === customer._id && <Check className="h-4 w-4 text-[var(--primary)]" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {checking && value && (
        <p className="flex items-center gap-2 text-xs text-[var(--muted)]">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Checking for an existing installation…
        </p>
      )}
    </div>
  );
}
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, FileText, Loader2, Search } from 'lucide-react';
import {
  installationsApi,
  type InstallableApplication,
} from '@/lib/api/installations.api';

interface ApplicationPickerProps {
  value: InstallableApplication | null;
  onChange: (application: InstallableApplication | null) => void;
  disabled?: boolean;
}

/**
 * Pick the application this installation belongs to.
 *
 * Not a customer search any more. The list comes from the server and holds only
 * applications whose customer has no installation yet — the one case where an
 * installation can still be created — so the "this customer already has one"
 * dead end is never offered in the first place.
 *
 * The row carries the quotation number, the system size and the roof type with it;
 * the form shows them read-only, which is what keeps the installation and the
 * paperwork from drifting apart.
 */
export function ApplicationPicker({ value, onChange, disabled = false }: ApplicationPickerProps) {
  const [applications, setApplications] = useState<InstallableApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    installationsApi
      .installableApplications()
      .then((response) => {
        if (!active) return;
        setApplications(Array.isArray(response.data) ? response.data : []);
      })
      .catch(() => {
        if (!active) return;
        setError('Could not load the applications waiting for installation.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Close on an outside click — the list is long and covers the rest of the form.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return applications;

    return applications.filter((application) =>
      [application.consumerName, application.phone, application.applicationNo, application.customerId]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term))
    );
  }, [applications, query]);

  const handleSelect = (application: InstallableApplication) => {
    setOpen(false);
    setQuery('');
    onChange(application);
  };

  return (
    <div ref={containerRef} className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-soft)]" />
        <input
          className="form-input w-full !pl-11"
          placeholder={
            value
              ? `${value.applicationNo} • ${value.consumerName}`
              : 'Search by application no, name or phone…'
          }
          value={query}
          disabled={disabled || loading}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          aria-label="Search applications"
        />
        {loading ? (
          <Loader2 className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[var(--primary)]" />
        ) : (
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-soft)]" />
        )}
      </div>

      {error && (
        <p role="alert" className="text-xs text-[var(--error)]">
          {error}
        </p>
      )}

      {!loading && applications.length === 0 && !error && (
        <p className="rounded-lg bg-[var(--surface-muted)] px-3 py-2 text-xs leading-5 text-[var(--muted)]">
          No application is waiting for an installation. An application has to exist first, and a customer whose
          installation is already created will not appear here.
        </p>
      )}

      {open && filtered.length > 0 && (
        <div className="z-20 overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-[var(--shadow-lg)]">
          <ul role="listbox" className="max-h-72 overflow-y-auto">
            {filtered.map((application) => (
              <li key={application._id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={value?._id === application._id}
                  onClick={() => handleSelect(application)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--primary-tint)]"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--secondary)]">
                    <FileText className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-[var(--foreground)]">
                      {application.consumerName}
                    </span>
                    <span className="block truncate font-mono text-xs text-[var(--muted-soft)]">
                      {application.applicationNo}
                      {application.quotationNo ? ` • ${application.quotationNo}` : ''}
                    </span>
                    <span className="block truncate text-xs text-[var(--muted)]">
                      {application.systemSizeKW != null ? `${application.systemSizeKW} kW` : 'size not set'}
                      {application.roofType ? ` • ${application.roofType.replace(/_/g, ' ')}` : ''}
                      {application.phone ? ` • ${application.phone}` : ''}
                    </span>
                  </span>
                  {value?._id === application._id && <Check className="mt-1 h-4 w-4 text-[var(--primary)]" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {open && !loading && filtered.length === 0 && applications.length > 0 && (
        <p className="rounded-lg bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--muted)]">
          No application matches “{query}”.
        </p>
      )}
    </div>
  );
}

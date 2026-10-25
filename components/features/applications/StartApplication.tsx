'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, FileWarning, Loader2, Search, ShieldCheck, UserRound } from 'lucide-react';
import { customersApi } from '@/lib/api/customers.api';
import { useApplications } from '@/hooks/useApplications';
import { handleApiError } from '@/lib/errors/handleApiError';
import type { Customer } from '@/types/customer';

/**
 * Filing an application starts by choosing a customer.
 *
 * The applicant's name, Aadhaar, phone and address already exist on the customer
 * record — collected by the agent on the visit, or added by the office — and the
 * application copy is taken from there. This screen exists so that step is a
 * choice rather than a blank form: without it the same household gets typed in
 * twice and the two records never meet.
 *
 * Verified customers only: a customer still `pending_verification` has documents
 * nobody has looked at yet, and the API refuses to file from one. The card says
 * so and links to the record instead of letting the operator discover it as an
 * error on submit.
 */

type Props = {
  /** Deep link from a customer page: /applications/new?customerId=… */
  initialCustomerId?: string;
};

const statusTone: Record<string, string> = {
  active: 'bg-[var(--success-tint)] text-[var(--success)]',
  pending_verification: 'bg-[var(--warning-tint)] text-[var(--warning)]',
  blocked: 'bg-[var(--error-tint)] text-[var(--error)]',
  inactive: 'bg-[var(--surface-muted)] text-[var(--muted)]',
};

const statusLabel: Record<string, string> = {
  active: 'Verified',
  pending_verification: 'Not verified',
  blocked: 'Blocked',
  inactive: 'Inactive',
};

export function StartApplication({ initialCustomerId }: Props) {
  const router = useRouter();
  const { createApplication } = useApplications();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<{ id?: string; no?: string } | null>(null);

  /** Guards against an older keystroke's response overwriting a newer one. */
  const requestId = useRef(0);

  const load = useCallback(async (term: string) => {
    const ticket = ++requestId.current;
    setLoading(true);
    try {
      const response = await customersApi.list({
        search: term.trim() || undefined,
        limit: 8,
        sortBy: 'name',
        sortOrder: 'asc',
      });
      if (ticket !== requestId.current) return;
      setResults(response.data ?? []);
    } catch (err) {
      if (ticket === requestId.current) setError(handleApiError(err));
    } finally {
      if (ticket === requestId.current) setLoading(false);
    }
  }, []);

  // Debounced search — typing a name should not fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => void load(query), query ? 300 : 0);
    return () => clearTimeout(timer);
  }, [query, load]);

  // Opened from a customer page: fetch that record and drop straight onto it.
  useEffect(() => {
    if (!initialCustomerId) return;
    let active = true;
    void (async () => {
      try {
        const response = await customersApi.get(initialCustomerId);
        if (active && response.data) setSelected(response.data);
      } catch {
        /* Already reported by the list; a deep link to a stale id is not fatal. */
      }
    })();
    return () => {
      active = false;
    };
  }, [initialCustomerId]);

  /* The gate is the office's verification, not the lifecycle status: a customer
     saved by an agent stays pending until somebody clears the papers. Records
     that predate the verification block fall back to `status: active`. */
  const canFile = useMemo(() => {
    if (!selected || selected.status === 'blocked') return false;
    if (selected.verification?.status) return selected.verification.status === 'verified';
    return selected.status === 'active';
  }, [selected]);

  const handleCreate = async () => {
    if (!selected || !canFile) return;
    setCreating(true);
    setError(null);
    setDuplicate(null);
    try {
      const response = await createApplication({ customer: selected._id });
      const created = response.data;
      // The wizard resumes from ?id=, so hand over to it rather than keeping a
      // half-built draft in component state.
      router.replace(`/applications/new?id=${created._id}`);
    } catch (err) {
      const details = (err as { response?: { data?: { details?: { applicationId?: string; applicationNo?: string } } } })
        ?.response?.data?.details;
      if (details?.applicationId) {
        setDuplicate({ id: details.applicationId, no: details.applicationNo });
      } else {
        setError(handleApiError(err));
      }
      setCreating(false);
    }
  };

  return (
    <div className="panel p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--primary-active)]">
            Step 1 of 6
          </p>
          <h2 className="mt-1 text-lg font-semibold text-[var(--foreground)]">Which customer is this for?</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Applications are filed from a customer record, so the name, Aadhaar and address carry over as they were
            collected. Search below, or open the customer and use <span className="font-medium">File application</span>{' '}
            there.
          </p>
        </div>
        <Link href="/customers" className="neutral-button inline-flex items-center gap-1.5 px-3 py-2 text-sm">
          <UserRound className="h-4 w-4" /> All customers
        </Link>
      </div>

      <div className="mt-6">
        <label htmlFor="customer-search" className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          Find a customer
        </label>
        <div className="relative mt-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-soft)]" />
          <input
            id="customer-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, phone or customer ID"
            className="w-full rounded-xl border border-[var(--border)] bg-white py-2.5 pl-9 pr-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
          />
        </div>
      </div>

      {error && (
        <div role="alert" className="mt-4 rounded-xl border border-[var(--error)] bg-[var(--error-tint)] px-4 py-3 text-sm text-[var(--error)]">
          {error}
        </div>
      )}

      {duplicate?.id && (
        <div role="alert" className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--warning)] bg-[var(--warning-tint)] px-4 py-3 text-sm text-[var(--warning)]">
          <FileWarning className="h-4 w-4" />
          <span>
            This customer already has an application{duplicate.no ? ` (${duplicate.no})` : ''}. Open it instead of
            starting another.
          </span>
          <Link href={`/applications/new?id=${duplicate.id}`} className="font-semibold underline">
            Open application
          </Link>
        </div>
      )}

      <div className="mt-6">
        {loading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-[var(--muted)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Looking up customers…
          </div>
        ) : results.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted)]">
            No customer matches “{query}”.{' '}
            <Link href="/customers" className="font-semibold text-[var(--primary-active)] underline">
              Add them first
            </Link>
            .
          </div>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {results.map((customer) => {
              const isSelected = selected?._id === customer._id;
              const blocked = customer.status === 'pending_verification' || customer.status === 'blocked';
              return (
                <li key={customer._id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(customer);
                      setDuplicate(null);
                      setError(null);
                    }}
                    aria-pressed={isSelected}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                      isSelected
                        ? 'border-[var(--primary)] bg-[var(--primary-tint)]'
                        : 'border-[var(--border)] bg-white hover:border-[var(--primary-soft)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold text-[var(--foreground)]">{customer.name}</span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          statusTone[customer.status ?? 'active'] ?? statusTone.active
                        }`}
                      >
                        {statusLabel[customer.status ?? 'active'] ?? customer.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {customer.customerId} · {customer.phone}
                      {customer.district ? ` · ${customer.district}` : ''}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {selected && (
        <div className="mt-6 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-muted)] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">{selected.name}</p>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                {selected.customerId} · {selected.phone}
                {selected.aadhaarNumber ? ` · Aadhaar …${selected.aadhaarNumber.slice(-4)}` : ' · Aadhaar not on file'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={!canFile || creating}
              className="brand-button inline-flex items-center gap-2 px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {creating ? 'Creating draft…' : 'Create draft application'}
              {!creating && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>

          {!canFile && (
            <p className="mt-3 text-xs leading-5 text-[var(--warning)]">
              This customer is still <span className="font-semibold">pending verification</span>. Open the customer,
              check the Aadhaar, bill and bank papers, mark them verified — then file the application.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

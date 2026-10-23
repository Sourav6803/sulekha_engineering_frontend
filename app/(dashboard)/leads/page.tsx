'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Inbox, MessageSquarePlus, Phone, RotateCcw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/shared/PageContainer';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { Modal } from '@/components/shared/Modal';
import { Pagination } from '@/components/shared/Pagination';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import * as leadApi from '@/lib/api/leads.api';
import { handleApiError } from '@/lib/errors/handleApiError';
import type { PaginationInfo } from '@/types/api';
import type { AdminLead, LeadStatus } from '@/types/site';

const STATUSES: { value: LeadStatus; label: string; className: string }[] = [
  { value: 'new', label: 'New', className: 'bg-[var(--primary-tint)] text-[var(--primary-active)]' },
  { value: 'contacted', label: 'Contacted', className: 'bg-[var(--warning-tint)] text-[var(--warning)]' },
  { value: 'qualified', label: 'Qualified', className: 'bg-[var(--surface-strong)] text-[var(--foreground)]' },
  { value: 'converted', label: 'Converted', className: 'bg-[var(--success-tint)] text-[var(--success)]' },
  { value: 'closed', label: 'Closed', className: 'bg-[var(--surface-muted)] text-[var(--muted)]' },
];

const statusMeta = (status: string) => STATUSES.find((row) => row.value === status) ?? STATUSES[0];

const EMPTY_PAGINATION: PaginationInfo = { page: 1, limit: 20, total: 0, pages: 0 };

const formatWhen = (value: string) =>
  new Date(value).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function LeadsPage() {
  const [items, setItems] = useState<AdminLead[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>(EMPTY_PAGINATION);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [stats, setStats] = useState<Awaited<ReturnType<typeof leadApi.getStats>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<LeadStatus | ''>('');
  const [source, setSource] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [selected, setSelected] = useState<AdminLead | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [note, setNote] = useState('');
  const [noteBusy, setNoteBusy] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, overview] = await Promise.all([
        leadApi.listAdmin({
          page,
          limit: 20,
          status: status || undefined,
          source: source || undefined,
          search: search || undefined,
        }),
        leadApi.getStats(),
      ]);
      setItems(list.items);
      setPagination(list.pagination);
      setCounts(list.counts);
      setStats(overview);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page, status, source, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const openLead = async (id: string) => {
    setDetailLoading(true);
    setNote('');
    try {
      setSelected(await leadApi.getAdmin(id));
    } catch (err) {
      toast.error('Could not open the enquiry', { description: handleApiError(err) });
    } finally {
      setDetailLoading(false);
    }
  };

  const changeStatus = async (lead: AdminLead, next: LeadStatus) => {
    setStatusBusy(true);
    try {
      const updated = await leadApi.updateStatus(lead.id, next);
      setSelected((current) => (current && current.id === updated.id ? updated : current));
      setItems((current) => current.map((row) => (row.id === updated.id ? updated : row)));
      toast.success(`Marked ${statusMeta(next).label.toLowerCase()}`);
      void load();
    } catch (err) {
      toast.error('Could not change the status', { description: handleApiError(err) });
    } finally {
      setStatusBusy(false);
    }
  };

  const addNote = async () => {
    if (!selected || !note.trim()) return;
    setNoteBusy(true);
    try {
      const updated = await leadApi.addNote(selected.id, note.trim());
      setSelected(updated);
      setNote('');
      toast.success('Note added');
    } catch (err) {
      toast.error('Could not add the note', { description: handleApiError(err) });
    } finally {
      setNoteBusy(false);
    }
  };

  const sources = useMemo(
    () => Object.entries(stats?.bySource ?? {}).sort((a, b) => b[1] - a[1]),
    [stats]
  );

  const columns: Array<DataTableColumn<AdminLead>> = [
    {
      key: 'name',
      header: 'Enquiry',
      render: (lead) => (
        <button type="button" className="text-left" onClick={() => void openLead(lead.id)}>
          <span className="block font-semibold text-[var(--foreground)] hover:text-[var(--primary)]">{lead.name}</span>
          <span className="mt-0.5 block text-xs text-[var(--muted-soft)]">{formatWhen(lead.createdAt)}</span>
        </button>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (lead) => (
        <a href={`tel:+91${lead.phone}`} className="inline-flex items-center gap-1.5 font-medium text-[var(--foreground)] hover:text-[var(--primary)]">
          <Phone className="h-3.5 w-3.5 text-[var(--muted-soft)]" />
          {lead.phone}
        </a>
      ),
    },
    { key: 'district', header: 'District', hideOnMobile: true, render: (lead) => lead.district ?? '—' },
    {
      key: 'systemSizeKW',
      header: 'Size',
      hideOnMobile: true,
      className: 'text-right',
      render: (lead) => (lead.systemSizeKW ? `${lead.systemSizeKW} kW` : '—'),
    },
    { key: 'source', header: 'Source', hideOnMobile: true, render: (lead) => <span className="capitalize">{lead.source.replace('_', ' ')}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (lead) => {
        const meta = statusMeta(lead.status);
        return (
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${meta.className}`}>
            {meta.label}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (lead) => (
        <button type="button" className="ghost-button !px-3 !py-1.5 text-xs" onClick={() => void openLead(lead.id)}>
          Open
        </button>
      ),
    },
  ];

  return (
    <PageContainer
      header={
        <div className="space-y-4">
          <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Website' }, { label: 'Enquiries' }]} />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">Website</p>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--foreground)]">Website enquiries</h1>
            <p className="mt-2 max-w-2xl text-base text-[var(--muted)]">
              Every submission from the site and from printed banner QR codes, with the campaign it arrived through.
            </p>
          </div>
        </div>
      }
    >
      {error && (
        <div role="alert" className="rounded-lg border border-[var(--error)] bg-[var(--error-tint)] p-4 text-sm text-[var(--error)]">
          {error}
        </div>
      )}

      {/* Totals */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Today', value: stats?.today ?? 0 },
          { label: 'Last 7 days', value: stats?.week ?? 0 },
          { label: 'New, not contacted', value: counts.new ?? stats?.byStatus.new ?? 0 },
          { label: 'Converted', value: stats?.byStatus.converted ?? 0 },
        ].map((card) => (
          <div key={card.label} className="surface-card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-soft)]">{card.label}</p>
            <p className="mt-2 font-display text-3xl font-semibold text-[var(--foreground)]">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <section className="surface-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-soft)]" />
            <input
              className="form-input !pl-11"
              placeholder="Search by name or phone…"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              aria-label="Search enquiries"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex">
            <select
              className="form-input"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as LeadStatus | '');
                setPage(1);
              }}
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              {STATUSES.map((row) => (
                <option key={row.value} value={row.value}>
                  {row.label} ({stats?.byStatus[row.value] ?? 0})
                </option>
              ))}
            </select>

            <select
              className="form-input"
              value={source}
              onChange={(event) => {
                setSource(event.target.value);
                setPage(1);
              }}
              aria-label="Filter by source"
            >
              <option value="">All sources</option>
              {sources.map(([name, count]) => (
                <option key={name} value={name}>
                  {name.replace('_', ' ')} ({count})
                </option>
              ))}
            </select>
          </div>

          {(status || source || search) && (
            <button
              type="button"
              className="ghost-button shrink-0 !justify-center"
              onClick={() => {
                setStatus('');
                setSource('');
                setSearchInput('');
                setPage(1);
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>
      </section>

      <section className="surface-card overflow-hidden p-2 sm:p-4">
        <DataTable
          columns={columns}
          data={items}
          keyField="id"
          loading={loading}
          emptyState={{
            icon: Inbox,
            title: 'No enquiries yet',
            description: 'Submissions from the site and from banner QR codes land here.',
          }}
        />
        <div className="px-4">
          <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      </section>

      {/* Detail */}
      <Modal
        open={Boolean(selected) || detailLoading}
        onClose={() => setSelected(null)}
        title={selected?.name ?? 'Loading enquiry'}
        eyebrow={selected ? `Received ${formatWhen(selected.createdAt)}` : undefined}
        size="lg"
      >
        {detailLoading || !selected ? (
          <div className="skeleton h-40 w-full" />
        ) : (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-[var(--surface-muted)] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-soft)]">Phone</p>
                <a href={`tel:+91${selected.phone}`} className="mt-1 block font-semibold text-[var(--foreground)]">
                  {selected.phone}
                </a>
              </div>
              <div className="rounded-xl bg-[var(--surface-muted)] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-soft)]">Email</p>
                <p className="mt-1 break-all font-medium text-[var(--foreground)]">{selected.email ?? '—'}</p>
              </div>
              <div className="rounded-xl bg-[var(--surface-muted)] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-soft)]">District</p>
                <p className="mt-1 font-medium text-[var(--foreground)]">{selected.district ?? '—'}</p>
              </div>
              <div className="rounded-xl bg-[var(--surface-muted)] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-soft)]">System interest</p>
                <p className="mt-1 font-medium text-[var(--foreground)]">
                  {selected.systemSizeKW ? `${selected.systemSizeKW} kW` : 'Not stated'}
                </p>
              </div>
            </div>

            {selected.message && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-soft)]">Message</p>
                <p className="mt-1 rounded-xl border border-[var(--border-soft)] bg-white p-3 text-sm leading-7 text-[var(--muted)]">
                  {selected.message}
                </p>
              </div>
            )}

            <div className="grid gap-2 text-xs text-[var(--muted)] sm:grid-cols-2">
              <p>
                <span className="font-semibold text-[var(--foreground)]">Source:</span>{' '}
                {selected.source.replace('_', ' ')}
              </p>
              <p>
                <span className="font-semibold text-[var(--foreground)]">Page:</span> {selected.pagePath ?? '—'}
              </p>
              {Object.entries(selected.utm).length > 0 && (
                <p className="sm:col-span-2">
                  <span className="font-semibold text-[var(--foreground)]">Campaign:</span>{' '}
                  {Object.entries(selected.utm)
                    .map(([key, value]) => `${key}=${value}`)
                    .join(' · ')}
                </p>
              )}
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-soft)]">Status</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {STATUSES.map((row) => (
                  <button
                    key={row.value}
                    type="button"
                    disabled={statusBusy || selected.status === row.value}
                    onClick={() => void changeStatus(selected, row.value)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] transition-opacity ${
                      selected.status === row.value
                        ? row.className
                        : 'bg-[var(--surface-muted)] text-[var(--muted)] hover:opacity-80'
                    } disabled:cursor-default`}
                  >
                    {row.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-soft)]">
                Notes ({selected.notes.length})
              </p>
              <ul className="mt-2 space-y-2">
                {selected.notes.length === 0 && <li className="text-sm text-[var(--muted)]">No notes yet.</li>}
                {selected.notes.map((entry, index) => (
                  <li key={`${entry.at}-${index}`} className="rounded-xl border border-[var(--border-soft)] bg-white p-3">
                    <p className="text-sm leading-6 text-[var(--foreground)]">{entry.text}</p>
                    <p className="mt-1 text-xs text-[var(--muted-soft)]">
                      {entry.byName ? `${entry.byName} · ` : ''}
                      {formatWhen(entry.at)}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  className="form-input"
                  placeholder="Called, asked for a survey on Saturday…"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') void addNote();
                  }}
                  aria-label="Add a note"
                />
                <button type="button" className="brand-button shrink-0 justify-center" onClick={() => void addNote()} disabled={noteBusy || !note.trim()}>
                  <MessageSquarePlus className="h-4 w-4" />
                  {noteBusy ? 'Saving…' : 'Add note'}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}

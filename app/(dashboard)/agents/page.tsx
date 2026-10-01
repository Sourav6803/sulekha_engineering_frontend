'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, BookOpen, Copy, MailCheck, Plus, RotateCcw, Search, ShieldAlert, X } from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/shared/PageContainer';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { Modal } from '@/components/shared/Modal';
import { Pagination } from '@/components/shared/Pagination';
import { GuideSheet } from '@/components/features/applications/GuideSheet';
import { AgentTable } from '@/components/features/agents/AgentTable';
import { AGENT_STATUS } from '@/components/features/agents/agentStatus';
import { useAgents } from '@/hooks/useAgents';
import { useAuth } from '@/hooks/useAuth';
import { handleApiError } from '@/lib/errors/handleApiError';
import { canManageAgents } from '@/lib/permissions';
import { AGENT_DEPARTMENTS, AGENT_STATUSES } from '@/types/agent';
import type { SortOrder } from '@/components/shared/DataTable';
import type {
  AgentCreatePayload,
  AgentEmailStatus,
  AgentListItem,
  AgentListQuery,
  AgentStatus,
} from '@/types/agent';

/** Credentials the admin has to pass on by hand (email could not be sent). */
type HandoverCredentials = {
  name: string;
  email: string;
  password: string;
  /** "created" for a new account, "reset" after a password reset. */
  mode: 'created' | 'reset';
};

const emptyForm: AgentCreatePayload = {
  name: '',
  email: '',
  phone: '',
  employeeId: '',
  department: 'sales',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AgentsPage() {
  const { user } = useAuth();
  const allowed = canManageAgents(user?.role);

  const {
    agents,
    pagination,
    loading,
    fetchAgents,
    fetchEmailStatus,
    testEmailConnection,
    createAgent,
    updateAgent,
    activateAgent,
    resetAgentPassword,
    deleteAgent,
  } = useAgents();

  const [query, setQuery] = useState<AgentListQuery>({ page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' });
  const [searchInput, setSearchInput] = useState('');
  const [emailStatus, setEmailStatus] = useState<AgentEmailStatus | null>(null);
  const [testingEmail, setTestingEmail] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  // ---- Loading ----
  useEffect(() => {
    if (!allowed) return;
    void fetchAgents(query).catch(() => undefined);
  }, [allowed, query, fetchAgents]);

  useEffect(() => {
    if (!allowed) return;
    void fetchEmailStatus().then((status) => {
      if (status) setEmailStatus(status);
    });
  }, [allowed, fetchEmailStatus]);

  // Debounced search → query.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery((prev) => ({ ...prev, search: searchInput.trim() || undefined, page: 1 }));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const reload = useCallback(() => fetchAgents(query).catch(() => undefined), [fetchAgents, query]);

  // ---- Create ----
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<AgentCreatePayload>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [credentials, setCredentials] = useState<HandoverCredentials | null>(null);

  const openCreate = () => {
    setForm(emptyForm);
    setFormError(null);
    setCreateOpen(true);
  };

  const closeCreate = () => {
    if (formBusy) return;
    setCreateOpen(false);
    setFormError(null);
  };

  const handleCreate = async () => {
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();

    if (name.length < 2) {
      setFormError('Enter the agent’s full name (at least 2 characters).');
      return;
    }
    if (!EMAIL_PATTERN.test(email)) {
      setFormError('Enter a valid email address — the welcome mail and the login both use it.');
      return;
    }

    setFormBusy(true);
    setFormError(null);
    try {
      const response = await createAgent({
        name,
        email,
        phone: form.phone?.trim() || undefined,
        employeeId: form.employeeId?.trim() || undefined,
        department: form.department,
      });

      const data = response.data;
      setCreateOpen(false);
      setForm(emptyForm);
      await reload();

      if (data.temporaryPassword) {
        // Email is off (or SMTP failed), so the admin has to hand it over.
        setCredentials({
          name: data.agent?.name ?? name,
          email: data.agent?.email ?? email,
          password: data.temporaryPassword,
          mode: 'created',
        });
      } else {
        toast.success('Agent created', {
          description: response.message ?? `The login details were emailed to ${email}.`,
        });
      }
    } catch (err) {
      const message = handleApiError(err);
      setFormError(message);
      toast.error('Could not create the agent', { description: message });
    } finally {
      setFormBusy(false);
    }
  };

  // ---- Row actions ----
  const [busyId, setBusyId] = useState<string | null>(null);
  const [suspending, setSuspending] = useState<AgentListItem | null>(null);
  const [suspendBusy, setSuspendBusy] = useState(false);
  const [deleting, setDeleting] = useState<AgentListItem | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const handleSuspend = async () => {
    if (!suspending) return;
    setSuspendBusy(true);
    try {
      await updateAgent(suspending.id, { status: 'suspended' });
      toast.success('Agent suspended', { description: `${suspending.name} can no longer sign in.` });
      setSuspending(null);
      await reload();
    } catch (err) {
      toast.error('Could not suspend the agent', { description: handleApiError(err) });
    } finally {
      setSuspendBusy(false);
    }
  };

  const handleReactivate = async (agent: AgentListItem) => {
    setBusyId(agent.id);
    try {
      await activateAgent(agent.id);
      toast.success('Agent reactivated', { description: `${agent.name} can sign in again.` });
      await reload();
    } catch (err) {
      toast.error('Could not reactivate the agent', { description: handleApiError(err) });
    } finally {
      setBusyId(null);
    }
  };

  const handleResetPassword = async (agent: AgentListItem) => {
    setBusyId(agent.id);
    try {
      const response = await resetAgentPassword(agent.id);
      const data = response.data;
      if (data.temporaryPassword) {
        setCredentials({
          name: data.agent?.name ?? agent.name,
          email: data.agent?.email ?? agent.email,
          password: data.temporaryPassword,
          mode: 'reset',
        });
      } else {
        toast.success('Password reset', {
          description: response.message ?? `The new password was emailed to ${agent.email}.`,
        });
      }
      await reload();
    } catch (err) {
      toast.error('Could not reset the password', { description: handleApiError(err) });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await deleteAgent(deleting.id);
      toast.success('Agent deleted', { description: `${deleting.name} has been deactivated.` });
      setDeleting(null);
      await reload();
    } catch (err) {
      // The server refuses (400) when the agent has applications on record.
      const message = handleApiError(err);
      toast.error('Could not delete the agent', { description: message });
      setDeleting(null);
    } finally {
      setDeleteBusy(false);
    }
  };

  const handleEmailTest = async () => {
    setTestingEmail(true);
    try {
      const result = await testEmailConnection();
      if (!result) {
        toast.error('Could not reach the mail server');
      } else if (result.ok) {
        toast.success('Mail server connected', { description: 'Welcome emails can be delivered.' });
      } else {
        toast.error('Mail server check failed', { description: result.reason ?? 'Unknown reason' });
      }
      const status = await fetchEmailStatus();
      if (status) setEmailStatus(status);
    } finally {
      setTestingEmail(false);
    }
  };

  const copyCredentials = async () => {
    if (!credentials) return;
    const text = [
      'Sulekha Engineering — field agent login',
      `Email: ${credentials.email}`,
      `Temporary password: ${credentials.password}`,
      'You will be asked to set your own password after signing in.',
    ].join('\n');

    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      toast.success('Copied', { description: 'Share it with the agent over a secure channel.' });
    } catch {
      toast.error('Could not copy automatically', { description: 'Select the password and copy it by hand.' });
    }
  };

  const handleSort = (sortBy: string, sortOrder: SortOrder) => {
    setQuery((prev) => ({ ...prev, sortBy: sortBy as AgentListQuery['sortBy'], sortOrder }));
  };

  const filtersActive = Boolean(query.search || query.status);

  if (user && !allowed) {
    return (
      <PageContainer className="canvas-warm">
        <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Agents' }]} />
        <EmptyState
          icon={ShieldAlert}
          title="Not authorised"
          description="Agent accounts are managed by administrators only. Ask an administrator if you need an agent onboarded or suspended."
        />
      </PageContainer>
    );
  }

  const emailProblem = emailStatus && (!emailStatus.enabled || !emailStatus.configured);

  return (
    <PageContainer className="canvas-warm">
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Agents' }]} />

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Agents</h1>
          <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Field agent accounts and what each one has brought in. You create the account — the password is
            generated for you and the agent sets their own on first sign in.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="neutral-button inline-flex items-center gap-1.5 px-4 py-2 text-sm"
            onClick={() => setGuideOpen(true)}
          >
            <BookOpen className="h-4 w-4" /> Agent guide
          </button>
          <button type="button" className="brand-button inline-flex items-center gap-1.5 px-4 py-2 text-sm" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Create agent
          </button>
        </div>
      </div>

      {/* Welcome emails off → the admin has to hand credentials over by hand */}
      {emailProblem && (
        <section className="panel flex flex-col gap-3 border-[var(--warning)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--warning-tint)] text-[var(--warning)]">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--foreground)]">
                Welcome emails are switched off on the server
              </p>
              <p className="mt-0.5 text-xs leading-5 text-[var(--muted)] [overflow-wrap:anywhere]">
                New agents will not receive their login details by email
                {emailStatus?.enabled ? ' (the mail settings are incomplete)' : ' (EMAIL_ENABLED is false)'}, so the
                temporary password is shown here after a create or a reset — share it with the agent yourself.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="neutral-button inline-flex shrink-0 items-center gap-1.5 px-3 py-2 text-sm"
            onClick={() => void handleEmailTest()}
            disabled={testingEmail}
          >
            <MailCheck className="h-4 w-4" />
            {testingEmail ? 'Testing…' : 'Test connection'}
          </button>
        </section>
      )}

      {/* Credentials to hand over — only when the email could not be sent */}
      {credentials && (
        <section className="panel border-[var(--primary)] p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--primary-active)]">
                {credentials.mode === 'created' ? 'Share these credentials' : 'New password to share'}
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                The welcome email could not be sent, so {credentials.name} needs these details from you.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
              aria-label="Dismiss credentials"
              onClick={() => setCredentials(null)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="min-w-0 rounded-[1rem] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-2">
              <dt className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">Login email</dt>
              <dd className="mt-0.5 truncate text-sm font-semibold text-[var(--foreground)]">{credentials.email}</dd>
            </div>
            <div className="min-w-0 rounded-[1rem] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-2">
              <dt className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">Temporary password</dt>
              <dd className="mt-0.5 truncate font-mono text-sm font-semibold text-[var(--foreground)]">
                {credentials.password}
              </dd>
            </div>
          </dl>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="brand-button inline-flex items-center gap-1.5 px-4 py-2 text-sm"
              onClick={() => void copyCredentials()}
            >
              <Copy className="h-4 w-4" /> Copy credentials
            </button>
            <p className="text-xs text-[var(--muted-soft)]">
              They will be asked to set their own password straight after signing in.
            </p>
          </div>
        </section>
      )}

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            className="form-input pl-9"
            placeholder="Search name, email, phone or employee ID"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            aria-label="Search agents"
          />
        </div>

        <select
          className="form-input w-auto"
          value={query.status ?? ''}
          onChange={(event) =>
            setQuery((prev) => ({ ...prev, status: (event.target.value || undefined) as AgentStatus | undefined, page: 1 }))
          }
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {AGENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {AGENT_STATUS[status].label}
            </option>
          ))}
        </select>

        {filtersActive && (
          <button
            type="button"
            className="neutral-button inline-flex items-center gap-1.5 px-3 py-2 text-sm"
            onClick={() => {
              setSearchInput('');
              setQuery({ page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' });
            }}
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
        )}
      </div>

      <div className="mt-4">
        <AgentTable
          agents={agents}
          loading={loading}
          busyId={busyId}
          sortBy={query.sortBy}
          sortOrder={query.sortOrder as SortOrder | undefined}
          onSort={handleSort}
          onSuspend={setSuspending}
          onReactivate={(agent) => void handleReactivate(agent)}
          onResetPassword={(agent) => void handleResetPassword(agent)}
          onDelete={setDeleting}
          emptyAction={
            <button type="button" className="brand-button inline-flex items-center gap-1.5 px-4 py-2 text-sm" onClick={openCreate}>
              <Plus className="h-4 w-4" /> Create agent
            </button>
          }
        />
      </div>

      <div className="px-4">
        <Pagination pagination={pagination} onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))} />
      </div>

      {/* Create agent */}
      <Modal
        open={createOpen}
        onClose={closeCreate}
        title="Create agent"
        eyebrow="New field account"
        size="md"
        footer={
          <>
            <button type="button" className="neutral-button" onClick={closeCreate} disabled={formBusy}>
              Cancel
            </button>
            <button type="button" className="brand-button" onClick={() => void handleCreate()} disabled={formBusy}>
              {formBusy ? 'Creating…' : 'Create agent'}
            </button>
          </>
        }
      >
        {formError && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-[var(--error)] bg-[var(--error-tint)] p-3 text-sm text-[var(--error)]"
          >
            {formError}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="agent-name" className="form-label">
              Full name <span className="text-[var(--error)]">*</span>
            </label>
            <input
              id="agent-name"
              className="form-input mt-1.5"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="e.g. Ranjit Mondal"
            />
          </div>

          <div>
            <label htmlFor="agent-email" className="form-label">
              Email <span className="text-[var(--error)]">*</span>
            </label>
            <input
              id="agent-email"
              type="email"
              className="form-input mt-1.5"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="name@example.com"
            />
            <p className="mt-1.5 text-xs text-[var(--muted-soft)]">
              The login id and the welcome mail both use this address.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="agent-phone" className="form-label">
                Phone
              </label>
              <input
                id="agent-phone"
                className="form-input mt-1.5"
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="10-digit mobile"
              />
            </div>

            <div>
              <label htmlFor="agent-employee" className="form-label">
                Employee ID
              </label>
              <input
                id="agent-employee"
                className="form-input mt-1.5"
                value={form.employeeId}
                onChange={(event) => setForm((prev) => ({ ...prev, employeeId: event.target.value }))}
                placeholder="e.g. SE-FA-014"
              />
            </div>
          </div>

          <div>
            <label htmlFor="agent-department" className="form-label">
              Department
            </label>
            <select
              id="agent-department"
              className="form-input mt-1.5"
              value={form.department}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, department: event.target.value as AgentCreatePayload['department'] }))
              }
            >
              {AGENT_DEPARTMENTS.map((department) => (
                <option key={department.value} value={department.value}>
                  {department.label}
                </option>
              ))}
            </select>
          </div>

          <p className="rounded-[1rem] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-2 text-xs leading-5 text-[var(--muted)]">
            A strong temporary password is generated for you and the agent is asked to change it on first sign in.
            {emailProblem ? ' Emails are off, so the password will be shown here to pass on.' : ''}
          </p>
        </div>
      </Modal>

      {/* Suspend */}
      <ConfirmDialog
        open={Boolean(suspending)}
        title="Suspend this agent?"
        message={`${suspending?.name ?? 'This agent'} will not be able to sign in until you reactivate the account. Their existing applications stay untouched.`}
        confirmLabel="Suspend agent"
        tone="danger"
        busy={suspendBusy}
        onConfirm={() => void handleSuspend()}
        onCancel={() => setSuspending(null)}
      />

      {/* Delete */}
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this agent?"
        message={`${deleting?.name ?? 'This agent'} will be deactivated and removed from the ledger. An agent with applications on record cannot be deleted — the server will refuse and ask you to deactivate instead.`}
        confirmLabel="Delete agent"
        tone="danger"
        busy={deleteBusy}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleting(null)}
      />

      <GuideSheet open={guideOpen} onClose={() => setGuideOpen(false)} />
    </PageContainer>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, Users, X } from 'lucide-react';
import { installationsApi, type TeamCandidate } from '@/lib/api/installations.api';
import type { InstallationDocument } from '@/types/installation';

interface InstallationTeamCardProps {
  installation: InstallationDocument;
  onChanged: () => Promise<void> | void;
}

const ROLES = ['lead', 'technician', 'helper', 'supervisor'];

type TeamEntry = NonNullable<InstallationDocument['teamAssigned']>[number];

const memberId = (entry: TeamEntry) => String(entry.member ?? '');

/**
 * Who is on this job.
 *
 * This is the field the crew's dashboard reads: a fitter sees a job because he is
 * in this list, and sees nothing else. Until now `teamAssigned` existed on the
 * model and no screen ever wrote it, which is why an "assigned jobs" view had
 * nothing to show.
 */
export function InstallationTeamCard({ installation, onChanged }: InstallationTeamCardProps) {
  const [candidates, setCandidates] = useState<TeamCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState('');
  const [pickedRole, setPickedRole] = useState('technician');

  const team = installation.teamAssigned ?? [];

  useEffect(() => {
    installationsApi
      .teamCandidates()
      .then((response) => setCandidates(Array.isArray(response.data) ? response.data : []))
      .catch(() => setError('Could not load the crew list.'))
      .finally(() => setLoading(false));
  }, []);

  /** Names come from the candidate list — the installation stores ids only. */
  const nameFor = (id: string) => candidates.find((candidate) => candidate._id === id)?.name ?? 'Crew member';

  const available = useMemo(() => {
    const taken = new Set(team.map(memberId));
    return candidates.filter((candidate) => !taken.has(candidate._id));
  }, [candidates, team]);

  const save = async (members: Array<{ member: string; role?: string }>) => {
    setSaving(true);
    setError(null);
    try {
      await installationsApi.setTeam(installation._id, members);
      await onChanged();
    } catch (err) {
      setError(
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Could not save the crew.'
      );
    } finally {
      setSaving(false);
    }
  };

  const add = async () => {
    if (!picked) return;
    await save([
      ...team.map((entry) => ({ member: memberId(entry), role: entry.role })),
      { member: picked, role: pickedRole },
    ]);
    setPicked('');
  };

  const remove = async (id: string) => {
    await save(
      team.filter((entry) => memberId(entry) !== id).map((entry) => ({
        member: memberId(entry),
        role: entry.role,
      }))
    );
  };

  return (
    <section className="surface-card p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-[var(--muted-soft)]" />
        <h2 className="text-base font-semibold text-[var(--foreground)]">Crew on this job</h2>
      </div>
      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
        Whoever is listed here sees this installation on their own board. Nobody else does.
      </p>

      {error && (
        <p role="alert" className="mt-2 rounded-lg bg-[var(--error-tint)] px-3 py-2 text-xs text-[var(--error)]">
          {error}
        </p>
      )}

      <ul className="mt-3 space-y-2">
        {team.length === 0 && (
          <li className="rounded-lg bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--muted)]">
            Nobody assigned yet — the job is visible to the office only.
          </li>
        )}

        {team.map((entry) => (
          <li
            key={memberId(entry)}
            className="flex items-center justify-between gap-2 rounded-[0.75rem] border border-[var(--border-soft)] px-3 py-2"
          >
            <span className="min-w-0 truncate text-sm text-[var(--foreground)]">{nameFor(memberId(entry))}</span>
            <span className="flex items-center gap-2">
              <span className="badge-pill bg-[var(--surface-muted)] text-[var(--muted)]">
                {entry.role ?? 'technician'}
              </span>
              <button
                type="button"
                className="text-[var(--error)] disabled:opacity-50"
                disabled={saving}
                aria-label={`Remove ${nameFor(memberId(entry))}`}
                onClick={() => void remove(memberId(entry))}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-soft)]">
            Add someone
          </span>
          <select
            className="form-input mt-1 w-full !py-1.5 text-xs"
            value={picked}
            onChange={(event) => setPicked(event.target.value)}
            disabled={loading || saving || available.length === 0}
          >
            <option value="">
              {loading ? 'Loading…' : available.length === 0 ? 'Everyone is already on the job' : 'Pick a person'}
            </option>
            {available.map((candidate) => (
              <option key={candidate._id} value={candidate._id}>
                {candidate.name}
                {candidate.role ? ` — ${candidate.role.replace(/_/g, ' ')}` : ''}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-soft)]">
            Role
          </span>
          <select
            className="form-input mt-1 !py-1.5 text-xs"
            value={pickedRole}
            onChange={(event) => setPickedRole(event.target.value)}
            disabled={saving}
          >
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-3 py-1.5 text-[11px] font-semibold text-[var(--foreground)] disabled:opacity-50"
          disabled={!picked || saving}
          onClick={() => void add()}
        >
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          Add
        </button>
      </div>
    </section>
  );
}

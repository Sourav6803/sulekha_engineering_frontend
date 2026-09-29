'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, KeyRound, ShieldCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/lib/api/auth.api';
import { AuthSession } from '@/lib/auth/session';
import { handleApiError } from '@/lib/errors/handleApiError';
import { useAuth } from '@/hooks/useAuth';

type FormState = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

/** The server rules, shown live so the form never fails on the obvious. */
const PASSWORD_RULES: Array<{ label: string; test: (value: string) => boolean }> = [
  { label: 'At least 8 characters', test: (value) => value.length >= 8 },
  { label: 'One lower case letter', test: (value) => /[a-z]/.test(value) },
  { label: 'One upper case letter', test: (value) => /[A-Z]/.test(value) },
  { label: 'One number', test: (value) => /\d/.test(value) },
];

const validate = (form: FormState): FormErrors => {
  const errors: FormErrors = {};

  if (!form.currentPassword) {
    errors.currentPassword = 'Enter your current password';
  }

  if (!form.newPassword) {
    errors.newPassword = 'Choose a new password';
  } else if (!PASSWORD_RULES.every((rule) => rule.test(form.newPassword))) {
    errors.newPassword =
      'Use at least 8 characters with an upper case letter, a lower case letter and a number';
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = 'Confirm your new password';
  } else if (form.confirmPassword !== form.newPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
};

/**
 * Set your own password.
 *
 * This is a normal, friendly screen — an admin-created agent sees it once, on
 * the first sign in (the dashboard layout redirects here while the account still
 * carries `mustChangePassword`). Anyone else can use it to change their password
 * at any time.
 */
export default function ChangePasswordPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [form, setForm] = useState<FormState>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const update = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const nextErrors = validate(form);
    setErrors(nextErrors);

    const firstError = Object.values(nextErrors)[0];
    if (firstError) {
      toast.error('Check the form', { description: firstError });
      return;
    }

    setBusy(true);
    try {
      const response = await authApi.changePassword({ ...form });

      // The server clears mustChangePassword when the password is set. Mirror
      // that onto the stored user straight away, otherwise the dashboard layout
      // would bounce this user back to this screen.
      const storedUser = AuthSession.getUser();
      if (storedUser) {
        AuthSession.setUser({ ...storedUser, mustChangePassword: false });
      }

      toast.success('Password updated', {
        description: response.message ?? 'Use your new password the next time you sign in.',
      });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      router.replace('/dashboard');
    } catch (err) {
      const message = handleApiError(err);
      setFormError(message);
      toast.error('Could not change the password', { description: message });
    } finally {
      setBusy(false);
    }
  };

  const newPasswordReady = PASSWORD_RULES.every((rule) => rule.test(form.newPassword));

  return (
    <main className="canvas-warm min-h-screen px-3 py-6 sm:px-5 sm:py-8 lg:px-8">
      <div className="mx-auto w-full max-w-xl">
        <section className="panel p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.75rem] bg-[var(--primary-tint)] text-[var(--primary-active)]">
              <KeyRound className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--primary-active)]">
                Account security
              </p>
              <h1 className="mt-1 text-xl font-semibold text-[var(--foreground)]">Set your own password</h1>
              <p className="mt-1.5 text-sm leading-6 text-[var(--muted)]">
                {user?.mustChangePassword
                  ? 'Your account was opened for you with a temporary password. Choose one only you know and you are ready to go.'
                  : 'Enter your current password and choose a new one.'}
              </p>
            </div>
          </div>

          {user?.email && (
            <p className="mt-4 flex items-center gap-2 rounded-[1rem] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--muted)]">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[var(--success)]" />
              <span className="min-w-0 truncate">Signed in as {user.email}</span>
            </p>
          )}

          {formError && (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-[var(--error)] bg-[var(--error-tint)] p-3 text-sm text-[var(--error)]"
            >
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="currentPassword" className="form-label">
                Current password
              </label>
              <input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                value={form.currentPassword}
                onChange={(event) => update('currentPassword', event.target.value)}
                className="form-input mt-1.5"
                aria-invalid={Boolean(errors.currentPassword)}
                placeholder="The password you signed in with"
              />
              {errors.currentPassword && (
                <p className="mt-1.5 text-xs text-[var(--error)]">{errors.currentPassword}</p>
              )}
            </div>

            <div>
              <label htmlFor="newPassword" className="form-label">
                New password
              </label>
              <input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                value={form.newPassword}
                onChange={(event) => update('newPassword', event.target.value)}
                className="form-input mt-1.5"
                aria-invalid={Boolean(errors.newPassword)}
                placeholder="At least 8 characters"
              />
              {errors.newPassword && (
                <p className="mt-1.5 text-xs text-[var(--error)]">{errors.newPassword}</p>
              )}

              <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                {PASSWORD_RULES.map((rule) => {
                  const met = rule.test(form.newPassword);
                  return (
                    <li
                      key={rule.label}
                      className={`inline-flex items-center gap-1.5 text-xs ${
                        met ? 'text-[var(--success)]' : 'text-[var(--muted)]'
                      }`}
                    >
                      {met ? <Check className="h-3.5 w-3.5 shrink-0" /> : <X className="h-3.5 w-3.5 shrink-0" />}
                      <span className="min-w-0 truncate">{rule.label}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="form-label">
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(event) => update('confirmPassword', event.target.value)}
                className="form-input mt-1.5"
                aria-invalid={Boolean(errors.confirmPassword)}
                placeholder="Type the new password again"
              />
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-[var(--error)]">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              className="brand-button w-full"
              disabled={busy || !newPasswordReady || !form.currentPassword || !form.confirmPassword}
            >
              {busy ? 'Saving…' : 'Save and continue'}
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-[var(--muted-soft)]">
              You will be taken to your dashboard once the password is saved.
            </p>
            {user && !user.mustChangePassword && (
              <Link href="/dashboard" className="text-xs font-semibold text-[var(--primary-active)] hover:underline">
                Back to dashboard
              </Link>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

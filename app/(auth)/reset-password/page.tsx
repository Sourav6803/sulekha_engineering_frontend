'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Lock, Eye, EyeOff, CheckCircle2, ShieldCheck, Check, X } from 'lucide-react';
import { authApi } from '@/lib/api/auth.api';
import { handleApiError } from '@/lib/errors/handleApiError';

/** Mirrors the backend resetPasswordValidation pattern. */
const RULES = [
  { id: 'length', label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
  { id: 'lower', label: 'One lowercase letter', test: (v: string) => /[a-z]/.test(v) },
  { id: 'upper', label: 'One uppercase letter', test: (v: string) => /[A-Z]/.test(v) },
  { id: 'digit', label: 'One number', test: (v: string) => /\d/.test(v) },
];

function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ next: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passedRules = useMemo(
    () => RULES.filter((rule) => rule.test(form.newPassword)),
    [form.newPassword]
  );
  const strength = passedRules.length;
  const allRulesPass = strength === RULES.length;
  const passwordsMatch = form.newPassword.length > 0 && form.newPassword === form.confirmPassword;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError('This reset link is invalid or incomplete. Please request a new one.');
      return;
    }
    if (!allRulesPass) {
      setError('Please choose a password that meets all the requirements below.');
      return;
    }
    if (!passwordsMatch) {
      setError('The two passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({
        token,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });
      setDone(true);
      toast.success('Password reset', { description: 'You can now sign in with your new password.' });
      setTimeout(() => router.replace('/login'), 2500);
    } catch (err) {
      const message = handleApiError(err);
      setError(message);
      toast.error('Could not reset password', { description: message });
    } finally {
      setLoading(false);
    }
  };

  const strengthColor =
    strength <= 1
      ? 'bg-[var(--error)]'
      : strength <= 2
        ? 'bg-[var(--warning)]'
        : strength <= 3
          ? 'bg-[#D7A50A]'
          : 'bg-[var(--success)]';
  const strengthLabel =
    strength <= 1 ? 'Weak' : strength <= 2 ? 'Fair' : strength <= 3 ? 'Good' : 'Strong';

  return (
    <main className="flex min-h-screen items-center justify-center p-6 sm:p-8">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="relative h-11 w-11 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
            <Image
              src="/sulekha_engineering_logo.jpeg"
              alt="Sulekha Engineering"
              width={44}
              height={44}
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <p className="font-semibold text-[var(--foreground)]">Sulekha Engineering</p>
            <p className="text-xs text-[var(--muted)]">PM Surya Ghar Vendor</p>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-[var(--border-soft)] bg-white p-7 shadow-[var(--shadow-card)] sm:p-9">
          {done ? (
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--success-tint)] text-[var(--success)]">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h1 className="mt-5 text-2xl font-semibold text-[var(--foreground)]">Password updated</h1>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                Your password has been reset. Redirecting you to sign in…
              </p>
              <Link href="/login" className="brand-button mt-7 w-full justify-center">
                Go to sign in
              </Link>
            </div>
          ) : !token ? (
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--error-tint)] text-[var(--error)]">
                <X className="h-7 w-7" />
              </div>
              <h1 className="mt-5 text-2xl font-semibold text-[var(--foreground)]">Invalid reset link</h1>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                This link is missing its reset token, or it has already been used. Please request a new one.
              </p>
              <Link href="/forgot-password" className="brand-button mt-7 w-full justify-center">
                Request a new link
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-[var(--primary)]">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-sm uppercase tracking-[0.2em]">Set a new password</span>
              </div>
              <h1 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">Choose a new password</h1>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                Pick a strong password you don&apos;t use anywhere else. You&apos;ll use it to sign in from now on.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
                {error && (
                  <div className="rounded-lg border border-[var(--error)] bg-[var(--error-tint)] p-3.5 text-sm text-[var(--error)]">
                    {error}
                  </div>
                )}

                {/* New password */}
                <div className="space-y-2">
                  <label htmlFor="newPassword" className="form-label">
                    New password
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-[var(--muted-soft)]">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      id="newPassword"
                      type={show.next ? 'text' : 'password'}
                      value={form.newPassword}
                      onChange={(event) => setForm({ ...form, newPassword: event.target.value })}
                      placeholder="Enter a new password"
                      className="form-input pl-11 pr-12"
                      autoComplete="new-password"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShow((s) => ({ ...s, next: !s.next }))}
                      aria-label={show.next ? 'Hide password' : 'Show password'}
                      className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
                    >
                      {show.next ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Strength meter */}
                  {form.newPassword.length > 0 && (
                    <div className="pt-1">
                      <div className="flex gap-1.5">
                        {RULES.map((_, i) => (
                          <span
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${
                              i < strength ? strengthColor : 'bg-[var(--border-soft)]'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="mt-1.5 text-xs font-medium text-[var(--muted)]">
                        Password strength: <span className="text-[var(--foreground)]">{strengthLabel}</span>
                      </p>
                    </div>
                  )}

                  {/* Rule checklist */}
                  <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
                    {RULES.map((rule) => {
                      const ok = rule.test(form.newPassword);
                      return (
                        <li
                          key={rule.id}
                          className={`flex items-center gap-1.5 text-xs ${
                            ok ? 'text-[var(--success)]' : 'text-[var(--muted-soft)]'
                          }`}
                        >
                          {ok ? <Check className="h-3.5 w-3.5 shrink-0" /> : <X className="h-3.5 w-3.5 shrink-0" />}
                          {rule.label}
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Confirm password */}
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirm new password
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-[var(--muted-soft)]">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      id="confirmPassword"
                      type={show.confirm ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
                      placeholder="Re-enter your new password"
                      className="form-input pl-11 pr-12"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
                      aria-label={show.confirm ? 'Hide password' : 'Show password'}
                      className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
                    >
                      {show.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {form.confirmPassword.length > 0 && !passwordsMatch && (
                    <p className="text-xs text-[var(--error)]">Passwords do not match.</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="brand-button w-full justify-center"
                  disabled={loading || !allRulesPass || !passwordsMatch}
                >
                  {loading ? 'Updating…' : 'Reset password'}
                </button>
              </form>

              <Link
                href="/login"
                className="mt-6 block text-center text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
              >
                Back to sign in
              </Link>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-[var(--muted-soft)]">
          Internal operations portal for Sulekha Engineering. Authorized access only.
        </p>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}

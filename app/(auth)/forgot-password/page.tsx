'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { ArrowLeft, Mail, CheckCircle2, Sun } from 'lucide-react';
import { authApi } from '@/lib/api/auth.api';
import { handleApiError } from '@/lib/errors/handleApiError';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldError(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setFieldError('Email is required.');
      return;
    }
    if (!EMAIL_PATTERN.test(trimmed)) {
      setFieldError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPassword({ email: trimmed });
      // The server always answers the same way whether or not the account
      // exists, so the screen does too — it never confirms an email is on file.
      setSubmitted(true);
    } catch (error) {
      toast.error('Something went wrong', { description: handleApiError(error) });
    } finally {
      setLoading(false);
    }
  };

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
          {submitted ? (
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--success-tint)] text-[var(--success)]">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h1 className="mt-5 text-2xl font-semibold text-[var(--foreground)]">Check your inbox</h1>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                If an account exists for <span className="font-medium text-[var(--foreground)]">{email.trim()}</span>,
                we&apos;ve sent a password reset link. It expires in 1 hour.
              </p>
              <p className="mt-2 text-xs leading-6 text-[var(--muted-soft)]">
                Didn&apos;t get it? Check your spam folder, or try again in a few minutes.
              </p>

              <div className="mt-7 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setEmail('');
                  }}
                  className="neutral-button w-full justify-center"
                >
                  Use a different email
                </button>
                <Link href="/login" className="brand-button w-full justify-center">
                  Back to sign in
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-[var(--primary)]">
                <Sun className="h-4 w-4" />
                <span className="text-sm uppercase tracking-[0.2em]">Account recovery</span>
              </div>
              <h1 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">Forgot your password?</h1>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                Enter the email linked to your account and we&apos;ll send you a secure link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
                <div className="space-y-2">
                  <label htmlFor="email" className="form-label">
                    Email address
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-[var(--muted-soft)]">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        if (fieldError) setFieldError(null);
                      }}
                      placeholder="example@domain.com"
                      className="form-input pl-11"
                      autoComplete="email"
                      autoFocus
                      aria-invalid={Boolean(fieldError)}
                      aria-describedby={fieldError ? 'email-error' : undefined}
                    />
                  </div>
                  {fieldError && (
                    <p id="email-error" className="text-sm text-[var(--error)]">
                      {fieldError}
                    </p>
                  )}
                </div>

                <button type="submit" className="brand-button w-full justify-center" disabled={loading}>
                  {loading ? 'Sending link…' : 'Send reset link'}
                </button>
              </form>

              <Link
                href="/login"
                className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
              >
                <ArrowLeft className="h-4 w-4" />
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

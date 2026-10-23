'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { createLead } from '@/lib/api/site.api';

type Props = {
  districts?: string[];
  /** Where the form sits — used only for the lead's `pagePath` and the copy. */
  compact?: boolean;
  title?: string;
  subtitle?: string;
};

type Utm = Partial<Record<'source' | 'medium' | 'campaign' | 'content' | 'term', string>>;

/**
 * The enquiry form.
 *
 * Three things matter here beyond the fields:
 *  - the honeypot (`website`) is rendered but hidden from people, and posted as an
 *    empty string so the server's bot check stays active;
 *  - the campaign tags are read from the URL, so a printed banner's QR scan
 *    arrives already attributed;
 *  - a repeat submit is reported as "we already have it" rather than pretending a
 *    second lead was created.
 */
export default function LeadForm({ districts = [], compact = false, title, subtitle }: Props) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    district: '',
    systemSizeKW: '',
    message: '',
    website: '',
  });
  const [utm, setUtm] = useState<Utm>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'duplicate' | 'error'>('idle');
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const picked: Utm = {};
    (['source', 'medium', 'campaign', 'content', 'term'] as const).forEach((key) => {
      const value = params.get(`utm_${key}`);
      if (value) picked[key] = value;
    });
    setUtm(picked);
  }, []);

  const phoneValid = /^[0-9]{10}$/.test(form.phone.trim());
  const nameValid = form.name.trim().length >= 2;
  const canSubmit = nameValid && phoneValid && status !== 'sending';

  const source = useMemo(() => (utm.source || utm.medium === 'qr' ? 'banner_qr' : 'website'), [utm]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (!canSubmit) return;

    setStatus('sending');
    setError('');
    try {
      const result = await createLead({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        district: form.district.trim() || undefined,
        systemSizeKW: form.systemSizeKW ? Number(form.systemSizeKW) : null,
        message: form.message.trim() || undefined,
        source,
        utm: Object.keys(utm).length > 0 ? utm : undefined,
        pagePath: typeof window !== 'undefined' ? window.location.pathname : undefined,
        website: '',
      });
      setStatus(result.data?.duplicate ? 'duplicate' : 'sent');
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: { message?: string; details?: { message?: string }[] } } } })
          ?.response?.data?.error?.details?.[0]?.message ||
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ||
        'Could not send your enquiry. Please call us instead.';
      setError(message);
      setStatus('error');
    }
  };

  if (status === 'sent' || status === 'duplicate') {
    return (
      <div className="rounded-[2rem] border border-[var(--border)] bg-white p-8 text-center shadow-[var(--shadow-card)]">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--success-tint)] text-[var(--success)]">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h3 className="mt-5 font-display text-2xl font-semibold text-[var(--foreground)]">
          {status === 'duplicate' ? 'We already have your enquiry' : 'Thank you — we will call you back'}
        </h3>
        <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
          {status === 'duplicate'
            ? 'This number is already with our office. Someone will call you shortly; no need to submit again.'
            : 'Our team will call within one working day to fix a survey time. Keep your last electricity bill handy.'}
        </p>
        <button
          type="button"
          onClick={() => {
            setForm({ name: '', phone: '', email: '', district: '', systemSizeKW: '', message: '', website: '' });
            setStatus('idle');
            setTouched(false);
          }}
          className="mt-6 text-sm font-semibold text-[var(--primary)] hover:underline"
        >
          Send another enquiry
        </button>
      </div>
    );
  }

  const field =
    'w-full rounded-xl border border-[var(--border)] bg-white px-3.5 py-2.5 text-sm text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--muted-soft)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-tint)]';

  return (
    <div className={`rounded-[2rem] border border-[var(--border-soft)] bg-white shadow-[var(--shadow-card)] ${compact ? 'p-6' : 'p-6 sm:p-8'}`}>
      <h3 className="font-display text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
        {title || 'Book a free site survey'}
      </h3>
      <p className="mt-1.5 text-sm leading-6 text-[var(--muted)]">
        {subtitle || 'Leave a number and we will call to fix a time. Nothing is charged for the visit.'}
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        <div className={`grid gap-4 ${compact ? '' : 'sm:grid-cols-2'}`}>
          <div>
            <label htmlFor="lead-name" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
              Your name
            </label>
            <input
              id="lead-name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className={field}
              placeholder="Full name"
              autoComplete="name"
            />
            {touched && !nameValid && <p className="mt-1 text-xs text-[var(--error)]">Enter your name.</p>}
          </div>

          <div>
            <label htmlFor="lead-phone" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
              Mobile number
            </label>
            <input
              id="lead-phone"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value.replace(/[^\d]/g, '').slice(0, 10) })}
              className={field}
              placeholder="10-digit number"
              inputMode="numeric"
              autoComplete="tel"
            />
            {touched && !phoneValid && <p className="mt-1 text-xs text-[var(--error)]">Enter a 10-digit mobile number.</p>}
          </div>
        </div>

        <div className={`grid gap-4 ${compact ? '' : 'sm:grid-cols-2'}`}>
          <div>
            <label htmlFor="lead-district" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
              District
            </label>
            <input
              id="lead-district"
              value={form.district}
              onChange={(event) => setForm({ ...form, district: event.target.value })}
              className={field}
              placeholder="e.g. Purba Bardhaman"
              list="lead-district-options"
            />
            <datalist id="lead-district-options">
              {districts.map((district) => (
                <option key={district} value={district} />
              ))}
            </datalist>
          </div>

          <div>
            <label htmlFor="lead-size" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
              System size (if known)
            </label>
            <select
              id="lead-size"
              value={form.systemSizeKW}
              onChange={(event) => setForm({ ...form, systemSizeKW: event.target.value })}
              className={field}
            >
              <option value="">Not sure yet</option>
              {[1, 2, 3, 4, 5, 6, 8, 10].map((size) => (
                <option key={size} value={size}>{size} kW</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="lead-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
            Email <span className="font-normal normal-case text-[var(--muted-soft)]">(optional)</span>
          </label>
          <input
            id="lead-email"
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            className={field}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="lead-message" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
            Anything we should know? <span className="font-normal normal-case text-[var(--muted-soft)]">(optional)</span>
          </label>
          <textarea
            id="lead-message"
            value={form.message}
            onChange={(event) => setForm({ ...form, message: event.target.value })}
            rows={compact ? 2 : 3}
            className={`${field} resize-none`}
            placeholder="Roof type, monthly bill, best time to call…"
          />
        </div>

        {/* Honeypot: invisible to people, irresistible to bots. */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor="lead-website">Website</label>
          <input
            id="lead-website"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(event) => setForm({ ...form, website: event.target.value })}
          />
        </div>

        {status === 'error' && (
          <p className="rounded-xl bg-[var(--error-tint)] px-3.5 py-2.5 text-sm text-[var(--error)]">{error}</p>
        )}

        <button type="submit" disabled={status === 'sending'} className="brand-button w-full justify-center !py-3 disabled:opacity-70">
          {status === 'sending' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          {status === 'sending' ? 'Sending…' : 'Request a call back'}
        </button>

        <p className="text-center text-[11px] leading-5 text-[var(--muted-soft)]">
          Your number is used only to call you about this enquiry.
        </p>
      </form>
    </div>
  );
}

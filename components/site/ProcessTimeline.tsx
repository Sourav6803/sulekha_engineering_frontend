import { ClipboardCheck, FileSignature, Gauge, HardHat, Landmark, Ruler } from 'lucide-react';
import SectionHeading from './SectionHeading';
import type { ProcessStep } from '@/types/site';

const ICONS = [Ruler, FileSignature, ClipboardCheck, HardHat, Gauge, Landmark];

/**
 * "How do you actually install it?" — the question every visitor asks first.
 *
 * Written in the order the customer experiences it, with the wait they care
 * about attached to each step rather than hidden in a footnote.
 */
export default function ProcessTimeline({ steps }: { steps: ProcessStep[] }) {
  if (steps.length === 0) return null;

  return (
    <section id="process" className="scroll-mt-24 border-y border-[var(--border-soft)] bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="How we install"
          title="Six steps, from first visit to first unit"
          description="Nothing is subcontracted to a stranger. The same team surveys the roof, files the paperwork, mounts the structure and hands over the monitoring app."
        />

        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = ICONS[index % ICONS.length];
            return (
              <li
                key={step.step}
                className="group relative flex h-full flex-col rounded-[1.75rem] border border-[var(--border-soft)] bg-[var(--background)] p-6 transition-all hover:-translate-y-0.5 hover:border-[var(--primary-soft)] hover:shadow-[var(--shadow-card)]"
              >
                <div className="flex items-start justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary-tint)] text-[var(--primary-active)]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[var(--muted)] ring-1 ring-[var(--border-soft)]">
                    {step.duration}
                  </span>
                </div>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-soft)]">
                  Step {step.step}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-[var(--foreground)]">{step.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{step.detail}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

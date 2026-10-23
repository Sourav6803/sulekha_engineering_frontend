import { Plus } from 'lucide-react';
import SectionHeading from './SectionHeading';

/** Questions the office is asked on the phone every week. */
export default function FaqSection({ faqs }: { faqs: { question: string; answer: string }[] }) {
  if (faqs.length === 0) return null;

  return (
    <section id="faq" className="scroll-mt-24 border-t border-[var(--border-soft)] bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeading
            eyebrow="Questions"
            title="Straight answers, before you commit"
            description="If something is still unclear, call the office — the number is on every page, and a person answers it."
          />

          <div className="divide-y divide-[var(--border-soft)] rounded-[1.75rem] border border-[var(--border-soft)] bg-[var(--background)]">
            {faqs.map((faq) => (
              <details key={faq.question} className="group px-5 py-4 sm:px-6">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-sm font-semibold text-[var(--foreground)] marker:hidden">
                  {faq.question}
                  <Plus className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)] transition-transform duration-200 group-open:rotate-45" />
                </summary>
                <p className="mt-2.5 pr-6 text-sm leading-7 text-[var(--muted)]">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

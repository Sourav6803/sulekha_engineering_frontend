'use client';

import { useState } from 'react';
import { ArrowDownToLine, Info } from 'lucide-react';
import { Modal } from '@/components/shared/Modal';

const GUIDE_IMAGE = '/guides/pm-surya-ghar-checklist.jpg';

interface GuideSheetProps {
  open: boolean;
  onClose: () => void;
}

/** The three rules an agent has to have in mind at the consumer's door. */
const RULES: Array<{ title: string; body: string }> = [
  {
    title: 'Photos and documents must be clear and complete',
    body: 'Where a document has many pages, merge them into a single PDF. If the passbook number or the IFSC is hard to read in the photo, type it into the message so the office gets it exactly right.',
  },
  {
    title: 'The name must match across all three documents',
    body: 'Before the deal is finalised, confirm the name agrees on the Aadhaar, the passbook and the electricity bill. The letter case does not matter, but a mismatch does — get it corrected first.',
  },
  {
    title: 'The consumer should be present with the vendor',
    body: 'Completing an application takes time and the consumer-login OTPs are needed more than once, so the consumer has to be there with you while it is filled in.',
  },
];

/**
 * The agent guide — the checklist image plus the three standing rules. The image
 * is a plain file in /public; if it has not been dropped in yet the modal shows a
 * short note instead of a broken image.
 */
export function GuideSheet({ open, onClose }: GuideSheetProps) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <Modal open={open} onClose={onClose} title="Agent guide" eyebrow="PM Surya Ghar checklist" size="lg">
      <div className="space-y-5">
        <div className="rounded-[1rem] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-2">
          {imageFailed ? (
            <p className="flex items-start gap-2 px-3 py-6 text-xs leading-5 text-[var(--muted)]">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted-soft)]" aria-hidden="true" />
              <span className="min-w-0">
                The checklist image is not available yet. Ask the office for the latest printed copy — the rules below
                are the same ones it carries.
              </span>
            </p>
          ) : (
            // A plain file in /public is not in the next/image allow-list, so the
            // element is deliberate — same as the document preview.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={GUIDE_IMAGE}
              alt="PM Surya Ghar application checklist"
              className="mx-auto max-h-[60vh] w-auto max-w-full rounded-[0.75rem] object-contain"
              onError={() => setImageFailed(true)}
            />
          )}
        </div>

        <a
          href={GUIDE_IMAGE}
          download
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--primary-active)] hover:underline"
        >
          <ArrowDownToLine className="h-4 w-4" aria-hidden="true" /> Download the checklist image
        </a>

        <div className="space-y-3">
          {RULES.map((rule, index) => (
            <section
              key={rule.title}
              className="rounded-[1rem] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4"
            >
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary-tint)] text-[11px] font-semibold text-[var(--primary-active)]">
                  {index + 1}
                </span>
                <span className="min-w-0">{rule.title}</span>
              </h3>
              <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{rule.body}</p>
            </section>
          ))}
        </div>
      </div>
    </Modal>
  );
}

export default GuideSheet;

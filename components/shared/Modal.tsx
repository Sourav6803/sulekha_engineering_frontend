'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  /** Control visibility. When true the modal mounts and locks body scroll. */
  open: boolean;
  /** Called when the user dismisses via backdrop, Escape, or the close button. */
  onClose: () => void;
  title: string;
  /** Optional eyebrow/kicker text above the title, e.g. "Adjust stock". */
  eyebrow?: string;
  children: ReactNode;
  /** Max width utility class. Defaults to a comfortable form/modal width. */
  size?: 'sm' | 'md' | 'lg';
  /** Optional footer rendered below children (typically the action buttons). */
  footer?: ReactNode;
}

const SIZE_CLASSES: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
};

/**
 * Accessible, on-brand modal dialog.
 * - Dismisses on Escape, backdrop click, or the close button.
 * - Locks background scroll while open.
 * - Focuses the panel on open and returns focus to the trigger on close.
 * - Sets `aria-modal` / `role="dialog"` and a stable labelled-by.
 */
export function Modal({ open, onClose, title, eyebrow, children, size = 'md', footer }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // Escape to close + focus management.
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const timeout = window.setTimeout(() => panelRef.current?.focus(), 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(timeout);
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center"
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[var(--foreground)]/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className={`relative w-full ${SIZE_CLASSES[size]} max-h-[90vh] overflow-y-auto rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)] outline-none`}
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[var(--border-soft)] bg-[var(--surface)]/95 px-6 py-5 backdrop-blur">
          <div>
            {eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">{eyebrow}</p>
            )}
            <h2 id={titleId} className="mt-1 text-xl font-semibold text-[var(--foreground)]">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="ghost-button !p-2 text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div id={descriptionId} className="px-6 py-6">
          {children}
        </div>

        {footer && (
          <footer className="sticky bottom-0 z-10 flex flex-col-reverse gap-3 border-t border-[var(--border-soft)] bg-[var(--surface)]/95 px-6 py-4 backdrop-blur sm:flex-row sm:justify-end">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}

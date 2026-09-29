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
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Optional footer rendered below children (typically the action buttons). */
  footer?: ReactNode;
}

const SIZE_CLASSES: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  /** For the document preview — as wide as the viewport comfortably allows. */
  xl: 'max-w-5xl',
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

  /**
   * Hold the latest onClose in a ref so the effect below can depend on `open`
   * alone.
   *
   * This used to be a dependency, and callers pass a plain function declared in
   * their component body (`onClose={closeCreate}`) rather than a memoised one. A
   * new identity on every render meant the effect re-ran on every render — and
   * its cleanup calls `.focus()` on the trigger. The result was that typing a
   * single character into a modal field ran the cleanup, yanked focus back to
   * the button that opened the dialog, and the caret was gone.
   */
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Escape to close + focus management. Depends on `open` only; see above.
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const timeout = window.setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) return;
      // Never pull focus out of a field the user is already typing in.
      if (panel.contains(document.activeElement)) return;
      panel.focus();
    }, 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(timeout);
      // Return focus to whatever opened the dialog — now genuinely only once,
      // when the dialog closes.
      previouslyFocused?.focus?.();
    };
  }, [open]);

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

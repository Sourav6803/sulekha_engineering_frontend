'use client';

import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Visual tone of the primary action. Defaults to "danger". */
  tone?: 'danger' | 'primary';
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Destructive-action confirmation built on <Modal>. Disables both buttons
 * while `busy` and surfaces a loading label on the confirm action.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={busy ? () => undefined : onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <button type="button" className="neutral-button" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={
              tone === 'danger'
                ? 'inline-flex items-center justify-center gap-2 rounded-[var(--radius-full)] bg-[var(--error)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50'
                : 'brand-button'
            }
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--warning-tint)] text-[var(--warning)]">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <p className="text-sm leading-6 text-[var(--muted)]">{message}</p>
      </div>
    </Modal>
  );
}

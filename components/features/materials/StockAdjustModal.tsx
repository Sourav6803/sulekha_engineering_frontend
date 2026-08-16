'use client';

import { useMemo, useState } from 'react';
import { Modal } from '@/components/shared/Modal';
import { formatNumber } from '@/lib/format';
import type { AdjustStockDto } from '@/lib/api/materials.api';
import type { MaterialDocument } from '@/types/material';

interface StockAdjustModalProps {
  open: boolean;
  material: MaterialDocument | null;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (payload: AdjustStockDto) => Promise<void> | void;
}

type Direction = 'in' | 'out';

/**
 * Modal to manually add ("restock") or remove ("issue") stock. Produces a
 * signed `adjustment` for the backend plus a mandatory reason.
 */
export function StockAdjustModal({ open, material, busy = false, onClose, onSubmit }: StockAdjustModalProps) {
  const [direction, setDirection] = useState<Direction>('in');
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const quantity = useMemo(() => {
    const parsed = Number(qty);
    return qty.trim() !== '' && Number.isFinite(parsed) ? parsed : 0;
  }, [qty]);

  const current = material?.currentStock ?? 0;

  const validationMessage = (() => {
    if (!material) return null;
    if (quantity <= 0) return 'Enter a quantity greater than zero.';
    if (direction === 'out' && quantity > current) return 'Cannot issue more than current stock.';
    if (!reason.trim()) return 'A reason is required for this adjustment.';
    if (reason.trim().length > 500) return 'Reason cannot exceed 500 characters.';
    return null;
  })();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!material || validationMessage) {
      setError(validationMessage ?? 'Unable to adjust stock.');
      return;
    }
    setError(null);
    void onSubmit({
      adjustment: direction === 'in' ? quantity : -quantity,
      reason: reason.trim(),
    });
  };

  return (
    <Modal
      open={open}
      onClose={busy ? () => undefined : onClose}
      title={material ? `Adjust stock — ${material.name}` : 'Adjust stock'}
      eyebrow="Stock adjustment"
      size="md"
      footer={
        <>
          <button type="button" className="neutral-button" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" form="stock-adjust-form" className="brand-button" disabled={busy}>
            {busy ? 'Adjusting…' : 'Apply adjustment'}
          </button>
        </>
      }
    >
      {material && (
        <form id="stock-adjust-form" onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-[var(--radius)] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--muted)]">Current stock</span>
              <span className="font-mono text-lg font-semibold text-[var(--foreground)]">
                {formatNumber(current)}
              </span>
            </div>
          </div>

          {error && (
            <div role="alert" className="rounded-lg border border-[var(--error)] bg-[var(--error-tint)] p-4 text-sm text-[var(--error)]">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {(['in', 'out'] as Direction[]).map((dir) => (
              <button
                key={dir}
                type="button"
                onClick={() => setDirection(dir)}
                className={`rounded-[var(--radius)] border px-4 py-3 text-sm font-semibold transition-colors ${
                  direction === dir
                    ? dir === 'in'
                      ? 'border-[var(--success)] bg-[var(--success-tint)] text-[var(--success)]'
                      : 'border-[var(--error)] bg-[var(--error-tint)] text-[var(--error)]'
                    : 'border-[var(--border)] bg-white text-[var(--muted)] hover:bg-[var(--surface-muted)]'
                }`}
              >
                {dir === 'in' ? 'Restock (+)' : 'Issue (−)'}
              </button>
            ))}
          </div>

          <label className="block space-y-2">
            <span className="form-label">Quantity</span>
            <input
              className="form-input w-full"
              type="number"
              min={0}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="0"
              autoFocus
            />
          </label>

          <label className="block space-y-2">
            <span className="form-label">
              Reason <span className="ml-1 text-[var(--error)]">*</span>
            </span>
            <textarea
              className="form-input w-full resize-y"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="e.g. Damaged during delivery, physical stock count, new consignment received…"
            />
          </label>

          <div className="rounded-[var(--radius)] border border-[var(--border-soft)] bg-[var(--surface)] p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--muted)]">New balance</span>
              <span className="font-mono text-lg font-semibold text-[var(--foreground)]">
                {formatNumber(direction === 'in' ? current + quantity : current - quantity)}
              </span>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}

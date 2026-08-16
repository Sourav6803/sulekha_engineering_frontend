'use client';

import { formatNumber } from '@/lib/format';
import type { MaterialDocument } from '@/types/material';

interface StockBadgeProps {
  material: MaterialDocument;
}

/**
 * Renders a material's available stock alongside a status pill derived from
 * the backend virtual fields (isLowStock / isOverStocked). Degrades to
 * "active" when the computed fields are absent (e.g. cached responses).
 */
export function StockBadge({ material }: StockBadgeProps) {
  const current = material.currentStock ?? 0;
  const reserved = material.reservedStock ?? 0;
  const min = material.minimumStockLevel ?? 0;
  const max = material.maximumStockLevel ?? 0;

  // Mirror the model's virtual getters exactly:
  // isLowStock  = currentStock <= minimumStockLevel
  // isOverStock = maximumStockLevel > 0 && currentStock >= maximumStockLevel
  const isLow = material.isLowStock ?? current <= min;
  const isOver = material.isOverStocked ?? (max > 0 && current >= max);
  const outOfStock = current <= 0;

  let pill: { label: string; className: string } = {
    label: 'In stock',
    className: 'badge-success',
  };
  if (isOver) {
    pill = { label: 'Over stock', className: 'badge-warning' };
  } else if (isLow) {
    pill = { label: 'Low stock', className: outOfStock ? 'badge-error' : 'badge-warning' };
  }
  if (outOfStock) {
    pill = { label: 'Out of stock', className: 'badge-error' };
  }

  return (
    <div className="inline-flex items-center gap-3">
      <span className="font-mono text-sm font-medium text-[var(--foreground)]">{formatNumber(current)}</span>
      {reserved > 0 && (
        <span className="text-xs text-[var(--muted-soft)]">({formatNumber(reserved)} reserved)</span>
      )}
      <span className={`badge-pill ${pill.className}`}>{pill.label}</span>
    </div>
  );
}

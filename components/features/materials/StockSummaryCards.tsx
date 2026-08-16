'use client';

import { Banknote, Boxes, TriangleAlert } from 'lucide-react';
import { StatCard } from '@/components/shared/StatCard';
import { formatCompact, formatINR, formatNumber } from '@/lib/format';
import type { MaterialSummary } from '@/types/material';

interface StockSummaryCardsProps {
  summary: MaterialSummary | null;
  loading?: boolean;
}

/** Row of KPI cards driven by GET /materials/summary. */
export function StockSummaryCards({ summary, loading = false }: StockSummaryCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="surface-card h-32 p-6">
            <div className="skeleton h-4 w-24" />
            <div className="skeleton mt-5 h-8 w-32" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total materials"
        value={formatNumber(summary?.totalMaterials ?? 0)}
        icon={Boxes}
        hint="Active inventory items"
      />
      <StatCard
        label="Stock value"
        value={formatINR(summary?.totalStockValue ?? 0)}
        icon={Banknote}
        tone="text-[var(--primary)]"
        hint="Current inventory cost"
      />
      <StatCard
        label="Low stock items"
        value={formatNumber(summary?.lowStockCount ?? 0)}
        icon={TriangleAlert}
        tone="text-[var(--error)]"
        hint="At or below re-order level"
      />
      <StatCard
        label="Units in stock"
        value={formatCompact(summary?.totalStock ?? 0)}
        icon={Boxes}
        hint="Total quantity on hand"
      />
    </div>
  );
}

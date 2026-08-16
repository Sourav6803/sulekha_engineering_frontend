'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationInfo } from '@/types/api';
import { formatNumber } from '@/lib/format';

interface PaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
}

/**
 * Simple pagination control driven by the backend's PaginationInfo.
 * Disables the edges when there's nothing to page to.
 */
export function Pagination({ pagination, onPageChange }: PaginationProps) {
  const { page, pages, total, limit } = pagination;

  if (total <= 0) return null;

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const hasPrev = page > 1;
  const hasNext = page < pages;

  return (
    <div className="flex flex-col items-center justify-between gap-4 border-t border-[var(--border-soft)] px-1 pt-5 sm:flex-row">
      <p className="text-sm text-[var(--muted)]">
        Showing <span className="font-semibold text-[var(--foreground)]">{formatNumber(from)}</span>–
        <span className="font-semibold text-[var(--foreground)]">{formatNumber(to)}</span> of{' '}
        <span className="font-semibold text-[var(--foreground)]">{formatNumber(total)}</span>
      </p>

      <div className="inline-flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrev}
          aria-label="Previous page"
          className="neutral-button !px-3 !py-2 disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="px-3 text-sm tabular-nums text-[var(--muted)]">
          Page <span className="font-semibold text-[var(--foreground)]">{page}</span> of {Math.max(pages, 1)}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext}
          aria-label="Next page"
          className="neutral-button !px-3 !py-2 disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

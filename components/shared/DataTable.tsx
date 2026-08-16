'use client';

import type { ComponentType, ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { EmptyState } from './EmptyState';

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  /** Render a cell. Receives the row; falls back to `row[key]`. */
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  /** Extra classes applied to the cell (alignment, width, etc.). */
  className?: string;
  /** Hide column on small screens to keep the table dense. */
  hideOnMobile?: boolean;
}

export type SortOrder = 'asc' | 'desc';

interface DataTableProps<T> {
  columns: Array<DataTableColumn<T>>;
  data: T[];
  keyField: keyof T & string;
  loading?: boolean;
  /** Controlled sort state. */
  sortBy?: string;
  sortOrder?: SortOrder;
  onSort?: (key: string, order: SortOrder) => void;
  emptyState?: {
    icon?: ComponentType<{ className?: string }>;
    title: string;
    description?: string;
    action?: ReactNode;
  };
  /** Column key whose value is used as the row <tr> id. */
  rowId?: (row: T) => string;
}

/**
 * Generic sortable data table. Sorting is controlled by the parent so the
 * sort state can live alongside the API query params.
 */
export function DataTable<T>({
  columns,
  data,
  keyField,
  loading = false,
  sortBy,
  sortOrder = 'asc',
  onSort,
  emptyState,
  rowId,
}: DataTableProps<T>) {
  const handleHeaderClick = (column: DataTableColumn<T>) => {
    if (!column.sortable || !onSort) return;
    const isActive = sortBy === column.key;
    const nextOrder: SortOrder = !isActive ? 'asc' : sortOrder === 'asc' ? 'desc' : 'asc';
    onSort(column.key, nextOrder);
  };

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-3 text-left text-sm">
          <thead>
            <tr>
              {columns.map((column) => {
                const active = sortBy === column.key;
                const isSortable = Boolean(column.sortable && onSort);
                return (
                  <th
                    key={column.key}
                    scope="col"
                    className={`px-5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-soft)] ${
                      column.hideOnMobile ? 'hidden md:table-cell' : ''
                    } ${column.className ?? ''}`}
                  >
                    {isSortable ? (
                      <button
                        type="button"
                        onClick={() => handleHeaderClick(column)}
                        className="inline-flex items-center gap-1.5 uppercase tracking-[0.14em] transition-colors hover:text-[var(--foreground)]"
                      >
                        {column.header}
                        {active ? (
                          sortOrder === 'asc' ? (
                            <ArrowUp className="h-3.5 w-3.5 text-[var(--primary)]" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5 text-[var(--primary)]" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 text-[var(--muted-soft)]" />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          {loading ? (
            <tbody>
              <tr>
                <td colSpan={columns.length}>
                  <LoadingSpinner label="Loading materials…" />
                </td>
              </tr>
            </tbody>
          ) : data.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={columns.length}>
                  {emptyState ? (
                    <EmptyState
                      icon={emptyState.icon}
                      title={emptyState.title}
                      description={emptyState.description}
                      action={emptyState.action}
                    />
                  ) : (
                    <EmptyState title="No records found" />
                  )}
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody>
              {data.map((row, index) => {
                const id = rowId ? rowId(row) : String(row[keyField] ?? index);
                return (
                  <tr
                    key={id}
                    className="rounded-[1.25rem] border border-[var(--border)] bg-white shadow-[var(--shadow-xs)] transition-shadow hover:shadow-[var(--shadow-sm)]"
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-5 py-4 align-middle ${column.hideOnMobile ? 'hidden md:table-cell' : ''} ${
                          column.className ?? ''
                        }`}
                      >
                        {column.render
                          ? column.render(row)
                          : ((row as unknown as Record<string, unknown>)[column.key] as ReactNode) ?? '—'}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

/** Lightweight navigation trail: Home / Materials / Detail. */
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1.5">
            {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-[var(--muted-soft)]" />}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-[var(--muted)] transition-colors hover:text-[var(--primary)]"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'font-medium text-[var(--foreground)]' : 'text-[var(--muted)]'}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

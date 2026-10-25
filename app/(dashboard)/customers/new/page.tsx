'use client';

import Link from 'next/link';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { PageContainer } from '@/components/shared/PageContainer';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { EmptyState } from '@/components/shared/EmptyState';
import { CustomerIntakeWizard } from '@/components/features/customers/CustomerIntakeWizard';
import { useAuth } from '@/hooks/useAuth';
import { canManageCustomers } from '@/lib/permissions';

/**
 * `/customers/new` — the field visit.
 *
 * This is the screen the agent fills in sitting with the consumer: the same
 * consumer, site, deal, bill and name-match questions the application wizard used
 * to ask, saved to a Customer. The office then verifies the papers and files the
 * scheme application from that record, which is why nothing here asks for the
 * portal details.
 */
export default function NewCustomerPage() {
  const { user } = useAuth();
  const role = user?.role;
  const allowed = canManageCustomers(role);

  if (role && !allowed) {
    return (
      <PageContainer className="canvas-warm">
        <Breadcrumbs
          items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Customers', href: '/customers' }, { label: 'New' }]}
        />
        <div className="panel">
          <EmptyState
            icon={ShieldAlert}
            title="You cannot add customers"
            description="Customer records carry Aadhaar, PAN and bank papers. Only an agent, admin or manager may create one."
            action={
              <Link href="/customers" className="neutral-button inline-flex items-center gap-1.5 px-4 py-2.5 text-sm">
                Back to customers
              </Link>
            }
          />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="canvas-warm">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Customers', href: '/customers' },
          { label: 'New customer' },
        ]}
      />

      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--primary-active)]">
            Field intake
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">New customer</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Everything the consumer tells you at the house. Save once — the office reads it, verifies the papers, and
            files the scheme application without asking again.
          </p>
        </div>
        <Link href="/customers" className="neutral-button inline-flex items-center gap-1.5 px-3 py-2 text-sm">
          <ArrowLeft className="h-4 w-4" /> All customers
        </Link>
      </div>

      <div className="mt-4">
        <CustomerIntakeWizard />
      </div>
    </PageContainer>
  );
}

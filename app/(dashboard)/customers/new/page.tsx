'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/shared/PageContainer';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { EmptyState } from '@/components/shared/EmptyState';
import { CustomerForm } from '@/components/features/customers/CustomerForm';
import { useCustomers } from '@/hooks/useCustomers';
import { useAuth } from '@/hooks/useAuth';
import { handleApiError } from '@/lib/errors/handleApiError';
import { canManageCustomers } from '@/lib/permissions';
import type { CreateCustomerDto } from '@/lib/api/customers.api';

/**
 * `/customers/new` — intake as a page, not a modal.
 *
 * The agent fills this in sitting with the customer: Aadhaar, PAN, the bill, the
 * bank papers and the roof photo all get collected here, which is more than a
 * dialog can hold without scrolling inside a scroll. It also gives the record a
 * URL of its own, so a half-finished entry can be sent to a colleague.
 *
 * On save it lands on the customer's own page — from there the office verifies
 * the papers and files the application.
 */
export default function NewCustomerPage() {
  const router = useRouter();
  const { user } = useAuth();
  const role = user?.role;
  const allowed = canManageCustomers(role);

  const { createCustomer } = useCustomers();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (payload: CreateCustomerDto) => {
    setSaving(true);
    try {
      const response = await createCustomer(payload);
      const created = response.data;
      // Navigate first, then announce: a toast raised just before the route
      // changes is dropped along with the page that queued it.
      router.push(`/customers/${created._id}?created=1`);
      toast.success('Customer created', {
        description: `${created.name} — ${created.customerId}. Add the documents, then verify to file an application.`,
      });
    } catch (err) {
      // The form shows field errors; this is the "phone already exists" class of
      // refusal, which belongs next to the button rather than on a toast alone.
      toast.error('Could not save customer', { description: handleApiError(err) });
    } finally {
      setSaving(false);
    }
  };

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
            Collect the KYC, the electricity bill and the roof photo while you are at the house. Save it once — the
            application later reads all of it from this record instead of asking again.
          </p>
        </div>
        <Link href="/customers" className="neutral-button inline-flex items-center gap-1.5 px-3 py-2 text-sm">
          <ArrowLeft className="h-4 w-4" /> All customers
        </Link>
      </div>

      <div className="panel mt-4">
        <CustomerForm mode="create" submitting={saving} onSubmit={handleSubmit} />
      </div>
    </PageContainer>
  );
}

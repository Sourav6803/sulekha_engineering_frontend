'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/shared/PageContainer';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { EmptyState } from '@/components/shared/EmptyState';
import { Modal } from '@/components/shared/Modal';
import { CustomerDetailView } from '@/components/features/customers/CustomerDetailView';
import { CustomerForm } from '@/components/features/customers/CustomerForm';
import { useCustomers } from '@/hooks/useCustomers';
import { useAuth } from '@/hooks/useAuth';
import { handleApiError } from '@/lib/errors/handleApiError';
import { canManageCustomers, canStartApplication } from '@/lib/permissions';
import { customersApi } from '@/lib/api/customers.api';
import type { CustomerHistory, CustomerHistorySummary } from '@/lib/api/customers.api';
import type { Customer } from '@/types/customer';
import type { InstallationDocument } from '@/types/installation';

const EMPTY_SUMMARY: CustomerHistorySummary = {
  totalInstallations: 0,
  totalSystemCapacity: 0,
  completedInstallations: 0,
  averageSystemSize: 0,
  totalCost: 0,
};

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  /** Set by /customers/new after a save: /customers/<id>?created=1 */
  const justCreated = useSearchParams().get('created') === '1';

  const { user } = useAuth();
  const role = user?.role;
  const canEdit = canManageCustomers(role);

  const { getHistory, updateCustomer } = useCustomers();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [summary, setSummary] = useState<CustomerHistorySummary>(EMPTY_SUMMARY);
  const [installations, setInstallations] = useState<InstallationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  /*
   * Only a verified customer can become an application: the API refuses one
   * whose papers nobody has checked. `verification.status` is the signal;
   * `status: active` is the fallback for records older than that field.
   */
  const isVerified =
    customer?.verification?.status === 'verified' ||
    (!customer?.verification && customer?.status === 'active');

  const fileApplicationHref =
    canStartApplication(role) && isVerified && customer
      ? `/applications/new?customerId=${customer._id}`
      : undefined;

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const result = await getHistory(id);
      setCustomer(result.data.customer);
      setSummary(result.data.summary ?? EMPTY_SUMMARY);
      setInstallations(Array.isArray(result.data.installations) ? result.data.installations : []);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, [id, getHistory]);

  /* The office clears the intake. Admin and manager only — the API enforces the
     same rule, so an agent never sees this button and could not use it anyway. */
  const canVerify = role === 'admin' || role === 'manager';
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      await customersApi.verify(id, { status: 'verified' });
      toast.success('Papers verified — the application can be filed now');
      await load(false);
    } catch (err) {
      toast.error('Could not verify the papers', { description: handleApiError(err) });
    } finally {
      setVerifying(false);
    }
  };

  // Initial fetch. setState happens only inside promise callbacks so the
  // effect body performs no synchronous state updates.
  useEffect(() => {
    let active = true;

    getHistory(id)
      .then((res) => {
        if (!active) return;
        const data: CustomerHistory = res.data;
        setCustomer(data.customer);
        setSummary(data.summary ?? EMPTY_SUMMARY);
        setInstallations(Array.isArray(data.installations) ? data.installations : []);
      })
      .catch((err) => {
        if (active) setError(handleApiError(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, getHistory]);

  const handleEditSubmit = async (payload: Parameters<typeof updateCustomer>[1]) => {
    setBusy(true);
    setModalError(null);
    try {
      await updateCustomer(id, payload);
      setEditOpen(false);
      await load(false);
      toast.success('Customer updated', { description: 'The customer record has been saved.' });
    } catch (err) {
      const message = handleApiError(err);
      setModalError(message);
      toast.error('Could not update customer', { description: message });
    } finally {
      setBusy(false);
    }
  };

  /**
   * Save the panel serial list on its own, without opening the edit modal.
   *
   * Deliberately does not catch: the card owns the busy and error state around its
   * own Save button, and a rejection swallowed here would show up there as a save
   * that quietly did nothing.
   */
  const handleSavePanelSerials = async (serials: string[]) => {
    await updateCustomer(id, { panelSerialNumbers: serials });
    await load(false);
    toast.success('Panel serial numbers saved', {
      description: `${serials.length} serial number${serials.length === 1 ? '' : 's'} recorded.`,
    });
  };

  if (loading) {
    return (
      <PageContainer className="canvas-warm">
        {/* Mirrors the real section stack — identity band, the KPI row, then the
            two full-width panels — so the page does not jump when data lands. */}
        <div className="space-y-6">
          <div className="skeleton h-5 w-56" />
          <div className="skeleton h-52 w-full" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="skeleton h-36 w-full" />
            <div className="skeleton h-36 w-full" />
            <div className="skeleton h-36 w-full" />
            <div className="skeleton h-36 w-full" />
          </div>
          <div className="skeleton h-56 w-full" />
          <div className="skeleton h-80 w-full" />
        </div>
      </PageContainer>
    );
  }

  if (error || !customer) {
    return (
      <PageContainer className="canvas-warm">
        <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Customers', href: '/customers' }, { label: 'Detail' }]} />
        <div className="surface-card mt-8">
          <EmptyState
            icon={Users}
            title="Customer not found"
            description={error ?? 'This customer could not be loaded or may have been removed.'}
            action={
              <Link href="/customers" className="neutral-button">
                <ArrowLeft className="h-4 w-4" />
                Back to customers
              </Link>
            }
          />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      className="canvas-warm"
      header={
        // Just the trail: the hero band below carries its own "All customers"
        // link, and two identical controls on one screen is noise.
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Customers', href: '/customers' },
            { label: customer.name },
          ]}
        />
      }
    >
      {/*
       * Confirmation of the save, shown on the page the operator lands on.
       * A toast raised from the form fired while that page was unmounting, so
       * this is the reliable version — the URL says the customer was just made.
       */}
      {justCreated && (
        <div
          role="status"
          className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--success)] bg-[var(--success-tint)] px-4 py-3 text-sm text-[var(--success)]"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>
            <span className="font-semibold">{customer.name}</span> was created ({customer.customerId}). Add the
            documents below, then mark them verified to file the application.
          </span>
        </div>
      )}

      <CustomerDetailView
        customer={customer}
        summary={summary}
        installations={installations}
        canEdit={canEdit}
        fileApplicationHref={fileApplicationHref}
        canVerify={canVerify}
        onVerify={handleVerify}
        verifying={verifying}
        onEdit={() => {
          setModalError(null);
          setEditOpen(true);
        }}
        onRefetch={() => load(false)}
        onSavePanelSerials={handleSavePanelSerials}
      />

      {/* Edit modal — conditionally mounted so each open is a fresh instance */}
      {editOpen && (
        <Modal
          open
          onClose={() => !busy && setEditOpen(false)}
          title="Edit customer"
          eyebrow="Update customer record"
          size="lg"
        >
          {modalError && (
            <div role="alert" className="mb-5 rounded-lg border border-[var(--error)] bg-[var(--error-tint)] p-4 text-sm text-[var(--error)]">
              {modalError}
            </div>
          )}
          <CustomerForm
            key={customer._id}
            initial={customer}
            mode="edit"
            submitting={busy}
            onSubmit={handleEditSubmit}
            onRefetch={() => load(false)}
          />
        </Modal>
      )}
    </PageContainer>
  );
}

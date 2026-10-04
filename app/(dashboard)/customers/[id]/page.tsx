'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Users } from 'lucide-react';
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
import { canManageCustomers } from '@/lib/permissions';
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
      <CustomerDetailView
        customer={customer}
        summary={summary}
        installations={installations}
        canEdit={canEdit}
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

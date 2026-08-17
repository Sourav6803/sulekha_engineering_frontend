'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/shared/PageContainer';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { EmptyState } from '@/components/shared/EmptyState';
import { Modal } from '@/components/shared/Modal';
import { SupplierDetailView } from '@/components/features/suppliers/SupplierDetailView';
import { SupplierForm } from '@/components/features/suppliers/SupplierForm';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useAuth } from '@/hooks/useAuth';
import { handleApiError } from '@/lib/errors/handleApiError';
import { canManageSuppliers } from '@/lib/permissions';
import type { SupplierDocument } from '@/types/supplier';

export default function SupplierDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { user } = useAuth();
  const role = user?.role;
  const canEdit = canManageSuppliers(role);

  const { getSupplier, getPurchases, updateSupplier } = useSuppliers();

  const [supplier, setSupplier] = useState<SupplierDocument | null>(null);
  const [purchases, setPurchases] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasesLoading, setPurchasesLoading] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const result = await getSupplier(id);
      setSupplier(result.data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, [id, getSupplier]);

  const loadPurchases = useCallback(async (showLoading = true) => {
    if (showLoading) setPurchasesLoading(true);
    try {
      const result = await getPurchases(id, { page: 1, limit: 20 });
      const data = (result.data as { data?: unknown[] })?.data;
      setPurchases(Array.isArray(data) ? data : []);
    } catch {
      setPurchases([]);
    } finally {
      setPurchasesLoading(false);
    }
  }, [id, getPurchases]);

  useEffect(() => {
    let active = true;

    getSupplier(id)
      .then((res) => {
        if (active) setSupplier(res.data);
      })
      .catch((err) => {
        if (active) setError(handleApiError(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    getPurchases(id, { page: 1, limit: 20 })
      .then((res) => {
        if (!active) return;
        const data = (res.data as { data?: unknown[] })?.data;
        setPurchases(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setPurchases([]);
      })
      .finally(() => {
        if (active) setPurchasesLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, getSupplier, getPurchases]);

  const handleEditSubmit = async (payload: Parameters<typeof updateSupplier>[1]) => {
    setBusy(true);
    setModalError(null);
    try {
      await updateSupplier(id, payload);
      setEditOpen(false);
      await load(false);
      toast.success('Supplier updated', { description: 'The supplier record has been saved.' });
    } catch (err) {
      const message = handleApiError(err);
      setModalError(message);
      toast.error('Could not update supplier', { description: message });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <div className="skeleton h-5 w-56" />
          <div className="skeleton h-40 w-full" />
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="skeleton h-72 w-full" />
            <div className="skeleton h-72 w-full" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error || !supplier) {
    return (
      <PageContainer>
        <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Suppliers', href: '/suppliers' }, { label: 'Detail' }]} />
        <div className="surface-card mt-8">
          <EmptyState
            icon={Building2}
            title="Supplier not found"
            description={error ?? 'This supplier could not be loaded or may have been removed.'}
            action={
              <Link href="/suppliers" className="neutral-button">
                <ArrowLeft className="h-4 w-4" />
                Back to suppliers
              </Link>
            }
          />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      header={
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Suppliers', href: '/suppliers' }, { label: supplier.name }]} />
            <Link href="/suppliers" className="ghost-button">
              <ArrowLeft className="h-4 w-4" />
              Back to suppliers
            </Link>
          </div>
        </div>
      }
    >
      <SupplierDetailView
        supplier={supplier}
        purchases={purchases}
        purchasesLoading={purchasesLoading}
        canEdit={canEdit}
        onEdit={() => {
          setModalError(null);
          setEditOpen(true);
        }}
        onRefetch={() => {
          load(false);
          loadPurchases(false);
        }}
      />

      {editOpen && (
        <Modal
          open
          onClose={() => !busy && setEditOpen(false)}
          title="Edit supplier"
          eyebrow="Update supplier record"
          size="lg"
        >
          {modalError && (
            <div role="alert" className="mb-5 rounded-lg border border-[var(--error)] bg-[var(--error-tint)] p-4 text-sm text-[var(--error)]">
              {modalError}
            </div>
          )}
          <SupplierForm
            key={supplier._id}
            initial={supplier}
            mode="edit"
            submitting={busy}
            onSubmit={handleEditSubmit}
          />
        </Modal>
      )}
    </PageContainer>
  );
}

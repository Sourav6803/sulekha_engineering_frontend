'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Trash2, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/shared/PageContainer';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { InstallationDetailView } from '@/components/features/installations/InstallationDetailView';
import { installationsApi } from '@/lib/api/installations.api';
import { useAuth } from '@/hooks/useAuth';
import { handleApiError } from '@/lib/errors/handleApiError';
import { canAssignMaterials, canDeleteInstallation } from '@/lib/permissions';
import type { InstallationDocument } from '@/types/installation';

export default function InstallationDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { user } = useAuth();
  const canAssign = canAssignMaterials(user?.role);
  const canDelete = canDeleteInstallation(user?.role);

  const [installation, setInstallation] = useState<InstallationDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const result = await installationsApi.get(id);
      setInstallation(result.data);
      setError(null);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let active = true;
    installationsApi
      .get(id)
      .then((res) => {
        if (active) {
          setInstallation(res.data);
          setError(null);
        }
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
  }, [id]);

  const handleDelete = useCallback(async () => {
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await installationsApi.remove(id);
      setDeleteOpen(false);
      toast.success('Installation deleted', { description: 'The installation has been deactivated.' });
    } catch (err) {
      const message = handleApiError(err);
      setDeleteError(message);
      toast.error('Could not delete installation', { description: message });
    } finally {
      setDeleteBusy(false);
    }
  }, [id]);

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <div className="skeleton h-5 w-56" />
          <div className="skeleton h-44 w-full" />
          <div className="skeleton h-72 w-full" />
        </div>
      </PageContainer>
    );
  }

  if (error || !installation) {
    return (
      <PageContainer>
        <Breadcrumbs
          items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Installations', href: '/installations' }, { label: 'Detail' }]}
        />
        <div className="surface-card mt-8">
          <EmptyState
            icon={Sun}
            title="Installation not found"
            description={error ?? 'This installation could not be loaded or may have been removed.'}
            action={
              <Link href="/installations" className="neutral-button">
                <ArrowLeft className="h-4 w-4" />
                Back to installations
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
            <Breadcrumbs
              items={[
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'Installations', href: '/installations' },
                { label: installation.installationId },
              ]}
            />
            <div className="flex gap-2">
              <Link href="/installations" className="ghost-button">
                <ArrowLeft className="h-4 w-4" />
                Back to installations
              </Link>
              {canDelete && (
                <button type="button" className="ghost-button text-[var(--error)]" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      }
    >
      <InstallationDetailView installation={installation} canAssign={canAssign} onRefetch={() => load(false)} />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete installation"
        message={`Are you sure you want to delete "${installation.installationId}"? This will deactivate the record. Installations with confirmed materials cannot be deleted — reverse them first.`}
        confirmLabel="Delete installation"
        busy={deleteBusy}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
      <ConfirmDialog
        open={Boolean(deleteError)}
        title="Could not delete installation"
        message={deleteError ?? ''}
        confirmLabel="OK"
        tone="primary"
        onConfirm={() => setDeleteError(null)}
        onCancel={() => setDeleteError(null)}
      />
    </PageContainer>
  );
}
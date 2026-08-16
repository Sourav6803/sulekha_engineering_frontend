'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, PackageOpen } from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/shared/PageContainer';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { EmptyState } from '@/components/shared/EmptyState';
import { Modal } from '@/components/shared/Modal';
import { StockAdjustModal } from '@/components/features/materials/StockAdjustModal';
import { ImageUploadModal } from '@/components/features/materials/ImageUploadModal';
import { MaterialDetailView } from '@/components/features/materials/MaterialDetailView';
import { useAuth } from '@/hooks/useAuth';
import { useMaterials } from '@/hooks/useMaterials';
import { handleApiError } from '@/lib/errors/handleApiError';
import { canAdjustStock, canManageMaterials } from '@/lib/permissions';
import type { AdjustStockDto } from '@/lib/api/materials.api';
import type { MaterialDocument, StockLedgerEntry } from '@/types/material';

export default function MaterialDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { user } = useAuth();
  const role = user?.role;
  const canAdjust = canAdjustStock(role);
  const canUpload = canManageMaterials(role);

  const { getMaterial, getMaterialHistory, adjustStock, uploadMaterialImage } = useMaterials();

  const [material, setMaterial] = useState<MaterialDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<StockLedgerEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Reload helpers — used by mutation handlers (event handlers may set state
  // synchronously). Not called from an effect.
  const load = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const result = await getMaterial(id);
      setMaterial(result.data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, [id, getMaterial]);

  const loadHistory = useCallback(async (showLoading = true) => {
    if (showLoading) setHistoryLoading(true);
    try {
      const result = await getMaterialHistory(id, { page: 1, limit: 50 });
      setHistory(Array.isArray(result.data) ? result.data : []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [id, getMaterialHistory]);

  // Initial fetch. setState happens only inside promise callbacks so the
  // effect body performs no synchronous state updates.
  useEffect(() => {
    let active = true;

    getMaterial(id)
      .then((res) => {
        if (active) setMaterial(res.data);
      })
      .catch((err) => {
        if (active) setError(handleApiError(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    getMaterialHistory(id, { page: 1, limit: 50 })
      .then((res) => {
        if (active) setHistory(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (active) setHistory([]);
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, getMaterial, getMaterialHistory]);

  const handleAdjust = async (payload: AdjustStockDto) => {
    setBusy(true);
    setModalError(null);
    try {
      await adjustStock(id, payload);
      setAdjustOpen(false);
      setLoading(true);
      setHistoryLoading(true);
      await Promise.all([load(), loadHistory()]);
      toast.success(
        payload.adjustment > 0 ? 'Stock restocked' : 'Stock issued',
        {
          description: `${Math.abs(payload.adjustment)} × ${material?.unit ?? 'units'} adjusted${payload.reason ? ` — ${payload.reason}` : ''}.`,
        }
      );
    } catch (err) {
      const message = handleApiError(err);
      setModalError(message);
      toast.error('Could not adjust stock', { description: message });
    } finally {
      setBusy(false);
    }
  };

  const handleUpload = async (file: File) => {
    setBusy(true);
    setModalError(null);
    try {
      await uploadMaterialImage(id, file);
      setUploadOpen(false);
      setLoading(true);
      await load();
      toast.success('Image uploaded', { description: 'The material photo has been updated.' });
    } catch (err) {
      const message = handleApiError(err);
      setModalError(message);
      toast.error('Could not upload image', { description: message });
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

  if (error || !material) {
    return (
      <PageContainer>
        <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Materials', href: '/materials' }, { label: 'Detail' }]} />
        <div className="surface-card mt-8">
          <EmptyState
            icon={PackageOpen}
            title="Material not found"
            description={error ?? 'This material could not be loaded or may have been removed.'}
            action={
              <Link href="/materials" className="neutral-button">
                <ArrowLeft className="h-4 w-4" />
                Back to materials
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
              items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Materials', href: '/materials' }, { label: material.name }]}
            />
            <Link href="/materials" className="ghost-button">
              <ArrowLeft className="h-4 w-4" />
              Back to materials
            </Link>
          </div>
        </div>
      }
    >
      <MaterialDetailView
        material={material}
        history={history}
        historyLoading={historyLoading}
        canAdjust={canAdjust}
        canUpload={canUpload}
        onAdjustStock={() => {
          setModalError(null);
          setAdjustOpen(true);
        }}
        onUploadImage={() => {
          setModalError(null);
          setUploadOpen(true);
        }}
      />

      {/* Adjust stock modal — conditionally mounted so each open is a fresh instance */}
      {adjustOpen && (
        <StockAdjustModal
          open
          material={material}
          busy={busy}
          onClose={() => !busy && setAdjustOpen(false)}
          onSubmit={handleAdjust}
        />
      )}

      {/* Image upload modal */}
      {uploadOpen && (
        <ImageUploadModal
          open
          material={material}
          busy={busy}
          onClose={() => !busy && setUploadOpen(false)}
          onSubmit={handleUpload}
        />
      )}

      {/* Generic modal to surface action errors when a modal is open */}
      <Modal open={Boolean(modalError)} onClose={() => setModalError(null)} title="Something went wrong" size="sm">
        <p className="text-sm leading-6 text-[var(--muted)]">{modalError}</p>
      </Modal>
    </PageContainer>
  );
}

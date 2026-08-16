'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/shared/PageContainer';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { InstallationForm } from '@/components/features/installations/InstallationForm';
import { BOMExcelEditor } from '@/components/features/installations/BOMExcelEditor';
import { useInstallations } from '@/hooks/useInstallations';
import { customersApi } from '@/lib/api/customers.api';
import { handleApiError } from '@/lib/errors/handleApiError';
import type { CreateInstallationResponse } from '@/lib/api/installations.api';
import type { Customer } from '@/types/customer';

function NewInstallationPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get('customer');
  
  const { createInstallation } = useInstallations();
  const [initialCustomer, setInitialCustomer] = useState<Customer | null>(null);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreateInstallationResponse | null>(null);
  
  useEffect(() => {
    if (!preselectedId) return;
    let active = true;
    customersApi
      .get(preselectedId)
      .then((res) => {
        if (active) setInitialCustomer(res.data);
      })
      .catch((err) => {
        if (active) setCustomerError(handleApiError(err));
      })
      .finally(() => {
        if (active) setCustomerLoading(false);
      });
    return () => { active = false; };
  }, [preselectedId]);
  
  const handleSubmit = useCallback(
    async (payload: Parameters<typeof createInstallation>[0]) => {
      setSubmitting(true);
      setFormError(null);
      try {
        const result = await createInstallation(payload);
        const data: CreateInstallationResponse = result.data;
        setCreated(data);
        toast.success('Installation created', {
          description: 'Your suggested BOM has been generated — review and print it.',
        });
      } catch (err) {
        const message = handleApiError(err);
        setFormError(message);
        toast.error('Could not create installation', { description: message });
      } finally {
        setSubmitting(false);
      }
    },
    [createInstallation]
  );
  
  const goToDetail = () => {
    if (!created) return;
    router.push(`/installations/${created.installation._id}`);
  };
  
  return (
    <PageContainer
      header={
        <div className="space-y-4">
          <Breadcrumbs
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Installations', href: '/installations' },
              { label: created ? 'Review suggested BOM' : 'New installation' },
            ]}
          />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">Installations</p>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--foreground)]">
              {created ? 'Review suggested BOM' : 'New installation'}
            </h1>
            <p className="mt-2 max-w-2xl text-base text-[var(--muted)]">
              {created
                ? 'Adjust quantities as needed, then print the BOM to take to site. Stock is only deducted when you confirm actual usage.'
                : 'One customer can have only one installation. Create the record and generate the suggested BOM in one go.'}
            </p>
          </div>
        </div>
      }
    >
      {customerError && !created && (
        <div role="alert" className="rounded-lg border border-[var(--warning)] bg-[var(--warning-tint)] p-4 text-sm text-[var(--warning)]">
          Could not load the preselected customer: {customerError}
        </div>
      )}

      {formError && !created && (
        <div role="alert" className="rounded-lg border border-[var(--error)] bg-[var(--error-tint)] p-4 text-sm text-[var(--error)]">
          {formError}
        </div>
      )}

      {created ? (
        <div className="space-y-6">
          <div className="flex items-start gap-3 rounded-2xl border border-[var(--success)] bg-[var(--success-tint)] p-5">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--success)]" />
            <div>
              <p className="font-semibold text-[var(--foreground)]">
                Installation {created.installation.installationId} created
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Customer: {created.installation.customerNameSnapshot} • {created.installation.systemSizeKW} kW •{' '}
                {(created.installation.roofType || '').replace(/_/g, ' ')}
              </p>
            </div>
          </div>

          <div className="surface-card p-5 sm:p-6">
            <BOMExcelEditor
              key={created.installation._id}
              installationId={created.installation._id}
              customerName={created.installation.customerNameSnapshot || undefined}
              mobileNo={created.installation.customerPhoneSnapshot || undefined}
              projectNo={created.installation.projectNo || undefined}
              quotationNo={created.installation.quotationNo || undefined}
              systemSizeKW={created.installation.systemSizeKW}
              roofType={created.installation.roofType || undefined}
              variant="suggested"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button type="button" className="ghost-button" onClick={() => setCreated(null)}>
              <ArrowLeft className="h-4 w-4" />
              Back to form
            </button>
            <button type="button" className="brand-button" onClick={goToDetail}>
              Save & open installation
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="surface-card p-5 sm:p-8">
          {customerLoading ? (
            <div className="flex items-center gap-3 py-10 text-sm text-[var(--muted)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading customer…
            </div>
          ) : (
            <InstallationForm
              initialCustomer={initialCustomer}
              submitting={submitting}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      )}
    </PageContainer>
  );
}

export default function NewInstallationPage() {
  return (
    <Suspense fallback={<PageContainer><div className="skeleton h-72 w-full" /></PageContainer>}>
      <NewInstallationPageInner />
    </Suspense>
  );
}
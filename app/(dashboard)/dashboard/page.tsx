'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, PackageX, TrendingUp, Users, Wrench, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { materialsApi } from '@/lib/api/materials.api';
import { installationsApi } from '@/lib/api/installations.api';
import { customersApi } from '@/lib/api/customers.api';
import { purchasesApi } from '@/lib/api/purchases.api';
import { installationStatusStyle } from '@/components/features/installations/installationStatus';
import type { MaterialSummary, MaterialDocument } from '@/types/material';
import type { InstallationDocument } from '@/types/installation';
import type { PurchaseDocument } from '@/types/purchase';

const PM_SURYAAHAR_NEWS = [
  {
    id: '1',
    title: 'PM Surya Ghar Muft Bijli Yojana Extended',
    date: '2026-08-10',
    summary: 'Government extends free electricity scheme with enhanced subsidies for rooftop solar installations.',
    source: 'Ministry of New & Renewable Energy',
  },
  {
    id: '2',
    title: 'New Subsidy Rates for Rooftop Solar',
    date: '2026-07-28',
    summary: 'Updated subsidy structure announced for residential rooftop solar systems up to 6 kW capacity.',
    source: 'MNRE Official Notification',
  },
  {
    id: '3',
    title: 'PM Surya Ghar Portal Registration Crosses 1 Crore',
    date: '2026-07-15',
    summary: 'Over 1 crore households register for free electricity scheme across the country.',
    source: 'PIB',
  },
];

const SCHEME_STATS = [
  { label: 'Target households', value: '10 Crore+' },
  { label: 'Free electricity', value: 'Up to 300 units/month' },
  { label: 'Subsidy on solar', value: 'Up to 60%' },
  { label: 'Last date to apply', value: '31 March 2027' },
];

export default function DashboardPage() {
  const [summary, setSummary] = useState<MaterialSummary | null>(null);
  const [recentInstallations, setRecentInstallations] = useState<InstallationDocument[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [purchases, setPurchases] = useState<PurchaseDocument[]>([]);
  const [lowStock, setLowStock] = useState<MaterialDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      try {
        const [summaryRes, installationsRes, customersRes, purchasesRes, lowStockRes] = await Promise.all([
          materialsApi.getSummary(),
          installationsApi.list({ limit: 5, sortBy: 'installDate', sortOrder: 'desc' }),
          customersApi.list({ limit: 1 }),
          purchasesApi.list({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
          materialsApi.getLowStock(),
        ]);

        if (!active) return;

        setSummary(summaryRes.data);
        setRecentInstallations(Array.isArray(installationsRes.data) ? installationsRes.data : []);
        setTotalCustomers(customersRes.pagination?.total ?? 0);
        setPurchases(Array.isArray(purchasesRes.data) ? purchasesRes.data : []);
        setLowStock(Array.isArray(lowStockRes.data) ? lowStockRes.data.slice(0, 5) : []);
      } catch (err) {
        toast.error('Failed to load dashboard data');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const pendingInstallations = recentInstallations.filter(i => i.status === 'pending_quotation' || i.status === 'quoted').length;
  const completedInstallations = recentInstallations.filter(i => i.status === 'completed').length;
  const pendingPurchases = purchases.filter(p => p.status === 'pending' || p.status === 'processing').length;

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Hero Header */}
        <header className="relative overflow-hidden rounded-[2rem] border border-[var(--border)] bg-white/95 p-8 shadow-[var(--shadow)]">
          <div className="absolute inset-0 overflow-hidden rounded-[2rem]">
            <img
              src="/sulekha_engineering_logo.jpeg"
              alt=""
              aria-hidden="true"
              className="h-full w-full object-contain opacity-[0.08]"
            />
          </div>
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.24em] text-[var(--primary)]">
                PM Surya Ghar Vendor Portal
              </p>
              <h1 className="text-3xl font-semibold text-[var(--foreground)]">
                Sulekha Engineering Dashboard
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[var(--muted)]">
                Manage installations, inventory, and customer records for PM Surya Ghar Muft Bijli Yojana.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/installations/new" className="brand-button">
                New installation
              </Link>
              <Link href="/purchases" className="neutral-button">
                Purchase request
              </Link>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="surface-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">Total customers</p>
                <p className="mt-4 text-3xl font-semibold text-[var(--foreground)]">
                  {loading ? '...' : formatNumber(totalCustomers)}
                </p>
              </div>
              <div className="rounded-full bg-[var(--primary-tint)] p-3 text-[var(--primary-active)]">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="surface-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">Pending installations</p>
                <p className="mt-4 text-3xl font-semibold text-[var(--primary)]">
                  {loading ? '...' : formatNumber(pendingInstallations)}
                </p>
              </div>
              <div className="rounded-full bg-[var(--primary-tint)] p-3 text-[var(--primary-active)]">
                <Wrench className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="surface-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">Stock value</p>
                <p className="mt-4 text-3xl font-semibold text-[var(--foreground)]">
                  {loading ? '...' : summary ? `₹${formatNumber(summary.totalStockValue)}` : '₹0'}
                </p>
              </div>
              <div className="rounded-full bg-[var(--success-tint)] p-3 text-[var(--success)]">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="surface-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">Low stock items</p>
                <p className="mt-4 text-3xl font-semibold text-[var(--error)]">
                  {loading ? '...' : formatNumber(summary?.lowStockCount ?? 0)}
                </p>
              </div>
              <div className="rounded-full bg-[var(--error-tint)] p-3 text-[var(--error)]">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Recent Installations */}
            <div className="surface-card overflow-hidden p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-[var(--foreground)]">Recent installations</h2>
                  <p className="mt-2 text-sm text-[var(--muted)]">Latest field updates and schedule status.</p>
                </div>
                <Link href="/installations" className="neutral-button">
                  View all
                </Link>
              </div>

              <div className="mt-6 overflow-x-auto">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="skeleton h-16 w-full rounded-[1.25rem]" />
                    ))}
                  </div>
                ) : recentInstallations.length === 0 ? (
                  <div className="py-12 text-center text-[var(--muted)]">
                    <Wrench className="mx-auto h-12 w-12 opacity-40" />
                    <p className="mt-3">No installations yet</p>
                  </div>
                ) : (
                  <table className="min-w-full border-separate border-spacing-y-3 text-left text-sm">
                    <tbody>
                      {recentInstallations.map((row) => (
                        <tr key={row._id} className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface)]">
                          <td className="px-5 py-4 font-semibold text-[var(--foreground)]">
                              {row.customerNameSnapshot || 'Installation'}
                          </td>
                          <td className="px-5 py-4 text-[var(--muted)]">
                            {row.customerPhoneSnapshot || '—'}
                          </td>
                          <td className="px-5 py-4 text-[var(--muted)]">
                            {row.installDate ? new Date(row.installDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                          </td>
                          <td className="px-5 py-4">
                            {(() => {
                              const s = installationStatusStyle(row.status);
                              return <span className={`badge-pill ${s.className}`}>{s.label}</span>;
                            })()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* PM Surya Ghar Scheme Info */}
            <div className="surface-card overflow-hidden p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="relative h-12 w-12 overflow-hidden rounded-full">
                  <img
                    src="/sulekha_engineering_logo.jpeg"
                    alt="PM Surya Ghar"
                    className="h-full w-full object-contain"
                    width={48}
                    height={48}
                  />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[var(--foreground)]">PM Surya Ghar Muft Bijli Yojana</h2>
                  <p className="text-sm text-[var(--muted)]">Government of India Initiative</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                {SCHEME_STATS.map((stat) => (
                  <div key={stat.label} className="rounded-[1.5rem] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4 text-center">
                    <p className="text-2xl font-semibold text-[var(--primary-active)]">{stat.value}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-[1.5rem] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-5">
                <h3 className="font-semibold text-[var(--foreground)]">About the Scheme</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                  PM Surya Ghar Muft Bijli Yojana aims to provide free electricity up to 300 units per month
                  to households through rooftop solar installations. Under this scheme, beneficiaries receive
                  central financial assistance of up to 60% for systems up to 6 kW capacity. The scheme also
                  enables solar panel manufacturing, creates jobs, and promotes clean energy adoption across India.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="badge-pill bg-[var(--primary-tint)] text-[var(--primary-active)]">Rooftop Solar</span>
                  <span className="badge-pill bg-[var(--success-tint)] text-[var(--success)]">Free Electricity</span>
                  <span className="badge-pill bg-[var(--primary-tint)] text-[var(--primary-active)]">60% Subsidy</span>
                  <span className="badge-pill bg-[var(--success-tint)] text-[var(--success)]">Clean Energy</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <aside className="space-y-6">
            {/* Stock Alerts */}
            <div className="surface-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <PackageX className="h-5 w-5 text-[var(--error)]" />
                <h2 className="text-xl font-semibold text-[var(--foreground)]">Stock alerts</h2>
              </div>
              <p className="mt-2 text-sm text-[var(--muted)]">Prioritize procurement for the next installation cycle.</p>
              <div className="mt-5 space-y-3">
                {loading ? (
                  [1, 2, 3].map(i => (
                    <div key={i} className="skeleton h-16 w-full rounded-[1.5rem]" />
                  ))
                ) : lowStock.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">All materials are adequately stocked.</p>
                ) : (
                  lowStock.map((item) => (
                    <div key={item._id} className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[var(--foreground)]">{item.name}</p>
                          <p className="mt-1 text-sm text-[var(--muted)]">
                            {item.currentStock} / {item.minimumStockLevel} {item.unit}
                          </p>
                        </div>
                        <span className="badge-pill bg-[rgba(183,43,40,0.12)] text-[var(--error)]">
                          Low
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <Link href="/materials?lowStock=true" className="mt-4 block text-center text-sm font-medium text-[var(--primary-active)] hover:underline">
                View all low stock items
              </Link>
            </div>

            {/* News & Updates */}
            <div className="surface-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="h-5 w-5 text-[var(--primary)]" />
                <h2 className="text-xl font-semibold text-[var(--foreground)]">PM Surya Ghar Updates</h2>
              </div>
              <div className="space-y-4">
                {PM_SURYAAHAR_NEWS.map((news) => (
                  <div key={news.id} className="rounded-[1.5rem] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--foreground)]">{news.title}</p>
                        <p className="mt-1 text-xs text-[var(--muted-soft)]">{news.summary}</p>
                        <p className="mt-2 text-xs text-[var(--muted-soft)]">
                          {news.source} • {new Date(news.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="surface-card p-6">
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Quick actions</h2>
              <div className="mt-5 grid gap-3">
                <Link href="/customers" className="neutral-button w-full text-center">
                  Review customers
                </Link>
                <Link href="/installations" className="neutral-button w-full text-center">
                  View installations
                </Link>
                <Link href="/materials" className="neutral-button w-full text-center">
                  Manage stock
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function formatNumber(value: number | string | undefined): string {
  if (value == null) return '0';
  const numeric = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(numeric)) return '0';
  return new Intl.NumberFormat('en-IN').format(numeric);
}


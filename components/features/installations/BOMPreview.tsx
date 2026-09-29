'use client';

import { useMemo, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { toast } from 'sonner';
import type { BomVariant } from '@/lib/api/installations.api';
import { ROOF_TYPE_LABEL } from './installationStatus';
import { formatNumber } from '@/lib/format';
import { downloadBlob } from '@/lib/downloadBlob';
import type { SuggestedBOMSection } from '@/types/installation';

/** A flat, stable row model built from the suggested BOM sections. */
interface BomRow {
  key: string;
  section: string;
  sectionOrder: number;
  materialName: string;
  materialCode: string;
  unit: string;
  quantity: number;
  remark?: string;
  currentStock?: number;
}

interface BOMPreviewProps {
  installationId: string;
  customer?: { name?: string; phone?: string; address?: string; city?: string; state?: string; pincode?: string; gstNumber?: string } | null;
  projectNo?: string;
  quotationNo?: string;
  systemSizeKW: number;
  roofType: string;
  sections: SuggestedBOMSection[];
  variant?: BomVariant;
  onDownload?: (() => void | Promise<void>) | null;
}

/** Render a quantity without trailing zeroes (matches the backend's formatQty). */
function formatQty(value: number): string {
  const rounded = Math.round(value * 1000) / 1000;
  return String(Number.isInteger(rounded) ? rounded : Number(rounded.toFixed(3)));
}

function flattenSections(sections: SuggestedBOMSection[]): BomRow[] {
  const rows: BomRow[] = [];
  sections.forEach((section, sectionIndex) => {
    const list = Array.isArray(section.items) ? section.items : [];
    list.forEach((item, itemIndex) => {
      rows.push({
        key: `${sectionIndex}-${itemIndex}`,
        section: section.section,
        sectionOrder: section.order ?? sectionIndex,
        materialName: item.materialName ?? 'Unknown material',
        materialCode: item.materialCode ?? '—',
        unit: item.unit ?? 'pcs',
        quantity: item.quantity ?? 0,
        remark: item.remark,
        currentStock: item.currentStock,
      });
    });
  });
  return rows;
}

function printBOMSheet() {
  window.print();
}

export function BOMPreview({
  installationId: _installationId,
  customer,
  projectNo,
  quotationNo,
  systemSizeKW,
  roofType,
  sections,
  variant = 'suggested',
  onDownload = null,
}: BOMPreviewProps) {
  const rows = useMemo(() => flattenSections(sections), [sections]);

  // Editable quantities keyed by row key. Initialised from the sections once;
  // remount (via a `key` prop) when the sections change to reset edits.
  const [edits, setEdits] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    rows.forEach((row) => {
      initial[row.key] = row.quantity;
    });
    return initial;
  });

  const qtyOf = (row: BomRow) => edits[row.key] ?? row.quantity;

  const setQty = (key: string, value: string) => {
    const parsed = Number(value);
    setEdits((prev) => ({ ...prev, [key]: Number.isFinite(parsed) ? parsed : 0 }));
  };

  // Group rows into ordered sections for both the editor and the print sheet.
  const groups = useMemo(() => {
    const map = new Map<number, BomRow[]>();
    rows.forEach((row) => {
      const arr = map.get(row.sectionOrder) ?? [];
      arr.push(row);
      map.set(row.sectionOrder, arr);
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [rows]);

  const handleDownload = async () => {
    try {
      if (onDownload) {
        await onDownload();
        return;
      }
      // Fallback: fetch the suggested PDF from the server.
      const { installationsApi } = await import('@/lib/api/installations.api');
      const buffer = await installationsApi.getBomPdf(_installationId, variant);
      downloadBlob(buffer, `BOM-${_installationId}-${variant}.pdf`);
      toast.success('BOM downloaded');
    } catch {
      toast.error('Could not download BOM');
    }
  };

  const totalItems = rows.length;
  const roofLabel = ROOF_TYPE_LABEL[roofType] ?? roofType;
  const requirement = `${formatNumber(systemSizeKW)} KW ${roofLabel} System`;
  const fullAddress = [customer?.address, customer?.city, customer?.state, customer?.pincode]
    .filter(Boolean)
    .join(', ');

  return (
    <>
      <style>{`
        @media screen { .print-only { display: none !important; } }
        @media print {
          @page { size: A4; margin: 8mm 10mm 8mm 8mm; }
          body * { visibility: hidden !important; }
          .print-only, .print-only * { visibility: visible !important; }
          .print-only { position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0; }
          .screen-only { display: none !important; }
        }
      `}</style>

      {/* ===== On-screen editable review (hidden in print) ===== */}
      <div className="screen-only space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Suggested BOM</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {totalItems} items across {groups.length} sections. Adjust quantities below — nothing is deducted
              from stock until you confirm actual usage.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="neutral-button" onClick={printBOMSheet}>
              <Printer className="h-4 w-4" />
              Print BOM
            </button>
            <button type="button" className="brand-button" onClick={() => void handleDownload()}>
              <Download className="h-4 w-4" />
              Download PDF
            </button>
          </div>
        </div>

        {groups.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No suggested materials were generated.</p>
        ) : (
          groups.map(([order, sectionRows]) => (
            <div key={order} className="overflow-hidden rounded-2xl border border-[var(--border)]">
              <div className="flex items-center justify-between bg-[var(--surface-muted)] px-5 py-3">
                <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--foreground)]">
                  {sectionRows[0]?.section ?? 'Section'}
                </h4>
                <span className="text-xs text-[var(--muted)]">{sectionRows.length} items</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                   <thead className="table-head">
                     <tr className="text-xs uppercase tracking-[0.12em] text-[var(--muted-soft)]">
                      <th className="px-5 py-3 font-semibold">Item</th>
                      <th className="hidden px-3 py-3 font-semibold md:table-cell">Code</th>
                      <th className="hidden px-3 py-3 font-semibold sm:table-cell">UOM</th>
                      <th className="px-3 py-3 text-right font-semibold">Qty</th>
                      <th className="hidden px-5 py-3 font-semibold md:table-cell">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectionRows.map((row) => {
                      const stock = row.currentStock;
                      const lowStock = stock != null && qtyOf(row) > stock;
                      return (
                        <tr key={row.key} className="border-b border-[var(--border-soft)] last:border-0">
                          <td className="px-5 py-3">
                            <p className="font-medium text-[var(--foreground)]">{row.materialName}</p>
                            {row.remark && <p className="mt-0.5 text-xs text-[var(--muted)]">{row.remark}</p>}
                          </td>
                          <td className="hidden px-3 py-3 font-mono text-xs text-[var(--muted-soft)] md:table-cell">
                            {row.materialCode}
                          </td>
                          <td className="hidden px-3 py-3 text-xs text-[var(--muted)] sm:table-cell">{row.unit}</td>
                          <td className="px-3 py-3 text-right">
                            <input
                              type="number"
                              min={0}
                              step="any"
                              className="form-input w-24 !py-1.5 text-right"
                              value={qtyOf(row)}
                              onChange={(e) => setQty(row.key, e.target.value)}
                              aria-label={`Quantity for ${row.materialName}`}
                            />
                          </td>
                          <td className="hidden px-5 py-3 md:table-cell">
                            {stock != null ? (
                              <span className={lowStock ? 'text-xs font-semibold text-[var(--error)]' : 'text-xs text-[var(--muted)]'}>
                                {lowStock ? `Low (${formatNumber(stock)})` : formatNumber(stock)}
                              </span>
                            ) : (
                              <span className="text-xs text-[var(--muted-soft)]">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}

        {groups.some(([, sectionRows]) =>
          sectionRows.some((row) => {
            const stock = row.currentStock;
            return stock != null && qtyOf(row) > stock;
          })
        ) && (
          <p className="text-sm font-medium text-[var(--error)]">
            Some quantities exceed current stock. Reduce them or confirm on site only after rechecking stock.
          </p>
        )}
      </div>

      {/* ===== Printable A4 sheet (visible only in print) ===== */}
      <div className="print-only" id="bom-print-area">
        <div
          style={{
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            color: '#0F2A1B',
            fontSize: '7.8px',
            lineHeight: '1.3',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0B7A3D', paddingBottom: '6px', marginBottom: '8px' }}>
            <div>
              <div style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '0.05em' }}>SULEKHA ENGINEERING</div>
              <div style={{ fontSize: '7.6px', color: '#4C6555', marginTop: '1px' }}>
                PM Surya Ghar Registered Vendor • Solar Power Plant
              </div>
              <div style={{ fontSize: '7.6px', color: '#4C6555', marginTop: '1px' }}>☎ +91 90000 00000</div>
            </div>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: '#0B7A3D',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: 800,
                letterSpacing: '0.02em',
              }}
            >
              SE
            </div>
          </div>

          {/* Job details */}
          <div style={{ border: '1px solid #C8E2D1', borderRadius: '3px', marginBottom: '8px' }}>
            <div style={{ background: '#EAF6EE', padding: '3px 6px', fontWeight: 700, fontSize: '7.8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Job Details
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px', padding: '4px 6px' }}>
              <div><strong>Project No:</strong> {projectNo || '—'}</div>
              <div><strong>Quotation No:</strong> {quotationNo || '—'}</div>
              <div><strong>Customer Name:</strong> {customer?.name || '—'}</div>
              <div><strong>GST Details:</strong> {customer?.gstNumber || '—'}</div>
              <div><strong>Requirement:</strong> {requirement}</div>
              <div><strong>Mobile No:</strong> {customer?.phone || '—'}</div>
              <div style={{ gridColumn: '1 / -1' }}>
                <strong>Shipping Address:</strong> {fullAddress || '—'}
              </div>
            </div>
          </div>

          {/* Material table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7.4px' }}>
            <thead>
              <tr>
                {['PART', 'SL NO', 'ITEM NAME', 'ITEM DESCRIPTION', 'UOM', 'TOTAL QTY', 'REMARK'].map((h) => (
                  <th
                    key={h}
                    style={{
                      border: '1px solid #064E27',
                      background: '#0B7A3D',
                      color: '#FFFFFF',
                      padding: '2px 4px',
                      textAlign: 'left',
                      fontSize: '7.2px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map(([order, sectionRows]) =>
                sectionRows.map((row, index) => (
                  <tr key={`${order}-${index}`}>
                    {index === 0 ? (
                      <td
                        rowSpan={sectionRows.length}
                        style={{ border: '1px solid #9DC3AC', padding: '2px 4px', fontWeight: 700, verticalAlign: 'top' }}
                      >
                        {row.section}
                      </td>
                    ) : null}
                    <td style={{ border: '1px solid #9DC3AC', padding: '2px 4px', textAlign: 'center' }}>{index + 1}</td>
                    <td style={{ border: '1px solid #9DC3AC', padding: '2px 4px', fontWeight: 600 }}>{row.materialName}</td>
                    <td style={{ border: '1px solid #9DC3AC', padding: '2px 4px' }}>{row.materialCode}</td>
                    <td style={{ border: '1px solid #9DC3AC', padding: '2px 4px' }}>{row.unit}</td>
                    <td style={{ border: '1px solid #9DC3AC', padding: '2px 4px', textAlign: 'center' }}>{formatQty(qtyOf(row))}</td>
                    <td style={{ border: '1px solid #9DC3AC', padding: '2px 4px' }}>{row.remark ?? ''}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

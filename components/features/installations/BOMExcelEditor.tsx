'use client';

import { useMemo, useState } from 'react';
import { Download, Printer, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { BOMRow } from '@/lib/utils/bomExcel';
import { buildMasterRows, qtyFor, MASTER_BOM } from '@/lib/utils/bomExcel';
import { generateBOMExcelClient, downloadBOMExcel } from '@/lib/utils/bomExcelClient';
import { installationsApi } from '@/lib/api/installations.api';
import { handleApiError } from '@/lib/errors/handleApiError';

interface BOMExcelEditorProps {
  installationId: string;
  systemSizeKW: number;
  customerName?: string;
  mobileNo?: string;
  projectNo?: string;
  quotationNo?: string;
  shippingAddress?: string;
  gstNumber?: string;
  roofType?: string;
  variant?: 'suggested' | 'final';
  materialsUsed?: any[];
  readonly?: boolean;
  onSave?: () => void;
}

export function BOMExcelEditor({
  installationId,
  systemSizeKW,
  customerName,
  mobileNo,
  projectNo,
  quotationNo,
  shippingAddress,
  gstNumber,
  roofType,
  variant = 'suggested',
  materialsUsed = [],
  readonly = false,
  onSave,
}: BOMExcelEditorProps) {
  const initialRows = useMemo(() => buildMasterRows(systemSizeKW, variant, materialsUsed), [systemSizeKW, variant, materialsUsed]);

  const [rows, setRows] = useState<BOMRow[]>(() =>
    initialRows.map((r) => ({ ...r, actualQty: r.actualQty ?? null, remark: r.remark || '' }))
  );
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await handleSaveActualUsage();
      setConfirmed(true);
    } finally {
      setSaving(false);
    }
  };

  const setQty = (serial: number, value: string) => {
    const parsed = Number(value);
    setRows((prev) =>
      prev.map((r) => (r.serial === serial ? { ...r, actualQty: Number.isFinite(parsed) ? parsed : null } : r))
    );
  };

  const setName = (serial: number, value: string) => {
    setRows((prev) =>
      prev.map((r) => (r.serial === serial ? { ...r, name: value } : r))
    );
  };

  const setDesc = (serial: number, value: string) => {
    setRows((prev) =>
      prev.map((r) => (r.serial === serial ? { ...r, desc: value } : r))
    );
  };

  const setRemark = (serial: number, value: string) => {
    setRows((prev) =>
      prev.map((r) => (r.serial === serial ? { ...r, remark: value } : r))
    );
  };

  const resetToSuggested = () => {
    const fresh = buildMasterRows(systemSizeKW, 'suggested', []);
    setRows(fresh.map((r) => ({ ...r, actualQty: null, remark: '' })));
    toast.success('Quantities reset to suggested values');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadExcel = async () => {
    try {
      const wb = await generateBOMExcelClient(rows, {
        customerName: customerName || '—',
        mobileNo: mobileNo || '—',
        projectNo,
        quotationNo,
        requirement: `${systemSizeKW} KW ${roofType ? roofType.replace(/_/g, ' ').toUpperCase() : ''} System`,
        shippingAddress: shippingAddress || '—',
        gstNumber,
      });
      const safeName = (customerName || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');
      downloadBOMExcel(wb, `${safeName}_BOM_List.xlsx`);
      toast.success('Excel downloaded');
    } catch (err) {
      toast.error('Could not download Excel', { description: handleApiError(err) });
    }
  };

  const handleSaveActualUsage = async () => {
    setSaving(true);
    try {
      const items = rows
        .filter((r) => (r.actualQty ?? 0) > 0)
        .map((r) => ({
          material: r.name,
          qty: r.actualQty ?? 0,
          remark: r.remark || '',
        }));

      if (items.length === 0) {
        toast.error('No quantities to save');
        return;
      }

      await installationsApi.assignMaterials(installationId, { items });
      toast.success('Actual usage saved and stock updated');
      onSave?.();
    } catch (err) {
      toast.error('Could not save actual usage', { description: handleApiError(err) });
    } finally {
      setSaving(false);
    }
  };

  const roofLabel = roofType ? roofType.replace(/_/g, ' ').toUpperCase() : '';

  return (
    <>
      <style>{`
        @media screen { .print-only { display: none !important; } }
        @media print {
          @page { size: A4 portrait; margin: 5mm 6mm 5mm 6mm; }
          body * { visibility: hidden !important; }
          .print-only, .print-only * { visibility: visible !important; }
          .print-only { position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0; }
          .screen-only { display: none !important; }
        }
      `}</style>

      {/* Screen-only toolbar */}
      <div className="screen-only mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-[var(--foreground)]">
            {confirmed ? 'Final BOM (As Built)' : variant === 'final' ? 'Final BOM (As Built)' : 'Suggested BOM (For Site)'}
          </h3>
          <p className="text-sm text-[var(--muted)]">
            {confirmed
              ? 'BOM is finalized and stock has been updated based on actual usage.'
              : rows.length} items. {confirmed ? '' : 'Edit quantities as needed. Print or download Excel for the technician.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="ghost-button" onClick={resetToSuggested}>
            Reset
          </button>
          <button type="button" className="neutral-button" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            Print
          </button>
          <button type="button" className="neutral-button" onClick={handleDownloadExcel}>
            <Download className="h-4 w-4" />
            Excel
          </button>
          {!readonly && !confirmed && (
            <button type="button" className="brand-button" onClick={handleConfirm} disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? 'Saving…' : 'Confirm & Update Stock'}
            </button>
          )}
          {!readonly && variant === 'final' && !confirmed && (
            <button type="button" className="brand-button" onClick={handleSaveActualUsage} disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? 'Saving…' : 'Update Actual Usage'}
            </button>
          )}
        </div>
      </div>

      {/* Editable on-screen table */}
      <div className="screen-only overflow-hidden rounded-2xl border border-[var(--border)]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
             <thead className="table-head">
               <tr className="text-xs uppercase tracking-[0.12em] text-[var(--muted-soft)]">
                <th className="px-3 py-2.5 font-semibold" style={{ width: '10%' }}>PART</th>
                <th className="px-2 py-2.5 font-semibold text-center" style={{ width: '4%' }}>SL</th>
                <th className="px-3 py-2.5 font-semibold" style={{ width: '22%' }}>ITEM NAME</th>
                <th className="px-3 py-2.5 font-semibold" style={{ width: '24%' }}>DESCRIPTION</th>
                <th className="px-2 py-2.5 font-semibold text-center" style={{ width: '7%' }}>UOM</th>
                <th className="px-3 py-2.5 font-semibold text-right" style={{ width: '10%' }}>TOTAL QTY</th>
                <th className="px-3 py-2.5 font-semibold" style={{ width: '15%' }}>REMARK</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.serial} className="border-b border-[var(--border-soft)] last:border-0 hover:bg-[var(--surface-muted)]">
                  <td className="px-3 py-2 align-top text-xs font-semibold text-[var(--foreground)]" rowSpan={1}>
                    {row.section}
                  </td>
                  <td className="px-2 py-2 text-center text-xs text-[var(--muted)]">{row.serial}</td>
                  <td className="px-3 py-2">
                    {readonly ? (
                      <span className="text-xs text-[var(--foreground)]">{row.name}</span>
                    ) : (
                      <input
                        className="form-input !py-1.5 text-xs"
                        value={row.name}
                        onChange={(e) => setName(row.serial, e.target.value)}
                      />
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {readonly ? (
                      <span className="text-xs text-[var(--muted)]">{row.desc}</span>
                    ) : (
                      <input
                        className="form-input !py-1.5 text-xs"
                        value={row.desc}
                        onChange={(e) => setDesc(row.serial, e.target.value)}
                      />
                    )}
                  </td>
                  <td className="px-2 py-2 text-center text-xs text-[var(--muted)]">{row.uom}</td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      className="form-input !py-1.5 text-right text-xs"
                      value={row.actualQty ?? ''}
                      onChange={(e) => setQty(row.serial, e.target.value)}
                      readOnly={readonly}
                      placeholder=" "
                    />
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {readonly ? (
                      <span className="text-[var(--muted)]">{row.remark || ''}</span>
                    ) : (
                      <input
                        className="form-input !py-1.5 text-xs"
                        value={row.remark}
                        onChange={(e) => setRemark(row.serial, e.target.value)}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable A4 sheet */}
      <div className="print-only" id="bom-excel-print-area">
        <div
          style={{
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            color: '#0F2A1B',
            fontSize: '7.8px',
            lineHeight: '1.3',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '2px solid #0B7A3D',
              paddingBottom: '6px',
              marginBottom: '8px',
            }}
          >
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
            <div
              style={{
                background: '#EAF6EE',
                padding: '3px 6px',
                fontWeight: 700,
                fontSize: '7.8px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Job Details
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px', padding: '4px 6px' }}>
              <div>
                <strong>Project No:</strong> {projectNo || '—'}
              </div>
              <div>
                <strong>Quotation No:</strong> {quotationNo || '—'}
              </div>
              <div>
                <strong>Customer Name:</strong> {customerName || '—'}
              </div>
              <div>
                <strong>GST Details:</strong> {gstNumber || '—'}
              </div>
              <div>
                <strong>Requirement:</strong> {systemSizeKW} KW {roofLabel} System
              </div>
              <div>
                <strong>Mobile No:</strong> {mobileNo || '—'}
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <strong>Shipping Address:</strong> {shippingAddress || '—'}
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
                      color: '#fff',
                      padding: '2px 4px',
                      fontWeight: 700,
                      textAlign: 'center',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const isFirstInSection = index === 0 || rows[index - 1].section !== row.section;
                return (
                  <tr key={row.serial}>
                    {isFirstInSection ? (
                      <td
                        rowSpan={rows.slice(index).filter((r) => r.section === row.section).length}
                        style={{
                          border: '1px solid #9DC3AC',
                          padding: '2px 4px',
                          fontWeight: 700,
                          verticalAlign: 'top',
                        }}
                      >
                        {row.section}
                      </td>
                    ) : null}
                    <td style={{ border: '1px solid #9DC3AC', padding: '2px 4px', textAlign: 'center' }}>{row.serial}</td>
                    <td style={{ border: '1px solid #9DC3AC', padding: '2px 4px', fontWeight: 600 }}>{row.name}</td>
                    <td style={{ border: '1px solid #9DC3AC', padding: '2px 4px' }}>{row.desc}</td>
                    <td style={{ border: '1px solid #9DC3AC', padding: '2px 4px', textAlign: 'center' }}>{row.uom}</td>
                    <td
                      style={{
                        border: '1px solid #9DC3AC',
                        padding: '2px 4px',
                        textAlign: 'center',
                        fontWeight: 700,
                        color: '#B33A2E',
                      }}
                    >
                      {row.actualQty ?? row.qty}
                    </td>
                    <td style={{ border: '1px solid #9DC3AC', padding: '2px 4px' }}>{row.remark || ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', alignItems: 'flex-end' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid #999', width: '110px', paddingTop: '1px', fontSize: '7px', color: '#555' }}>
              Prepared By
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid #999', width: '110px', paddingTop: '1px', fontSize: '7px', color: '#555' }}>
              Authorized Signatory
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

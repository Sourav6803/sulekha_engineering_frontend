import type { SortOrder } from '@/components/shared/DataTable';
import type { BOMTemplateDocument, RoofType } from '@/types/bomTemplate';

const ROOF_LABEL: Record<string, string> = {
  rcc_rooftop: 'RCC Rooftop',
  tin_shed: 'Tin Shed',
  ground_mount: 'Ground Mount',
};

interface BOMTemplateTableProps {
  templates: BOMTemplateDocument[];
  loading: boolean;
  sortBy: string;
  sortOrder: SortOrder;
  onSort: (sortBy: string, sortOrder: SortOrder) => void;
  onEdit?: (tpl: BOMTemplateDocument) => void;
  onDelete?: (tpl: BOMTemplateDocument) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  emptyAction?: React.ReactNode;
}

export function BOMTemplateTable({
  templates,
  loading,
  sortBy,
  sortOrder,
  onSort,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
  emptyAction,
}: BOMTemplateTableProps) {
  const handleSort = (column: string) => {
    if (sortBy === column) {
      onSort(column, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSort(column, 'asc');
    }
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return null;
    return <span className="ml-1 text-[var(--primary)]">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  const materialName = (tpl: BOMTemplateDocument): string => {
    if (typeof tpl.material === 'object' && tpl.material?.name) return tpl.material.name;
    return '—';
  };

  const materialCode = (tpl: BOMTemplateDocument): string => {
    if (typeof tpl.material === 'object' && tpl.material?.materialCode) return tpl.material.materialCode;
    return '—';
  };

  const formulaLabel = (tpl: BOMTemplateDocument): string => {
    const f = tpl.qtyFormula;
    if (!f) return '—';
    switch (f.type) {
      case 'fixed':
        return `Fixed: ${f.value}`;
      case 'per_kw':
        return `${f.value} × kW`;
      case 'linear':
        return `${f.value} × kW + ${f.minQty ?? 0}`;
      case 'step':
        return `Step (${f.stepSizes?.length ?? 0} ranges)`;
      default:
        return f.type;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border-soft)] text-[var(--muted)]">
            <th className="pb-3 pl-4 pr-3">
              <button type="button" className="flex items-center font-medium" onClick={() => handleSort('templateName')}>
                Name <SortIcon column="templateName" />
              </button>
            </th>
            <th className="pb-3 px-3">
              <button type="button" className="flex items-center font-medium" onClick={() => handleSort('roofType')}>
                Roof Type <SortIcon column="roofType" />
              </button>
            </th>
            <th className="pb-3 px-3">
              <button type="button" className="flex items-center font-medium" onClick={() => handleSort('systemSizeKW')}>
                Size (kW) <SortIcon column="systemSizeKW" />
              </button>
            </th>
            <th className="pb-3 px-3">
              <button type="button" className="flex items-center font-medium" onClick={() => handleSort('section')}>
                Section <SortIcon column="section" />
              </button>
            </th>
            <th className="pb-3 px-3">Material</th>
            <th className="pb-3 px-3">Formula</th>
            <th className="pb-3 px-3 text-right">
              <button type="button" className="flex items-center justify-end font-medium" onClick={() => handleSort('priority')}>
                Priority <SortIcon column="priority" />
              </button>
            </th>
            <th className="pb-3 px-3 text-center">Optional</th>
            {(canEdit || canDelete) && (
              <th className="pb-3 pr-4 pl-3 text-right">Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {loading && templates.length === 0 && (
            <tr>
              <td colSpan={canEdit || canDelete ? 9 : 8} className="py-10 text-center text-sm text-[var(--muted)]">
                Loading templates…
              </td>
            </tr>
          )}
          {!loading && templates.length === 0 && (
            <tr>
              <td colSpan={canEdit || canDelete ? 9 : 8}>
                <div className="py-10 text-center">
                  <p className="text-sm text-[var(--muted)]">No BOM templates found.</p>
                  {emptyAction && <div className="mt-3">{emptyAction}</div>}
                </div>
              </td>
            </tr>
          )}
          {templates.map((tpl) => (
            <tr
              key={tpl._id}
              className="border-b border-[var(--border-soft)] last:border-0 hover:bg-[var(--surface-muted)]"
            >
              <td className="whitespace-nowrap py-3 pl-4 pr-3 font-medium text-[var(--foreground)]">{tpl.templateName}</td>
              <td className="whitespace-nowrap px-3">
                <span className="inline-flex rounded-full bg-[var(--surface-muted)] px-2.5 py-0.5 text-xs font-medium text-[var(--foreground)]">
                  {ROOF_LABEL[tpl.roofType] ?? tpl.roofType}
                </span>
              </td>
              <td className="whitespace-nowrap px-3">{tpl.systemSizeKW} kW</td>
              <td className="whitespace-nowrap px-3">{tpl.section}</td>
              <td className="whitespace-nowrap px-3">
                <span className="block text-[var(--foreground)]">{materialName(tpl)}</span>
                <span className="text-xs text-[var(--muted-soft)]">{materialCode(tpl)}</span>
              </td>
              <td className="whitespace-nowrap px-3 text-xs text-[var(--muted)]">{formulaLabel(tpl)}</td>
              <td className="whitespace-nowrap px-3 text-right">{tpl.priority ?? 1}</td>
              <td className="whitespace-nowrap px-3 text-center">
                {tpl.isOptional ? (
                  <span className="text-[var(--warning)]">Yes</span>
                ) : (
                  <span className="text-[var(--success)]">No</span>
                )}
              </td>
              {(canEdit || canDelete) && (
                <td className="whitespace-nowrap py-3 pr-4 pl-3 text-right text-sm">
                  {canEdit && (
                    <button
                      type="button"
                      className="ghost-button mr-2"
                      onClick={() => onEdit?.(tpl)}
                    >
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      className="ghost-button !text-[var(--error)]"
                      onClick={() => onDelete?.(tpl)}
                    >
                      Delete
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

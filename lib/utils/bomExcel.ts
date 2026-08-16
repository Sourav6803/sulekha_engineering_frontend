import type { RoofType } from '@/types/customer';

export type FormulaType = 'fixed' | 'per_kw' | 'linear' | 'step';

export interface QtyFormulaStep {
  fromKW: number;
  toKW: number;
  qty: number;
}

export interface QtyFormula {
  type: FormulaType;
  value: number;
  minQty?: number;
  maxQty?: number;
  stepSizes?: QtyFormulaStep[];
}

export interface BOMRow {
  serial: number;
  section: string;
  name: string;
  desc: string;
  uom: string;
  remark: string;
  qty: number;
  actualQty?: number | null;
}

export interface BOMSection {
  title: string;
  items: Array<[string, string, string, string, string | number]>;
}

export const MASTER_BOM: BOMSection[] = [
  {
    title: '1. SPV MODULE',
    items: [
      ['Adani Topcon -DCR', '620 Wp', 'nos', '', 'n'],
    ],
  },
  {
    title: '2. INVERTER',
    items: [
      ['SOLAR STRING INVERTERS (Microtek)', 'PVB Link 3.3 kWp - 1 ph', 'nos', '', 1],
    ],
  },
  {
    title: '3. RCC STRUCTURE (Man hight structure)',
    items: [
      ['LEG (FRONT)-80CS40X15X2', '2060 mm', 'nos', 'Modification Required', 'n'],
      ['LEG (BACK)-80CS40X15X2', '2704 mm', 'nos', 'Modification Required', 'n'],
      ['RAFTER-60CS40X15X2', '4100 mm', 'nos', '', 'n'],
      ['FRONT BRACING -ISA50X50X5', '1330 mm', 'nos', 'Modification Required', 'n'],
      ['BACK BRACING -ISA50X50X5', '1297 mm', 'nos', 'Modification Required', 'n'],
      ['Purlin [SQ. TUBE]', '3600 mm', 'nos', '', 'n'],
      ['Nut-Bolt-Double Washer', 'M10X25', 'nos', '', 'n8'],
      ['Star Nut Bolt Washer', 'M10X100', 'nos', '', 'n4'],
      ['U CLAMP', 'M8', 'nos', '', 'n2'],
      ['Mid Clamp [75 LONG]', '25 mm', 'nos', '', 'mid'],
      ['End Clamp[75 LONG]', '30 mm', 'nos', '', 'end'],
      ['NUT PLATE', '30 mm', 'nos', '', 'n'],
      ['DR. FIXIT', '200 ml', 'nos', '', 1],
      ['GROUTED CHEMICAL', '', 'nos', '', 1],
    ],
  },
  {
    title: '4. DC PART',
    items: [
      ['DCDB', '1 in 1 out (600V SPD)', 'nos', '', 1],
      ['DC CABLE', '4 Sq mm 1 Core Type-1', 'mtr', '', 'm20'],
      ['MC4 CONNECTOR', '(M+F)', 'pair', '', 'n2'],
      ['RING LUG', '4 - 6 mm', 'nos', '', 'n2'],
      ['PIN LUG', '4 - 6 mm', 'nos', '', 'n2'],
      ['MMS PVC PIPE', '25 mm 3 mtr', 'nos', '', 'm4'],
      ['CHINA SHADDLE', '25mm', 'nos', '', 'm6'],
      ['PVC TEE', '25mm', 'nos', '', 'm3'],
      ['PVC ELBOW', '25mm', 'nos', '', 'm4'],
    ],
  },
  {
    title: '5. AC PART',
    items: [
      ['ACDB', '1 phase (16 amp)', 'nos', '', 1],
      ['AC CABLE', '4 sq mm 2 core ALU armoured', 'mtr', '', 'm15'],
      ['CHINA SHADDLE', '14 mm', 'packet', '', 2],
      ['RING LUG', '10mm', 'nos', '', 4],
      ['PIN LUG', '10 mm', 'nos', '', 4],
      ['BUSBAR (1PH / 3PH) WITH BOX', '1ph', 'nos', '', 1],
      ['PVC CABLE TRAY', '45 x 45', 'nos', '', 'm3'],
      ['MCB', '32 amp 2 Pole', 'nos', '', 1],
      ['MCB ENCLOSER', 'PVC', 'nos', '', 1],
      ['AC CABLE', '4 SQ MM AC CABLE 2 CORE Cu', 'mtr', '', 'm8'],
      ['LA', '1 mtr coper', 'nos', '', 1],
    ],
  },
  {
    title: '6. EARTHING PART 1',
    items: [
      ['MS Angke for Extension [ISA25x25x5]', 'ISA 25x25x5', 'mtr', 'LA Extension', 'm3'],
      ['Insulated Pipe (FRP Material)', '1/2 inch Dia FRP material', 'mm', '', 2],
      ['Nut Bolt Washer (M6X40)', 'M6x40mm', 'nos', '', 8],
      ['Self thread screw', '2 inch', 'nos', '', 8],
      ['LA INSULATOR', 'Big', 'nos', '', 2],
      ['EARTHING CABLE', '6 Sq mm Cu 1 core', 'mtr', '', 'm6'],
      ['EARTHING CABLE', '16 Sq mm Cu 1 core', 'mtr', '', 'm6'],
      ['EARTHING ROD', 'CU bounded 2 mtr 16 mm', 'nos', '', 2],
      ['EARTHING PIT COVER', 'PVC Small', 'nos', '', 2],
      ['EARTHING BUS Bar', '4 hole', 'nos', '', 2],
    ],
  },
  {
    title: '7. EARTHING PART 2',
    items: [
      ['GI STRIP', '19x3', 'kg', '', 'm5'],
      ['PVC INSULATOR', 'Flat', 'nos', '', 4],
      ['BUSBAR NUT BOLT WASHER', 'SS M8 x 30', 'nos', '', 8],
      ['GI STRIP JOINT NUT BOLT WASHER', 'SS M6 x 25', 'nos', '', 8],
      ['BFC', '25 kg', 'bag', '', 2],
    ],
  },
  {
    title: '8. MISCELLANEOUS',
    items: [
      ['CABLE TIE', 'PVC 200mm uv protected', 'packet', '', 2],
      ['SCREW', 'SS 8 x 35', 'nos', '', 'n10'],
      ['Cleaning Brush', '6 Mtr.', 'nos', '', 1],
      ['Zink Spray', '', 'nos', '', 2],
      ['PVC TAPE - (R,G,B)', 'R 1 G 1 B 1', 'nos', '', 3],
      ['WOODEN GUJI', 'WOODEN', 'packet', '', 2],
    ],
  },
  {
    title: '9. STICKER',
    items: [
      ['SLD STICKER', '', 'nos', '', 1],
      ['SULEKHA LOGO STICKER', '', 'nos', '', 1],
      ['EARTHING STICKER', '', 'nos', '', 1],
      ['PVC casing pin', '', 'nos', '', 'n4'],
      ['DANGER STICKER', '', 'nos', '', 1],
    ],
  },
];

export function qtyFor(systemSizeKW: number, key: string | number): number {
  const kW = Number(systemSizeKW) || 0;
  const n = Math.max(1, Math.round((kW * 1000) / 620));

  if (typeof key === 'number') return key;
  switch (key) {
    case 'n': return n;
    case 'n2': return n * 2;
    case 'n4': return n * 4;
    case 'n8': return n * 8;
    case 'n10': return n * 10;
    case 'mid': return Math.max(0, (n - 1) * 2);
    case 'end': return 4;
    case 'm': return Math.max(1, Math.ceil(kW));
    case 'm3': return Math.max(1, Math.ceil(kW * 3));
    case 'm4': return Math.max(1, Math.ceil(kW * 4));
    case 'm5': return Math.max(1, Math.ceil(kW * 5));
    case 'm6': return Math.max(1, Math.ceil(kW * 6));
    case 'm8': return Math.max(1, Math.ceil(kW * 8));
    case 'm15': return Math.max(1, Math.ceil(kW * 15));
    case 'm20': return Math.max(1, Math.ceil(kW * 20));
    default: return 1;
  }
}

export function buildMasterRows(systemSizeKW: number, variant: 'suggested' | 'final' = 'suggested', materialsUsed: any[] = []): BOMRow[] {
  const rows: BOMRow[] = [];
  let serial = 0;

  const used = Array.isArray(materialsUsed) ? materialsUsed.filter(u => u.status !== 'reversed') : [];

  if (used.length > 0) {
    for (const usage of used) {
      serial += 1;
      const materialObj = typeof usage.material === 'object' && usage.material !== null ? usage.material : {};
      const section = materialObj.category || 'USED MATERIALS';
      rows.push({
        serial,
        section,
        name: usage.materialNameSnapshot || materialObj.name || '',
        desc: usage.descriptionSnapshot || materialObj.description || '',
        uom: usage.unitSnapshot || materialObj.unit || 'nos',
        remark: usage.remark || '',
        qty: 0,
        actualQty: usage.qty,
      });
    }
    return rows;
  }

  const usageByKey = new Map<string, any>();

  if (Array.isArray(materialsUsed) && materialsUsed.length > 0) {
    for (const usage of materialsUsed) {
      if (usage.status === 'reversed') continue;
      const code = String(usage.materialCodeSnapshot || '').toLowerCase();
      const name = String(usage.materialNameSnapshot || '').toLowerCase();
      const desc = String(usage.descriptionSnapshot || '').toLowerCase();
      if (code) usageByKey.set(code, usage);
      if (name) usageByKey.set(name, usage);
      if (name && desc) usageByKey.set(`${name}|${desc}`, usage);
    }
  }

  for (const section of MASTER_BOM) {
    for (const [name, desc, uom, remark, qtyKey] of section.items) {
      serial += 1;
      const suggestedQty = qtyFor(systemSizeKW, qtyKey);
      let actualQty: number | undefined;
      let matchedDesc: string | undefined;

      if (usageByKey.size > 0) {
        const nameLower = name.toLowerCase();
        const descLower = desc.toLowerCase();

        let matched = usageByKey.get(`${nameLower}|${descLower}`);

        if (!matched) {
          matched = usageByKey.get(nameLower);
        }

        if (!matched) {
          for (const usage of usageByKey.values()) {
            const uname = String(usage.materialNameSnapshot || '').toLowerCase();
            if (uname && (nameLower.includes(uname) || uname.includes(nameLower))) {
              matched = usage;
              break;
            }
          }
        }

        if (matched && matched.qty != null) actualQty = matched.qty;
        if (matched && matched.descriptionSnapshot) matchedDesc = matched.descriptionSnapshot;
      }

      rows.push({
        serial,
        section: section.title,
        name,
        desc: matchedDesc || desc,
        uom,
        remark: remark || '',
        qty: suggestedQty,
        actualQty,
      });
    }
  }
  return rows;
}

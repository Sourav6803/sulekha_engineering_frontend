import ExcelJS from 'exceljs';

/** Column widths in Excel character units, columns A..G. */
const COLUMN_WIDTHS = [24, 6, 28, 26, 8, 10, 20];

/** Header row heights in points: rows 1 and 2 sit above the black BOM band. */
const HEADER_ROW_HEIGHTS_PT = [24, 14];

/** One character unit is 5.4pt wide on the default 11pt Calibri grid. */
const CHAR_UNIT_PT = 5.4;

/** Image anchors are written as EMU, and one point is 12700 EMU. */
const EMU_PER_PT = 12700;

const columnWidthPt = (width: number) => width * CHAR_UNIT_PT;

/** The table's own width - the logo must never reach past column G. */
const TABLE_WIDTH_PT = COLUMN_WIDTHS.reduce((sum, width) => sum + columnWidthPt(width), 0);

const HEADER_HEIGHT_PT = HEADER_ROW_HEIGHTS_PT.reduce((sum, height) => sum + height, 0);

/**
 * The source image is a 1024x1024 square, so the box stays square - the old
 * 70x50 box squashed it. Sized to the header so it always clears the black
 * "BOM LIST" band on row 3.
 */
const LOGO_SIZE_PT = HEADER_HEIGHT_PT - 2;
const LOGO_SIZE_PX = Math.round(LOGO_SIZE_PT / 0.75);

/**
 * Anchor for the logo: flush with the table's right edge, inside the header.
 *
 * The old anchor used column H, which begins past the table's right border, so
 * the whole logo printed outside the sheet. The offset is given in EMU because
 * ExcelJS writes `nativeColOff` straight into the drawing XML - its fractional
 * `tl.col` is never converted, so `col: 6.75` landed a few pixels into column G
 * instead of at the far edge.
 */
export const logoAnchor = (() => {
  const targetLeft = TABLE_WIDTH_PT - LOGO_SIZE_PT;
  let left = 0;

  for (let index = 0; index < COLUMN_WIDTHS.length; index += 1) {
    const width = columnWidthPt(COLUMN_WIDTHS[index]);
    if (left + width > targetLeft) {
      return {
        nativeCol: index,
        nativeColOff: Math.round((targetLeft - left) * EMU_PER_PT),
        nativeRow: 0,
        nativeRowOff: 0,
      };
    }
    left += width;
  }

  return {
    nativeCol: COLUMN_WIDTHS.length - 1,
    nativeColOff: 0,
    nativeRow: 0,
    nativeRowOff: 0,
  };
})();

export interface BOMRowClient {
  serial: number;
  section: string;
  name: string;
  desc: string;
  uom: string;
  remark: string;
  qty: number;
  actualQty?: number | null;
}

export interface JobInfo {
  customerName: string;
  mobileNo: string;
  projectNo?: string;
  quotationNo?: string;
  requirement: string;
  shippingAddress: string;
  gstNumber?: string;
}

export async function generateBOMExcelClient(rows: BOMRowClient[], jobInfo: JobInfo): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('BOM List');

  ws.pageSetup = {
    orientation: 'portrait',
    paperSize: 9,
    margins: { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    fitToPage: true,
    fitToHeight: 1,
    fitToWidth: 1,
  };

  ws.columns = COLUMN_WIDTHS.map((width) => ({ width }));

  const blackFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000000' } } as ExcelJS.Fill;
  const whiteFont = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } } as ExcelJS.Font;
  const headerFont = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } } as ExcelJS.Font;
  const bodyFont = { name: 'Calibri', size: 9, bold: false, color: { argb: 'FF000000' } } as ExcelJS.Font;
  const sectionFont = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF000000' } } as ExcelJS.Font;

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } },
  };

  const mediumBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'medium', color: { argb: 'FF000000' } },
    bottom: { style: 'medium', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } },
  };

  ws.mergeCells('A1:G1');
  const titleCell = ws.getCell('A1');
  titleCell.value = 'SULEKHA ENGINEERING';
  titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF000000' } } as ExcelJS.Font;
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' } as ExcelJS.Alignment;
  ws.getRow(1).height = HEADER_ROW_HEIGHTS_PT[0];

  ws.mergeCells('A2:G2');
  const subCell = ws.getCell('A2');
  subCell.value = 'PM Surya Ghar Registered Vendor  •  Solar Power Plant  •  Ph: 9832117393';
  subCell.font = { name: 'Calibri', size: 9, bold: false, color: { argb: 'FF000000' } } as ExcelJS.Font;
  subCell.alignment = { horizontal: 'center', vertical: 'middle' } as ExcelJS.Alignment;
  ws.getRow(2).height = HEADER_ROW_HEIGHTS_PT[1];

  ws.mergeCells('A3:G3');
  const bomTitle = ws.getCell('A3');
  bomTitle.value = 'SULEKHA ENGINEERING  —  BOM LIST';
  bomTitle.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } } as ExcelJS.Font;
  bomTitle.alignment = { horizontal: 'center', vertical: 'middle' } as ExcelJS.Alignment;
  bomTitle.fill = blackFill;
  ws.getRow(3).height = 18;

  // No placeholder column to the right of the table: leaving column H in the
  // sheet stretched the used range to A1:H74, which pulled the page scaling off
  // and pushed the logo off the paper.
  try {
    const logoResponse = await fetch('/sulekha_engineering_logo.jpeg');
    if (logoResponse.ok) {
      const logoBuffer = await logoResponse.arrayBuffer();
      const logoUint8 = new Uint8Array(logoBuffer);
      // @ts-expect-error exceljs browser Buffer type mismatch
      const logoId = wb.addImage({ buffer: Buffer.from(logoUint8), extension: 'jpeg' });
      ws.addImage(logoId, {
        // EMU-based anchor: ExcelJS's own anchor type only models {col, row},
        // but the writer serialises nativeColOff as-is.
        tl: logoAnchor as unknown as ExcelJS.Anchor,
        ext: { width: LOGO_SIZE_PX, height: LOGO_SIZE_PX },
      });
    }
  } catch {
    // logo not available
  }

  ws.getRow(4).height = 3;

  const jobRow5 = ws.getRow(5);
  jobRow5.height = 16;
  const jobRow6 = ws.getRow(6);
  jobRow6.height = 16;
  const jobRow7 = ws.getRow(7);
  jobRow7.height = 16;
  const jobRow8 = ws.getRow(8);
  jobRow8.height = 16;

  const jobRows = [
    { labels: ['Project No', 'Quotation No'], values: [jobInfo.projectNo || '', jobInfo.quotationNo || ''] },
    { labels: ['Customer Name', 'GST Details'], values: [jobInfo.customerName || '', jobInfo.gstNumber || ''] },
    { labels: ['Requirement', 'Mobile No'], values: [jobInfo.requirement, jobInfo.mobileNo || ''] },
    { labels: ['Shipping Address', ''], values: [jobInfo.shippingAddress || '', ''] },
  ];

  jobRows.forEach((job, idx) => {
    const row = ws.getRow(5 + idx);
    const label1 = row.getCell(1);
    label1.value = job.labels[0];
    label1.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF000000' } } as ExcelJS.Font;
    label1.alignment = { horizontal: 'left', vertical: 'middle' } as ExcelJS.Alignment;
    label1.border = thinBorder;

    const value1 = row.getCell(2);
    value1.value = job.values[0];
    value1.font = bodyFont;
    value1.alignment = { horizontal: 'left', vertical: 'middle' } as ExcelJS.Alignment;
    value1.border = thinBorder;
    ws.mergeCells(`B${5 + idx}:C${5 + idx}`);

    const label2 = row.getCell(4);
    label2.value = job.labels[1];
    label2.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF000000' } } as ExcelJS.Font;
    label2.alignment = { horizontal: 'left', vertical: 'middle' } as ExcelJS.Alignment;
    label2.border = thinBorder;

    const value2 = row.getCell(5);
    value2.value = job.values[1];
    value2.font = bodyFont;
    value2.alignment = { horizontal: 'left', vertical: 'middle' } as ExcelJS.Alignment;
    value2.border = thinBorder;
    ws.mergeCells(`E${5 + idx}:G${5 + idx}`);
  });

  ws.getRow(9).height = 3;

  const tableHeaderRow = ws.getRow(10);
  tableHeaderRow.height = 16;
  const tableHeaders = ['PART', 'SL NO', 'ITEM NAME', 'ITEM DESCRIPTION', 'UOM', 'TOTAL QTY', 'REMARK'];
  tableHeaders.forEach((header, idx) => {
    const cell = tableHeaderRow.getCell(idx + 1);
    cell.value = header;
    cell.font = headerFont;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true } as ExcelJS.Alignment;
    cell.fill = blackFill;
    cell.border = mediumBorder;
  });

  let currentSection = '';
  let dataRowIndex = 11;

  for (const row of rows) {
    const isFirstInSection = row.section !== currentSection;
    if (isFirstInSection) {
      currentSection = row.section;
    }

    const dataRow = ws.getRow(dataRowIndex);
    dataRow.height = 14;

    if (isFirstInSection) {
      const sectionCell = dataRow.getCell(1);
      sectionCell.value = row.section;
      sectionCell.font = sectionFont;
      sectionCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true } as ExcelJS.Alignment;
      sectionCell.border = thinBorder;
    }

    const cells = [
      { col: 2, value: row.serial, align: 'center' as const },
      { col: 3, value: row.name, align: 'left' as const },
      { col: 4, value: row.desc, align: 'left' as const },
      { col: 5, value: row.uom, align: 'center' as const },
      { col: 6, value: row.actualQty ?? '', align: 'center' as const },
      { col: 7, value: row.remark || '', align: 'left' as const },
    ];

    cells.forEach(({ col, value, align }) => {
      const cell = dataRow.getCell(col);
      cell.value = value;
      cell.font = bodyFont;
      cell.alignment = { horizontal: align, vertical: 'middle', wrapText: true } as ExcelJS.Alignment;
      cell.border = thinBorder;
    });

    dataRowIndex++;
  }

  const footerRow = ws.getRow(dataRowIndex + 1);
  footerRow.height = 14;
  const preparedCell = footerRow.getCell(1);
  preparedCell.value = 'Prepared By';
  preparedCell.font = { name: 'Calibri', size: 8, color: { argb: 'FF6B7280' } } as ExcelJS.Font;
  preparedCell.alignment = { horizontal: 'left', vertical: 'middle' } as ExcelJS.Alignment;

  const authCell = footerRow.getCell(7);
  authCell.value = 'Authorized Signatory';
  authCell.font = { name: 'Calibri', size: 8, color: { argb: 'FF6B7280' } } as ExcelJS.Font;
  authCell.alignment = { horizontal: 'right', vertical: 'middle' } as ExcelJS.Alignment;

  ws.views = [{ state: 'frozen', ySplit: 10 }];

  return wb;
}

export function downloadBOMExcel(wb: ExcelJS.Workbook, filename: string) {
  wb.xlsx.writeBuffer().then((buffer) => {
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
}

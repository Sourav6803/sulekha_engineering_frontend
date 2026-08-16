import ExcelJS from 'exceljs';

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

  ws.columns = [
    { width: 24 },
    { width: 6 },
    { width: 28 },
    { width: 26 },
    { width: 8 },
    { width: 10 },
    { width: 20 },
  ];

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
  ws.getRow(1).height = 24;

  ws.mergeCells('A2:G2');
  const subCell = ws.getCell('A2');
  subCell.value = 'PM Surya Ghar Registered Vendor  •  Solar Power Plant  •  Ph: 9832117393';
  subCell.font = { name: 'Calibri', size: 9, bold: false, color: { argb: 'FF000000' } } as ExcelJS.Font;
  subCell.alignment = { horizontal: 'center', vertical: 'middle' } as ExcelJS.Alignment;
  ws.getRow(2).height = 14;

  ws.mergeCells('A3:G3');
  const bomTitle = ws.getCell('A3');
  bomTitle.value = 'SULEKHA ENGINEERING  —  BOM LIST';
  bomTitle.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } } as ExcelJS.Font;
  bomTitle.alignment = { horizontal: 'center', vertical: 'middle' } as ExcelJS.Alignment;
  bomTitle.fill = blackFill;
  ws.getRow(3).height = 18;

  ws.mergeCells('H1:H3');
  const logoPlaceholder = ws.getCell('H1');
  logoPlaceholder.value = '';
  logoPlaceholder.alignment = { horizontal: 'right', vertical: 'middle', wrapText: false, shrinkToFit: false, indent: 0, readingOrder: 0, textRotation: 0 } as unknown as ExcelJS.Alignment;

  try {
    const logoResponse = await fetch('/sulekha_engineering_logo.jpeg');
    if (logoResponse.ok) {
      const logoBuffer = await logoResponse.arrayBuffer();
      const logoUint8 = new Uint8Array(logoBuffer);
      // @ts-ignore exceljs browser Buffer type mismatch
      const logoId = wb.addImage({ buffer: Buffer.from(logoUint8), extension: 'jpeg' });
      ws.addImage(logoId, { tl: { col: 7, row: 0 }, ext: { width: 70, height: 50 } });
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

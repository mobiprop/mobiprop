// Client-side file → header-keyed rows helper shared by the Leads/Contacts
// import flows. CSV keeps using the existing hand-rolled parser; .xlsx/.xls
// goes through exceljs (loaded in the browser, one file at a time).

import type { CellValue } from "exceljs";

import { parseCsv, csvRowsToObjects } from "@/lib/csv";

const SPREADSHEET_EXTENSIONS = [".xlsx", ".xls"];

function isSpreadsheetFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return SPREADSHEET_EXTENSIONS.some((ext) => name.endsWith(ext));
}

function cellToString(value: CellValue): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    if ("richText" in value) return value.richText.map((part) => part.text).join("");
    if ("text" in value) return value.text;
    if ("result" in value) return value.result != null ? String(value.result) : "";
    return "";
  }
  return String(value);
}

export async function parseSpreadsheetFile(file: File): Promise<Record<string, string>[]> {
  if (!isSpreadsheetFile(file)) {
    const text = await file.text();
    return csvRowsToObjects(parseCsv(text));
  }

  const { Workbook } = await import("exceljs");
  const workbook = new Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  let headers: string[] = [];
  const rows: Record<string, string>[] = [];

  worksheet.eachRow((row, rowNumber) => {
    const values = (row.values as CellValue[]).slice(1);
    if (rowNumber === 1) {
      headers = values.map((value) => cellToString(value).trim());
      return;
    }
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      if (!header) return;
      record[header] = cellToString(values[index]);
    });
    rows.push(record);
  });

  return rows;
}

import Papa from "papaparse";

export interface CsvRow {
  [key: string]: string;
}

export interface ParsedCsv {
  headers: string[];
  rows: CsvRow[];
}

export function parseCsv(text: string): ParsedCsv {
  const result = Papa.parse<CsvRow>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });
  const headers = result.meta.fields ?? [];
  const rows = result.data.filter((r) =>
    Object.values(r).some((v) => v && String(v).trim() !== ""),
  );
  return { headers, rows };
}

export interface ColumnMapping {
  dateColumn: string;
  amountColumn: string;
  memoColumn?: string;
}

export interface ImportItem {
  usageDate: string;
  amount: number;
  memo: string | null;
  raw: CsvRow;
}

const DATE_FORMATS = [
  /^(\d{4})[-\/\.](\d{1,2})[-\/\.](\d{1,2})$/,
  /^(\d{4})年(\d{1,2})月(\d{1,2})日$/,
];

function normalizeDate(value: string): string | null {
  const trimmed = value.trim();
  for (const regex of DATE_FORMATS) {
    const m = trimmed.match(regex);
    if (m) {
      const y = m[1];
      const mo = m[2].padStart(2, "0");
      const d = m[3].padStart(2, "0");
      return `${y}-${mo}-${d}`;
    }
  }
  return null;
}

function normalizeAmount(value: string): number | null {
  const cleaned = value.replace(/[,¥￥\s円]/g, "").trim();
  const num = parseInt(cleaned, 10);
  if (isNaN(num) || num <= 0) return null;
  return num;
}

export function applyMapping(
  rows: CsvRow[],
  mapping: ColumnMapping,
): { items: ImportItem[]; errors: { row: number; reason: string }[] } {
  const items: ImportItem[] = [];
  const errors: { row: number; reason: string }[] = [];

  rows.forEach((row, idx) => {
    const rawDate = row[mapping.dateColumn];
    const rawAmount = row[mapping.amountColumn];
    const rawMemo = mapping.memoColumn ? row[mapping.memoColumn] : "";

    if (!rawDate || !rawAmount) {
      errors.push({ row: idx + 1, reason: "日付または金額が空です" });
      return;
    }

    const usageDate = normalizeDate(rawDate);
    if (!usageDate) {
      errors.push({ row: idx + 1, reason: `日付形式が解釈できません: ${rawDate}` });
      return;
    }

    const amount = normalizeAmount(rawAmount);
    if (amount === null) {
      errors.push({ row: idx + 1, reason: `金額が解釈できません: ${rawAmount}` });
      return;
    }

    items.push({
      usageDate,
      amount,
      memo: rawMemo ? rawMemo.trim() : null,
      raw: row,
    });
  });

  return { items, errors };
}

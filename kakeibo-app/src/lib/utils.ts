import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 金額フォーマット: 250000 → "¥250,000"
export function formatCurrency(amount: number): string {
  return `¥${new Intl.NumberFormat("ja-JP").format(amount)}`;
}

// 月表示: "2026-02" → "2026年02月"
export function formatMonth(month: string): string {
  const [year, m] = month.split("-");
  return `${year}年${m}月`;
}

// 日表示: 25 → "25日", 32 → "末日"
export function formatDay(day: number): string {
  return day === 32 ? "末日" : `${day}日`;
}

// 金額を日本語単位で表示: 250000 → "25万円", 253000 → "25万3,000円", 3000 → "3,000円"
export function formatCurrencyJP(amount: number): string {
  if (!amount || amount <= 0) return "";
  const man = Math.floor(amount / 10000);
  const remainder = amount % 10000;
  if (man === 0) return `${new Intl.NumberFormat("ja-JP").format(remainder)}円`;
  if (remainder === 0) return `${man}万円`;
  return `${man}万${new Intl.NumberFormat("ja-JP").format(remainder)}円`;
}

// 支払日表示: (10, 1) → "翌月10日", (4, 2) → "翌々月4日", (27, 0) → "当月27日"
export function formatPaymentDay(day: number, monthOffset: number): string {
  const prefix = monthOffset === 0 ? "当月" : monthOffset === 1 ? "翌月" : "翌々月";
  return `${prefix}${formatDay(day)}`;
}

/**
 * 実際の支払月日を表示: (27, 1, "2026-03") → "4月27日", (32, 1, "2026-03") → "4月末日"
 */
export function formatActualPaymentDate(
  day: number,
  monthOffset: number,
  baseMonth: string
): string {
  const [year, month] = baseMonth.split("-").map(Number);
  const d = new Date(year, month - 1 + monthOffset, 1);
  return `${d.getMonth() + 1}月${formatDay(day)}`;
}

/**
 * day=32 を指定月の実際の末日（last day）に変換する
 * @param day 1-31 通常日、32 = 末日
 * @param year 西暦年
 * @param month 月（1-12）
 */
export function getActualDay(day: number, year: number, month: number): number {
  if (day !== 32) return day;
  return new Date(year, month, 0).getDate();
}

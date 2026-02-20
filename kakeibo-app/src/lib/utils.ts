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

// 日表示: 25 → "25日"
export function formatDay(day: number): string {
  return `${day}日`;
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
  return `${prefix}${day}日`;
}

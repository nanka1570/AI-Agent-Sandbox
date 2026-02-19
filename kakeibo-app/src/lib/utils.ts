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

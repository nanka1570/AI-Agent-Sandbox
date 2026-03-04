export const DEFAULT_CATEGORIES = [
  { name: "食費", color: "#FF6384" },
  { name: "水道光熱費", color: "#36A2EB" },
  { name: "通信費", color: "#FFCE56" },
  { name: "交通費", color: "#4BC0C0" },
  { name: "娯楽", color: "#9966FF" },
  { name: "日用品", color: "#FF9F40" },
  { name: "医療", color: "#C9CBCF" },
  { name: "その他", color: "#7C8A96" },
  { name: "雑費", color: "#E7E9ED" },
] as const;

export const CARD_BRANDS = [
  { value: "visa", label: "Visa" },
  { value: "mastercard", label: "Mastercard" },
  { value: "jcb", label: "JCB" },
  { value: "amex", label: "American Express" },
  { value: "other", label: "その他" },
] as const;

export const PAYMENT_STATUSES = {
  unconfirmed: { label: "未確定", variant: "outline" as const },
  confirmed: { label: "確定", variant: "secondary" as const },
  paid: { label: "支払済", variant: "default" as const },
} as const;

export type PaymentStatus = keyof typeof PAYMENT_STATUSES;

export const TIMEZONE = "Asia/Tokyo";

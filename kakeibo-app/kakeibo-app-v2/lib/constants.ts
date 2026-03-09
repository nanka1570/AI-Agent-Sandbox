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

/** ステータスごとの転スラテーマ表示設定 */
export const PAYMENT_STATUS_DISPLAY = {
  paid: {
    color: "#69F0AE",
    colorClass: "text-sage-success",
    engLabel: "EXECUTED",
    icon: "●",
    isPulsing: false,
  },
  confirmed: {
    color: "#FFB300",
    colorClass: "text-sage-gold",
    engLabel: "CONFIRMED",
    icon: "●",
    isPulsing: false,
  },
  unconfirmed: {
    color: "#FF8F00",
    colorClass: "text-sage-gold-deep",
    engLabel: "ANALYZING",
    icon: "◌",
    isPulsing: true,
  },
} as const;

export type PaymentStatus = keyof typeof PAYMENT_STATUSES;

/** 予算消化率の閾値（%） */
export const BUDGET_THRESHOLD_WARNING = 80;
export const BUDGET_THRESHOLD_DANGER = 100;

/** チャート共通テーマカラー（転スラダークテーマ） */
export const CHART_THEME = {
  tooltipBg: "#161B28",
  tooltipBorder: "#FFB300",
  tooltipBorderRadius: "4px",
  tooltipText: "#F5E6C8",
  axisColor: "#8A7560",
  axisFontSize: 11,
  gridColor: "rgba(255,179,0,0.1)",
  accentColor: "#FFB300",
} as const;

/** 年セレクターに表示する年数 */
export const YEAR_RANGE = 5;

export const TIMEZONE = "Asia/Tokyo";

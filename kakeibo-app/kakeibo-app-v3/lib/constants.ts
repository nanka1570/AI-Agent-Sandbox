export const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth",
];

export const MONTH_PARAM_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export const TIMEZONE = "Asia/Tokyo";

/** 末日を表すコード値（日付フィールドで「末日」を指定する場合に使用） */
export const LAST_DAY_CODE = 32;

/** sortOrder の初期値（新規追加時に aggregate で最大値 +1 する際の基準） */
export const SORT_ORDER_INITIAL = -1;

/** 年セレクターに表示する年数 */
export const YEAR_RANGE = 5;

export const ACCOUNT_TYPES = ["bank", "cash"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  bank: "銀行口座",
  cash: "現金",
};

export const PAYMENT_STATUSES = {
  unconfirmed: { label: "未確定", variant: "outline" as const },
  confirmed: { label: "確定", variant: "secondary" as const },
  paid: { label: "支払済", variant: "default" as const },
} as const;

export type PaymentStatus = keyof typeof PAYMENT_STATUSES;

export const PAYMENT_STATUS_KEYS = Object.keys(PAYMENT_STATUSES) as [
  PaymentStatus,
  ...PaymentStatus[],
];

export const DEFAULT_PAYMENT_STATUS: PaymentStatus = "unconfirmed";

export const CARD_BRANDS = [
  { value: "visa", label: "Visa" },
  { value: "mastercard", label: "Mastercard" },
  { value: "jcb", label: "JCB" },
  { value: "amex", label: "American Express" },
  { value: "other", label: "その他" },
] as const;

export const DEFAULT_CATEGORIES = [
  { name: "食費", color: "#FF6384" },
  { name: "水道光熱費", color: "#36A2EB" },
  { name: "通信費", color: "#FFCE56" },
  { name: "交通費", color: "#4BC0C0" },
  { name: "娯楽", color: "#9966FF" },
  { name: "日用品", color: "#FF9F40" },
  { name: "医療", color: "#C9CBCF" },
  { name: "その他", color: "#7C8A96" },
] as const;

export const FIXED_LAST_CATEGORY_NAME = "その他";

export const DEFAULT_CATEGORY_COLORS = [
  "#FF6384",
  "#36A2EB",
  "#FFCE56",
  "#4BC0C0",
  "#9966FF",
  "#FF9F40",
  "#C9CBCF",
  "#8BC34A",
];

/** 予算消化率の閾値（%） */
export const BUDGET_THRESHOLD_WARNING = 80;
export const BUDGET_THRESHOLD_DANGER = 100;

/** カテゴリ未設定時のフォールバック表示 */
export const UNCATEGORIZED_LABEL = "未分類";
export const UNCATEGORIZED_COLOR = "#666666";

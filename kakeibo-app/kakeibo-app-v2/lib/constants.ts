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

/** 末日を表すコード値（日付フィールドで「末日」を指定する場合に使用） */
export const LAST_DAY_CODE = 32;

/** sortOrder の初期値（新規追加時に aggregate で最大値を取得し +1 する際の基準） */
export const SORT_ORDER_INITIAL = -1;

/** 末尾に固定配置するデフォルトカテゴリ名 */
export const FIXED_LAST_CATEGORY_NAME = "その他";

/** 月パラメータの正規表現（yyyy-MM 形式） */
export const MONTH_PARAM_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

/** 認証不要のパブリックパス */
export const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
] as const;

/** 繰り返し支払いの件数 */
export const RECURRING_PAYMENT_COUNT = 4;

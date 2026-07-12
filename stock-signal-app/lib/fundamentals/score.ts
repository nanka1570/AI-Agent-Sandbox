// ファンダメンタルズ判定エンジン
// ユーザーの判断基準（安全性・収益性・割安度・CF・配当・決算）をそのままルール化する。
// 閾値を変える場合はこのファイルの各 check だけを直す。

import type { EarningsSurprise } from "@/lib/data/yahoo";

export interface FundamentalInput {
  per: number | null;
  forwardPer: number | null;
  pbr: number | null;
  roe: number | null;
  operatingMargin: number | null;
  profitMargin: number | null;
  currentRatio: number | null;
  equityRatio: number | null;
  debtToEquity: number | null;
  debtTrend: string | null;
  operatingCashflow: number | null;
  freeCashflow: number | null;
  ocfTrend: string | null;
  fcfNegativeStreak: boolean | null;
  sharesTrend: string | null;
  dividendYield: number | null;
  payoutRatio: number | null;
  surprises: string | null; // JSON（EarningsSurprise[]）
}

export interface CheckItem {
  label: string;
  passed: boolean | null; // null = データ取得不能（減点しない）
  value: string; // 表示用の実測値
}

export interface Category {
  name: string;
  items: CheckItem[];
  passed: number;
  available: number; // データが取れた項目数
}

export interface FundamentalAssessment {
  categories: Category[];
  warnings: string[]; // 警戒フラグ（配当性向100%超・希薄化・Intel型 など）
  isLossMaking: boolean; // 赤字企業（扱いを変える）
  stockType: string | null; // 銘柄タイプ分類（参考）
  typeReason: string | null;
  passed: number;
  total: number; // available の合計
}

const pct = (v: number | null) => (v != null ? `${(v * 100).toFixed(1)}%` : "—");
const ratio = (v: number | null) => (v != null ? v.toFixed(2) : "—");
const trendLabel = (v: string | null) =>
  v === "down" ? "減少" : v === "up" ? "増加" : v === "flat" ? "横ばい" : "—";

function check(
  label: string,
  value: string,
  raw: unknown,
  predicate: () => boolean
): CheckItem {
  if (raw == null) return { label, passed: null, value: "—" };
  return { label, passed: predicate(), value };
}

export function parseSurprises(json: string | null): EarningsSurprise[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function assessFundamentals(f: FundamentalInput): FundamentalAssessment {
  const isLossMaking = f.profitMargin != null && f.profitMargin < 0;
  const surprises = parseSurprises(f.surprises);
  const surprisePcts = surprises
    .map((s) => s.surprisePct)
    .filter((v): v is number => v != null);
  const allSurprisePositive =
    surprisePcts.length >= 4 && surprisePcts.every((v) => v > 0);

  const categories: Category[] = [
    buildCategory("安全性（倒れないか）", [
      check("流動比率 200% 以上", pct(f.currentRatio), f.currentRatio, () =>
        (f.currentRatio as number) >= 2
      ),
      check("自己資本比率 40% 以上", pct(f.equityRatio), f.equityRatio, () =>
        (f.equityRatio as number) >= 0.4
      ),
      check("DE レシオ 1.0 以下", ratio(f.debtToEquity), f.debtToEquity, () => {
        const v = f.debtToEquity as number;
        return v >= 0 && v <= 1.0;
      }),
      check("負債が減少傾向", trendLabel(f.debtTrend), f.debtTrend, () =>
        f.debtTrend === "down"
      ),
    ]),
    buildCategory("収益性（稼ぐ力）", [
      check("ROE 10% 以上", pct(f.roe), f.roe, () => (f.roe as number) >= 0.1),
      check("本業が黒字（営業利益率 > 0）", pct(f.operatingMargin), f.operatingMargin, () =>
        (f.operatingMargin as number) > 0
      ),
      check("最終黒字（純利益率 > 0）", pct(f.profitMargin), f.profitMargin, () =>
        (f.profitMargin as number) > 0
      ),
    ]),
    buildCategory("割安度", [
      check("PER 15 倍以下", ratio(f.per), f.per, () => {
        const v = f.per as number;
        return v > 0 && v <= 15;
      }),
      check("PBR 1 倍以下", ratio(f.pbr), f.pbr, () => {
        const v = f.pbr as number;
        return v > 0 && v <= 1;
      }),
    ]),
    buildCategory("キャッシュフロー", [
      check(
        "営業CF がプラスで増加傾向",
        `${f.operatingCashflow != null ? fmtAmount(f.operatingCashflow) : "—"}（${trendLabel(f.ocfTrend)}）`,
        f.operatingCashflow,
        () => (f.operatingCashflow as number) > 0 && f.ocfTrend === "up"
      ),
      check("フリーCF がプラス", fmtAmount(f.freeCashflow), f.freeCashflow, () =>
        (f.freeCashflow as number) > 0
      ),
      check(
        "希薄化なし（株式数が横ばい・減少）",
        trendLabel(f.sharesTrend),
        f.sharesTrend,
        () => f.sharesTrend === "flat" || f.sharesTrend === "down"
      ),
    ]),
    buildCategory("配当", [
      f.dividendYield == null || f.dividendYield === 0
        ? { label: "配当性向 100% 以下", passed: null, value: "無配" }
        : check("配当性向 100% 以下", pct(f.payoutRatio), f.payoutRatio, () =>
            (f.payoutRatio as number) <= 1
          ),
    ]),
    buildCategory("決算", [
      surprisePcts.length === 0
        ? { label: "直近4四半期サプライズが全てプラス", passed: null, value: "—" }
        : {
            label: "直近4四半期サプライズが全てプラス",
            passed: allSurprisePositive,
            value: surprisePcts
              .map((v) => `${v >= 0 ? "+" : ""}${(v * 100).toFixed(1)}%`)
              .join(" / "),
          },
    ]),
  ];

  // ── 警戒フラグ ──
  const warnings: string[] = [];
  if (isLossMaking) {
    warnings.push("赤字企業（Intel 型）。PER で評価できず、扱いを変える");
  }
  if (f.payoutRatio != null && f.payoutRatio > 1) {
    warnings.push("配当性向 100% 超 = 利益以上に配当を払う無理な状態");
  }
  if (f.sharesTrend === "up") {
    warnings.push("発行済株式数が増加 = 希薄化");
  }
  if (f.fcfNegativeStreak === true && f.sharesTrend === "up") {
    warnings.push("FCF マイナス継続 + 新株発行 = 自力で稼げず資金繰りしている警戒サイン");
  }
  if (
    f.roe != null &&
    f.roe >= 0.1 &&
    f.equityRatio != null &&
    f.equityRatio < 0.4
  ) {
    warnings.push("ROE が高いが自己資本比率が低い = 借金による水増しの可能性");
  }

  // ── 銘柄タイプ分類（参考。最終判断は人間） ──
  let stockType: string | null = null;
  let typeReason: string | null = null;
  if (f.profitMargin == null) {
    stockType = null;
  } else if (isLossMaking) {
    if (f.fcfNegativeStreak === true && f.sharesTrend === "up") {
      stockType = "再建賭け型（最も投機的）";
      typeReason = "赤字 + FCFマイナス継続 + 希薄化";
    } else {
      stockType = "期待先行型（投機的）";
      typeReason = "赤字だが将来期待で買われている可能性";
    }
  } else if (
    allSurprisePositive &&
    surprisePcts.reduce((a, b) => a + b, 0) / surprisePcts.length > 0.05
  ) {
    stockType = "V字回復型";
    typeReason = "実績が予想を大幅に超え続けている（サンディスク型）";
  } else if (
    f.roe != null &&
    f.roe >= 0.2 &&
    f.operatingMargin != null &&
    f.operatingMargin >= 0.3
  ) {
    stockType = "実績先行の王者型";
    typeReason = "高収益・高マージン。リスクは割高のみ";
  } else if (f.dividendYield != null && f.dividendYield >= 0.02) {
    stockType = "安定配当型";
    typeReason =
      f.payoutRatio != null && f.payoutRatio > 1
        ? "配当利回りは高いが配当性向 100% 超に警戒"
        : "配当利回り 2% 以上";
  } else {
    stockType = "標準";
    typeReason = null;
  }

  const passed = categories.reduce((a, c) => a + c.passed, 0);
  const total = categories.reduce((a, c) => a + c.available, 0);
  return {
    categories,
    warnings,
    isLossMaking,
    stockType,
    typeReason,
    passed,
    total,
  };
}

function buildCategory(name: string, items: CheckItem[]): Category {
  return {
    name,
    items,
    passed: items.filter((i) => i.passed === true).length,
    available: items.filter((i) => i.passed !== null).length,
  };
}

function fmtAmount(v: number | null): string {
  if (v == null) return "—";
  const abs = Math.abs(v);
  if (abs >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${(v / 1e6).toFixed(0)}M`;
  return v.toFixed(0);
}

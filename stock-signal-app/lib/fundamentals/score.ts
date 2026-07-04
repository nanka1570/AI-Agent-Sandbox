// ファンダメンタルズの現在値から銘柄の健全性を 5 点満点でスコア化する
// 閾値は一般的な目安（判定内訳を UI に表示して根拠を確認できるようにする）

export interface FundamentalInput {
  per: number | null;
  forwardPer: number | null;
  peg: number | null;
  revenueGrowth: number | null;
  profitMargin: number | null;
}

export interface ScoreItem {
  label: string;
  passed: boolean;
  available: boolean; // 指標が取得できなかった場合 false（0 点扱い）
}

export interface FundamentalScore {
  score: number;
  max: number;
  items: ScoreItem[];
}

export function scoreFundamentals(f: FundamentalInput): FundamentalScore {
  const items: ScoreItem[] = [
    check("PER が 0〜35（赤字・過熱を除外）", f.per, (v) => v > 0 && v < 35),
    check("PEG が 0〜2（成長率対比で割高でない）", f.peg, (v) => v > 0 && v < 2),
    check("収益成長率が 10% 超", f.revenueGrowth, (v) => v > 0.1),
    check("利益率が 15% 超", f.profitMargin, (v) => v > 0.15),
    check(
      "予想 PER < 実績 PER（利益改善見込み）",
      f.forwardPer != null && f.per != null ? f.forwardPer : null,
      (v) => f.per != null && v > 0 && v < f.per
    ),
  ];
  return {
    score: items.filter((i) => i.passed).length,
    max: items.length,
    items,
  };
}

function check(
  label: string,
  value: number | null,
  predicate: (v: number) => boolean
): ScoreItem {
  if (value == null) {
    return { label, passed: false, available: false };
  }
  return { label, passed: predicate(value), available: true };
}

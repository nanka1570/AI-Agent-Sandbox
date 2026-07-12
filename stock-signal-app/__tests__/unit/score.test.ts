import { describe, expect, it } from "vitest";
import {
  assessFundamentals,
  type FundamentalInput,
} from "@/lib/fundamentals/score";

// 全項目が null のベース（テストごとに必要な値だけ上書きする）
const empty: FundamentalInput = {
  per: null,
  forwardPer: null,
  pbr: null,
  roe: null,
  operatingMargin: null,
  profitMargin: null,
  currentRatio: null,
  equityRatio: null,
  debtToEquity: null,
  debtTrend: null,
  operatingCashflow: null,
  freeCashflow: null,
  ocfTrend: null,
  fcfNegativeStreak: null,
  sharesTrend: null,
  dividendYield: null,
  payoutRatio: null,
  surprises: null,
};

const surprises = (pcts: number[]) =>
  JSON.stringify(
    pcts.map((p, i) => ({
      quarter: `2026-0${i + 1}-01`,
      actual: 1,
      estimate: 1,
      surprisePct: p,
    }))
  );

describe("assessFundamentals: カテゴリ判定", () => {
  it("安全性: 流動比率200%・自己資本比率40%・DE1.0・負債減少で全合格", () => {
    const r = assessFundamentals({
      ...empty,
      currentRatio: 4.4,
      equityRatio: 0.55,
      debtToEquity: 0.84,
      debtTrend: "down",
    });
    const safety = r.categories.find((c) => c.name.startsWith("安全性"))!;
    expect(safety.passed).toBe(4);
    expect(safety.available).toBe(4);
  });

  it("割安度: PER 15超・PBR 1超は不合格（境界値）", () => {
    const r = assessFundamentals({ ...empty, per: 15.1, pbr: 1.1 });
    const value = r.categories.find((c) => c.name === "割安度")!;
    expect(value.passed).toBe(0);
    const r2 = assessFundamentals({ ...empty, per: 15, pbr: 1 });
    expect(r2.categories.find((c) => c.name === "割安度")!.passed).toBe(2);
  });

  it("赤字（PER 計算不能 = null）は減点せず「データなし」扱い", () => {
    const r = assessFundamentals({ ...empty, profitMargin: -0.1 });
    const value = r.categories.find((c) => c.name === "割安度")!;
    expect(value.available).toBe(0); // per/pbr とも null → 評価対象外
    expect(r.isLossMaking).toBe(true);
  });

  it("無配は配当カテゴリを評価対象外にする", () => {
    const r = assessFundamentals({ ...empty, dividendYield: 0 });
    const div = r.categories.find((c) => c.name === "配当")!;
    expect(div.available).toBe(0);
  });

  it("決算: 4四半期連続プラスサプライズで合格、1つでもマイナスなら不合格", () => {
    const ok = assessFundamentals({
      ...empty,
      surprises: surprises([0.04, 0.03, 0.05, 0.06]),
    });
    expect(ok.categories.find((c) => c.name === "決算")!.passed).toBe(1);

    const ng = assessFundamentals({
      ...empty,
      surprises: surprises([0.04, -0.01, 0.05, 0.06]),
    });
    expect(ng.categories.find((c) => c.name === "決算")!.passed).toBe(0);
  });
});

describe("assessFundamentals: 警戒フラグ", () => {
  it("配当性向 100% 超で警戒（TXN の教訓）", () => {
    const r = assessFundamentals({
      ...empty,
      dividendYield: 0.03,
      payoutRatio: 1.05,
    });
    expect(r.warnings.some((w) => w.includes("配当性向 100% 超"))).toBe(true);
  });

  it("FCFマイナス継続 + 希薄化で Intel 型の警戒", () => {
    const r = assessFundamentals({
      ...empty,
      profitMargin: -0.2,
      fcfNegativeStreak: true,
      sharesTrend: "up",
    });
    expect(r.warnings.some((w) => w.includes("資金繰り"))).toBe(true);
    expect(r.warnings.some((w) => w.includes("希薄化"))).toBe(true);
  });

  it("高ROE でも自己資本比率が低ければ水増しの可能性を警告", () => {
    const r = assessFundamentals({
      ...empty,
      roe: 0.35,
      equityRatio: 0.2,
    });
    expect(r.warnings.some((w) => w.includes("水増し"))).toBe(true);
  });
});

describe("assessFundamentals: 銘柄タイプ分類", () => {
  it("高収益・高マージン → 実績先行の王者型（KLAC/LRCX 型）", () => {
    const r = assessFundamentals({
      ...empty,
      profitMargin: 0.3,
      roe: 0.4,
      operatingMargin: 0.38,
    });
    expect(r.stockType).toBe("実績先行の王者型");
  });

  it("サプライズ大幅超過の継続 → V字回復型（サンディスク型）", () => {
    const r = assessFundamentals({
      ...empty,
      profitMargin: 0.1,
      surprises: surprises([0.1, 0.08, 0.12, 0.09]),
    });
    expect(r.stockType).toBe("V字回復型");
  });

  it("赤字 + FCFマイナス継続 + 希薄化 → 再建賭け型（Intel 型）", () => {
    const r = assessFundamentals({
      ...empty,
      profitMargin: -0.15,
      fcfNegativeStreak: true,
      sharesTrend: "up",
    });
    expect(r.stockType).toBe("再建賭け型（最も投機的）");
  });

  it("赤字のみ → 期待先行型（UCTT 型）", () => {
    const r = assessFundamentals({ ...empty, profitMargin: -0.05 });
    expect(r.stockType).toBe("期待先行型（投機的）");
  });

  it("配当利回り 2% 以上 → 安定配当型（TXN 型）", () => {
    const r = assessFundamentals({
      ...empty,
      profitMargin: 0.29,
      dividendYield: 0.028,
      payoutRatio: 0.95,
    });
    expect(r.stockType).toBe("安定配当型");
  });

  it("データ不足なら分類しない", () => {
    expect(assessFundamentals(empty).stockType).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { scoreFundamentals } from "@/lib/fundamentals/score";

describe("scoreFundamentals", () => {
  it("全条件を満たすと 5 点満点", () => {
    const result = scoreFundamentals({
      per: 20,
      forwardPer: 15,
      peg: 1.5,
      revenueGrowth: 0.2,
      profitMargin: 0.3,
    });
    expect(result.score).toBe(5);
    expect(result.max).toBe(5);
    expect(result.items.every((i) => i.passed && i.available)).toBe(true);
  });

  it("すべて取得不能なら 0 点で available = false", () => {
    const result = scoreFundamentals({
      per: null,
      forwardPer: null,
      peg: null,
      revenueGrowth: null,
      profitMargin: null,
    });
    expect(result.score).toBe(0);
    expect(result.items.every((i) => !i.available)).toBe(true);
  });

  it("境界値: PER 35 は不合格、34.9 は合格", () => {
    const base = {
      forwardPer: null,
      peg: null,
      revenueGrowth: null,
      profitMargin: null,
    };
    expect(scoreFundamentals({ ...base, per: 35 }).score).toBe(0);
    expect(scoreFundamentals({ ...base, per: 34.9 }).score).toBe(1);
  });

  it("赤字（PER マイナス）は不合格", () => {
    const result = scoreFundamentals({
      per: -10,
      forwardPer: null,
      peg: null,
      revenueGrowth: null,
      profitMargin: null,
    });
    expect(result.score).toBe(0);
  });

  it("予想 PER が実績 PER 以上なら不合格", () => {
    const result = scoreFundamentals({
      per: 20,
      forwardPer: 25,
      peg: null,
      revenueGrowth: null,
      profitMargin: null,
    });
    // PER 20 で 1 点、予想 PER 悪化で 0 点 → 合計 1 点
    expect(result.score).toBe(1);
  });
});

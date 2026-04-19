import { describe, it, expect } from "vitest";
import { calculateStatementDiff } from "@/lib/utils/reconcile";

describe("calculateStatementDiff", () => {
  it("合計と確定額が一致すれば isMatched=true", () => {
    const r = calculateStatementDiff(58342, 58342);
    expect(r.isMatched).toBe(true);
    expect(r.diff).toBe(0);
  });

  it("Payment 合計が多い場合 diff が正の値", () => {
    const r = calculateStatementDiff(60000, 58342);
    expect(r.isMatched).toBe(false);
    expect(r.diff).toBe(1658);
  });

  it("確定額が多い場合 diff は負の値", () => {
    const r = calculateStatementDiff(58000, 58342);
    expect(r.diff).toBe(-342);
    expect(r.isMatched).toBe(false);
  });
});

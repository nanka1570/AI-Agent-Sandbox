import { describe, expect, it } from "vitest";
import { runBacktest } from "@/lib/backtest/run";
import type { PricePoint, Signal } from "@/lib/signals/evaluate";

function day(i: number): Date {
  return new Date(Date.UTC(2026, 0, 1 + i));
}

function toPrices(values: number[]): PricePoint[] {
  return values.map((v, i) => ({ date: day(i), adjClose: v }));
}

function signal(i: number, type: Signal["type"]): Signal {
  return { date: day(i), type, rule: "sma-cross", reason: "" };
}

const fullRange = { from: day(0), to: day(100) };

describe("runBacktest", () => {
  it("初日に買って保有し続けると Buy&Hold と一致する", () => {
    const prices = toPrices([100, 120, 150, 200]);
    const result = runBacktest(prices, [signal(0, "buy")], fullRange);
    expect(result.totalReturnPct).toBeCloseTo(100);
    expect(result.buyHoldReturnPct).toBeCloseTo(100);
    expect(result.tradeCount).toBe(1);
    expect(result.winRate).toBeNull(); // 未決済のため
    expect(result.maxDrawdownPct).toBe(0);
  });

  it("買い→売りの 1 往復のリターンと勝率を計算する", () => {
    const prices = toPrices([100, 120, 150, 200]);
    const result = runBacktest(
      prices,
      [signal(0, "buy"), signal(2, "sell")],
      fullRange
    );
    expect(result.totalReturnPct).toBeCloseTo(50);
    expect(result.buyHoldReturnPct).toBeCloseTo(100);
    expect(result.winRate).toBe(100);
    expect(result.trades[0].returnPct).toBeCloseTo(50);
  });

  it("負け取引は勝率とドローダウンに反映される", () => {
    const prices = toPrices([100, 80, 60, 60]);
    const result = runBacktest(
      prices,
      [signal(0, "buy"), signal(2, "sell")],
      fullRange
    );
    expect(result.totalReturnPct).toBeCloseTo(-40);
    expect(result.winRate).toBe(0);
    expect(result.maxDrawdownPct).toBeCloseTo(40);
  });

  it("保有中の買い・未保有時の売りは無視する", () => {
    const prices = toPrices([100, 110, 120, 130]);
    const result = runBacktest(
      prices,
      [
        signal(0, "sell"), // 未保有 → 無視
        signal(1, "buy"),
        signal(2, "buy"), // 保有中 → 無視
      ],
      fullRange
    );
    expect(result.tradeCount).toBe(1);
    expect(result.trades[0].buyPrice).toBe(110);
  });

  it("期間外のシグナルは使わない", () => {
    const prices = toPrices([100, 110, 120, 130]);
    const result = runBacktest(prices, [signal(0, "buy")], {
      from: day(1),
      to: day(3),
    });
    expect(result.tradeCount).toBe(0);
    expect(result.totalReturnPct).toBe(0);
    // Buy&Hold は期間内の始値→終値で計算される
    expect(result.buyHoldReturnPct).toBeCloseTo((130 / 110 - 1) * 100);
  });

  it("期間内の価格データが不足していればエラー", () => {
    expect(() => runBacktest(toPrices([100]), [], fullRange)).toThrow();
  });
});

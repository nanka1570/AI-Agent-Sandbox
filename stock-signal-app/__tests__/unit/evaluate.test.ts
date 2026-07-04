import { describe, expect, it } from "vitest";
import {
  evaluateRsi,
  evaluateSmaCross,
  recentSignal,
  type PricePoint,
  type Signal,
} from "@/lib/signals/evaluate";

function toPrices(values: number[]): PricePoint[] {
  return values.map((v, i) => ({
    date: new Date(Date.UTC(2026, 0, 1 + i)),
    adjClose: v,
  }));
}

describe("evaluateSmaCross（テスト用に短期2・長期3で検証）", () => {
  it("下降から急騰でゴールデンクロス（買い）が出る", () => {
    // SMA2 が SMA3 を上抜けるのは index 5（値 9 の日）
    const prices = toPrices([10, 9, 8, 7, 6, 9, 12]);
    const signals = evaluateSmaCross(prices, 2, 3);
    expect(signals).toHaveLength(1);
    expect(signals[0].type).toBe("buy");
    expect(signals[0].date).toEqual(prices[5].date);
  });

  it("急騰後の急落でデッドクロス（売り）が出る", () => {
    const prices = toPrices([10, 9, 8, 7, 6, 9, 12, 6, 5]);
    const signals = evaluateSmaCross(prices, 2, 3);
    expect(signals).toHaveLength(2);
    expect(signals[1].type).toBe("sell");
    expect(signals[1].date).toEqual(prices[8].date);
  });

  it("データ不足（長期 SMA が計算できない）ならシグナルなし", () => {
    const signals = evaluateSmaCross(toPrices([1, 2]), 2, 3);
    expect(signals).toEqual([]);
  });
});

describe("evaluateRsi（テスト用に period 2 で検証）", () => {
  it("急落で売られすぎ圏に入った瞬間に買いが出る", () => {
    const prices = toPrices([10, 11, 12, 11.9, 5]);
    const signals = evaluateRsi(prices, 2);
    expect(signals).toHaveLength(1);
    expect(signals[0].type).toBe("buy");
    expect(signals[0].date).toEqual(prices[4].date);
  });

  it("急騰で買われすぎ圏に入った瞬間に売りが出る", () => {
    const prices = toPrices([10, 5, 4, 4.1, 10]);
    const signals = evaluateRsi(prices, 2);
    expect(signals).toHaveLength(1);
    expect(signals[0].type).toBe("sell");
    expect(signals[0].date).toEqual(prices[4].date);
  });

  it("売られすぎ圏に留まる間はシグナルを連発しない", () => {
    const prices = toPrices([10, 11, 12, 11.9, 5, 4, 3, 2]);
    const signals = evaluateRsi(prices, 2);
    expect(signals.filter((s) => s.type === "buy")).toHaveLength(1);
  });
});

describe("recentSignal", () => {
  const signal = (day: number, type: Signal["type"]): Signal => ({
    date: new Date(Date.UTC(2026, 0, day)),
    type,
    rule: "sma-cross",
    reason: "",
  });

  it("cutoff 以降で最新のシグナルを返す", () => {
    const signals = [signal(1, "buy"), signal(10, "sell"), signal(20, "buy")];
    const result = recentSignal(signals, new Date(Date.UTC(2026, 0, 10)));
    expect(result?.type).toBe("buy");
    expect(result?.date).toEqual(new Date(Date.UTC(2026, 0, 20)));
  });

  it("cutoff 以降にシグナルがなければ null（中立）", () => {
    const signals = [signal(1, "buy")];
    expect(recentSignal(signals, new Date(Date.UTC(2026, 0, 10)))).toBeNull();
  });
});

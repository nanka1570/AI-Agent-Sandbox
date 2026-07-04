import { describe, expect, it } from "vitest";
import { rsi } from "@/lib/indicators/rsi";
import { sma } from "@/lib/indicators/sma";

describe("sma", () => {
  it("期間3の移動平均を手計算値と照合する", () => {
    expect(sma([1, 2, 3, 4, 5], 3)).toEqual([null, null, 2, 3, 4]);
  });

  it("期間1は元の値をそのまま返す", () => {
    expect(sma([10, 20, 30], 1)).toEqual([10, 20, 30]);
  });

  it("データ数が期間未満ならすべて null", () => {
    expect(sma([1, 2], 3)).toEqual([null, null]);
  });

  it("期間 0 以下はエラー", () => {
    expect(() => sma([1], 0)).toThrow();
  });
});

describe("rsi", () => {
  it("上昇し続けると 100 になる", () => {
    const values = Array.from({ length: 20 }, (_, i) => 100 + i);
    const result = rsi(values, 14);
    expect(result[14]).toBe(100);
    expect(result[19]).toBe(100);
  });

  it("下落し続けると 0 になる", () => {
    const values = Array.from({ length: 20 }, (_, i) => 100 - i);
    const result = rsi(values, 14);
    expect(result[14]).toBe(0);
    expect(result[19]).toBe(0);
  });

  it("上昇と下落が同幅なら 50 になる", () => {
    // 変化幅が +1, -1 の繰り返し → 平均上昇幅 = 平均下落幅 → RSI 50
    const values = Array.from({ length: 16 }, (_, i) => (i % 2 === 0 ? 0 : 1));
    const result = rsi(values, 14);
    expect(result[14]).toBeCloseTo(50, 5);
  });

  it("データ数が period 以下ならすべて null", () => {
    expect(rsi([1, 2, 3], 14)).toEqual([null, null, null]);
  });
});

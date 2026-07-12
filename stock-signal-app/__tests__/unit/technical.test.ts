import { describe, expect, it } from "vitest";
import { bollinger } from "@/lib/indicators/bollinger";
import { deviationFromSma } from "@/lib/indicators/deviation";
import { evaluatePriceCross, type PricePoint } from "@/lib/signals/evaluate";
import {
  analyzeTechnicalState,
  type DailyBar,
} from "@/lib/signals/technical-state";

function toPrices(values: number[]): PricePoint[] {
  return values.map((v, i) => ({
    date: new Date(Date.UTC(2026, 0, 1 + i)),
    adjClose: v,
  }));
}

// 出来高・実体は指定がなければ「普通の陽線・一定出来高」
function toBars(
  values: number[],
  overrides: (i: number) => Partial<DailyBar> = () => ({})
): DailyBar[] {
  return values.map((v, i) => ({
    date: new Date(Date.UTC(2020, 0, 1 + i)),
    adjClose: v,
    open: v,
    close: v,
    volume: 1_000_000,
    ...overrides(i),
  }));
}

describe("bollinger", () => {
  it("値が一定なら上限・下限とも平均と一致する（σ=0）", () => {
    const result = bollinger([10, 10, 10, 10, 10], 5, 2);
    expect(result[4]).toEqual({ middle: 10, upper: 10, lower: 10 });
  });

  it("±2σ を手計算値と照合する", () => {
    // [1..5]: 平均3、母標準偏差 √2 → 上限 3+2√2
    const result = bollinger([1, 2, 3, 4, 5], 5, 2);
    expect(result[4].middle).toBe(3);
    expect(result[4].upper).toBeCloseTo(3 + 2 * Math.SQRT2, 10);
    expect(result[4].lower).toBeCloseTo(3 - 2 * Math.SQRT2, 10);
  });

  it("期間未満は null", () => {
    const result = bollinger([1, 2], 5, 2);
    expect(result[1]).toEqual({ middle: null, upper: null, lower: null });
  });
});

describe("deviationFromSma", () => {
  it("乖離率を手計算値と照合する", () => {
    // SMA2 = (100+100)/2 = 100 に対して価格 110 → +10%
    const result = deviationFromSma([100, 100, 110], 2);
    // index2: SMA2 = (100+110)/2 = 105 → (110-105)/105 = +4.7619%
    expect(result[2]).toBeCloseTo(((110 - 105) / 105) * 100, 6);
  });
});

describe("evaluatePriceCross（テスト用に period 3）", () => {
  it("価格が移動平均線を上抜けたら買い", () => {
    // 下降で価格 < SMA3 の状態を作り、急騰で上抜けさせる
    const prices = toPrices([10, 9, 8, 7, 9.5]);
    const signals = evaluatePriceCross(prices, 3);
    expect(signals).toHaveLength(1);
    expect(signals[0].type).toBe("buy");
    expect(signals[0].date).toEqual(prices[4].date);
  });

  it("価格が移動平均線を下に割ったら売り", () => {
    const prices = toPrices([10, 11, 12, 13, 10]);
    const signals = evaluatePriceCross(prices, 3);
    expect(signals).toHaveLength(1);
    expect(signals[0].type).toBe("sell");
  });
});

describe("analyzeTechnicalState", () => {
  it("上昇し続ける銘柄はパーフェクトオーダーになり長期トレンドも上", () => {
    const values = Array.from({ length: 260 }, (_, i) => 100 + i);
    const state = analyzeTechnicalState(toBars(values));
    expect(state.perfectOrder).toBe(true);
    expect(state.longTrend).toBe("up");
    expect(state.aboveSma).toEqual({
      sma5: true,
      sma25: true,
      sma75: true,
      sma200: true,
    });
  });

  it("下落し続ける銘柄は長期トレンドが下でパーフェクトオーダーでない", () => {
    const values = Array.from({ length: 260 }, (_, i) => 400 - i);
    const state = analyzeTechnicalState(toBars(values));
    expect(state.perfectOrder).toBe(false);
    expect(state.longTrend).toBe("down");
  });

  it("出来高急増 + 大陽線を検知する", () => {
    const values = Array.from({ length: 60 }, () => 100);
    values[59] = 105;
    const state = analyzeTechnicalState(
      toBars(values, (i) =>
        i === 59
          ? { open: 100, close: 105, volume: 3_000_000 } // 平均の約3倍 + 実体+5%
          : {}
      )
    );
    expect(state.volumeSurgeBullish).toBe(true);
  });

  it("出来高が平均並みなら急増と判定しない", () => {
    const values = Array.from({ length: 60 }, () => 100);
    values[59] = 105;
    const state = analyzeTechnicalState(
      toBars(values, (i) => (i === 59 ? { open: 100, close: 105 } : {}))
    );
    expect(state.volumeSurgeBullish).toBe(false);
  });

  it("高値圏で出来高が細ると警戒を出す", () => {
    // 260日上昇（高値圏）+ 直近20日の出来高が以前の半分
    const values = Array.from({ length: 260 }, (_, i) => 100 + i);
    const state = analyzeTechnicalState(
      toBars(values, (i) => (i >= 240 ? { volume: 400_000 } : {}))
    );
    expect(state.volumeFadeAtHigh).toBe(true);
    expect(state.lowVolumeRally).toBe(true); // 上昇中なのに出来高減 = 信頼しない
  });

  it("25日線から大きく乖離すると天井警戒", () => {
    const values = Array.from({ length: 60 }, () => 100);
    values[59] = 130; // SMA25 ≒ 101 に対して約 +29%
    const state = analyzeTechnicalState(toBars(values));
    expect(state.kairiWarning).toBe(true);
    expect(state.bbPosition).toBe("upper"); // 急騰は BB 上限も突き抜ける
  });

  it("逆行高: 指数が下落した日に上昇した銘柄を検知する", () => {
    const stock = toBars([100, 100, 101]); // 最終日 +1%
    const bench = [98, 100, 99].map((v, i) => ({
      date: new Date(Date.UTC(2020, 0, 1 + i)),
      adjClose: v,
    })); // 最終日 -1%
    const state = analyzeTechnicalState(stock, bench);
    expect(state.counterTrendUp).toBe(true);
  });

  it("ベンチマークの日付が一致しない場合は逆行高を判定しない", () => {
    const stock = toBars([100, 101]);
    const bench = [
      { date: new Date(Date.UTC(2019, 0, 1)), adjClose: 100 },
      { date: new Date(Date.UTC(2019, 0, 2)), adjClose: 99 },
    ];
    expect(analyzeTechnicalState(stock, bench).counterTrendUp).toBeNull();
  });
});

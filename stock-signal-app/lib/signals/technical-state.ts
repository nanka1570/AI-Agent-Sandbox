import { bollinger } from "@/lib/indicators/bollinger";
import { deviationFromSma } from "@/lib/indicators/deviation";
import { sma } from "@/lib/indicators/sma";
import {
  SMA_LONG_PERIOD,
  SMA_MID2_PERIOD,
  SMA_MID_PERIOD,
  SMA_SHORT_PERIOD,
} from "./evaluate";

// 1 日分の生データ（出来高判定には調整前の open/close を使う）
export interface DailyBar {
  date: Date;
  adjClose: number;
  open: number;
  close: number;
  volume: number;
}

// ── 判定閾値（判断基準に基づく。変更する場合はここだけ直す） ──
export const VOLUME_SURGE_RATIO = 2; // 出来高が20日平均の2倍以上 = 急増
export const BIG_BULL_BODY = 0.02; // 実体（終値-始値）が始値の +2% 以上 = 大陽線
export const KAIRI_WARN_PCT = 15; // 25日線から +15% 以上の乖離 = 天井警戒
export const NEAR_HIGH_RATIO = 0.95; // 250日高値の 95% 以上 = 高値圏
export const VOLUME_FADE_RATIO = 0.8; // 20日平均出来高 < 60日平均の8割 = 出来高減少
export const LOW_VOL_RALLY_RETURN = 5; // 20日で +5% 以上の上昇（出来高を伴うかの確認対象）
export const COUNTER_TREND_MOVE = 0.003; // 逆行高判定: 指数 -0.3% 以下の日に +0.3% 以上

export interface TechnicalState {
  // 価格が各移動平均線の上にあるか（上 = 上昇トレンド）
  aboveSma: {
    sma5: boolean | null;
    sma25: boolean | null;
    sma75: boolean | null;
    sma200: boolean | null;
  };
  longTrend: "up" | "down" | null; // 200日線基準の長期トレンド
  perfectOrder: boolean | null; // 5>25>75>200 かつ全 MA が上向き
  kairi25: number | null; // 25日線乖離率（%）
  kairiWarning: boolean; // 乖離が大きい = 天井警戒
  bbPosition: "upper" | "lower" | null; // 終値が ±2σ の外側（タッチ）
  volumeSurgeBullish: boolean; // 出来高急増 + 大陽線 = 強い買いのサイン
  volumeFadeAtHigh: boolean; // 高値圏で出来高減少 = 買いの勢い低下
  lowVolumeRally: boolean; // 出来高を伴わない上昇 = 信頼しない
  return20d: number | null; // 20日騰落率（%）。セクター内の相対強度比較に使う
  counterTrendUp: boolean | null; // 地合いが悪い日の逆行高（ベンチマーク必要）
}

export function analyzeTechnicalState(
  bars: DailyBar[],
  benchmark?: { date: Date; adjClose: number }[]
): TechnicalState {
  const values = bars.map((b) => b.adjClose);
  const last = values.length - 1;

  const sma5 = sma(values, SMA_SHORT_PERIOD);
  const sma25 = sma(values, SMA_MID_PERIOD);
  const sma75 = sma(values, SMA_MID2_PERIOD);
  const sma200 = sma(values, SMA_LONG_PERIOD);

  const above = (line: (number | null)[]): boolean | null =>
    last >= 0 && line[last] != null ? values[last] > (line[last] as number) : null;

  // パーフェクトオーダー: 全 MA が揃って上向きに整列
  let perfectOrder: boolean | null = null;
  if (last >= SMA_LONG_PERIOD + 4) {
    const rising = (line: (number | null)[]) =>
      line[last] != null &&
      line[last - 5] != null &&
      (line[last] as number) > (line[last - 5] as number);
    const s5 = sma5[last] as number;
    const s25 = sma25[last] as number;
    const s75 = sma75[last] as number;
    const s200 = sma200[last] as number;
    perfectOrder =
      s5 > s25 &&
      s25 > s75 &&
      s75 > s200 &&
      rising(sma5) &&
      rising(sma25) &&
      rising(sma75) &&
      rising(sma200);
  }

  const kairiSeries = deviationFromSma(values, SMA_MID_PERIOD);
  const kairi25 = last >= 0 ? kairiSeries[last] : null;

  const bb = bollinger(values, SMA_MID_PERIOD, 2);
  let bbPosition: TechnicalState["bbPosition"] = null;
  if (last >= 0 && bb[last].upper != null) {
    if (values[last] >= (bb[last].upper as number)) bbPosition = "upper";
    else if (values[last] <= (bb[last].lower as number)) bbPosition = "lower";
  }

  // ── 出来高判定 ──
  const volumes = bars.map((b) => b.volume);
  const avg = (arr: number[]) =>
    arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
  const avg20 = last + 1 >= 20 ? avg(volumes.slice(last - 19, last + 1)) : null;
  const avg60 = last + 1 >= 60 ? avg(volumes.slice(last - 59, last + 1)) : null;

  const lastBar = bars[last];
  const volumeSurgeBullish =
    avg20 != null &&
    lastBar != null &&
    lastBar.volume >= avg20 * VOLUME_SURGE_RATIO &&
    lastBar.open > 0 &&
    (lastBar.close - lastBar.open) / lastBar.open >= BIG_BULL_BODY;

  const high250 =
    last + 1 >= 250 ? Math.max(...values.slice(last - 249, last + 1)) : null;
  const nearHigh = high250 != null && values[last] >= high250 * NEAR_HIGH_RATIO;
  const volumeFading =
    avg20 != null && avg60 != null && avg20 < avg60 * VOLUME_FADE_RATIO;
  const volumeFadeAtHigh = nearHigh && volumeFading;

  const return20d =
    last >= 20 && values[last - 20] > 0
      ? (values[last] / values[last - 20] - 1) * 100
      : null;
  const lowVolumeRally =
    return20d != null && return20d >= LOW_VOL_RALLY_RETURN && volumeFading;

  // ── 逆行高（指数が下落した日に上昇 = 相対的に強い） ──
  let counterTrendUp: boolean | null = null;
  if (benchmark && benchmark.length >= 2 && bars.length >= 2) {
    const bLast = benchmark[benchmark.length - 1];
    if (bLast.date.getTime() === bars[last].date.getTime()) {
      const bPrev = benchmark[benchmark.length - 2];
      const benchChange = bLast.adjClose / bPrev.adjClose - 1;
      const stockChange = values[last] / values[last - 1] - 1;
      counterTrendUp =
        benchChange <= -COUNTER_TREND_MOVE && stockChange >= COUNTER_TREND_MOVE;
    }
  }

  return {
    aboveSma: {
      sma5: above(sma5),
      sma25: above(sma25),
      sma75: above(sma75),
      sma200: above(sma200),
    },
    longTrend:
      above(sma200) == null ? null : above(sma200) ? "up" : "down",
    perfectOrder,
    kairi25,
    kairiWarning: kairi25 != null && kairi25 >= KAIRI_WARN_PCT,
    bbPosition,
    volumeSurgeBullish,
    volumeFadeAtHigh,
    lowVolumeRally,
    return20d,
    counterTrendUp,
  };
}

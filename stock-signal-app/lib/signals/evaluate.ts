import { rsi } from "@/lib/indicators/rsi";
import { sma } from "@/lib/indicators/sma";

export type SignalType = "buy" | "sell";
export type RuleId = "sma-cross" | "price-cross" | "rsi";

export interface Signal {
  date: Date;
  type: SignalType;
  rule: RuleId;
  reason: string;
}

export interface PricePoint {
  date: Date;
  adjClose: number;
}

// MA 体系: 短期 5 / 中期 25・75 / 長期 200（日本のチャート分析の慣習に合わせる）
export const SMA_SHORT_PERIOD = 5;
export const SMA_MID_PERIOD = 25;
export const SMA_MID2_PERIOD = 75;
export const SMA_LONG_PERIOD = 200;
// 長期トレンド（200日線）判定に必要な最低データ数
export const MIN_DATA_POINTS = SMA_LONG_PERIOD + 1;
// 短期シグナル（5/25 クロス）に必要な最低データ数
export const MIN_SHORT_DATA_POINTS = SMA_MID_PERIOD + 1;

// ゴールデンクロス（5日線が25日線を上抜け）→ 買い
// デッドクロス（下抜け）→ 売り
export function evaluateSmaCross(
  prices: PricePoint[],
  shortPeriod = SMA_SHORT_PERIOD,
  longPeriod = SMA_MID_PERIOD
): Signal[] {
  const values = prices.map((p) => p.adjClose);
  const short = sma(values, shortPeriod);
  const long = sma(values, longPeriod);
  const signals: Signal[] = [];

  for (let i = 1; i < prices.length; i++) {
    const prevShort = short[i - 1];
    const prevLong = long[i - 1];
    const curShort = short[i];
    const curLong = long[i];
    if (
      prevShort == null ||
      prevLong == null ||
      curShort == null ||
      curLong == null
    ) {
      continue;
    }
    if (prevShort <= prevLong && curShort > curLong) {
      signals.push({
        date: prices[i].date,
        type: "buy",
        rule: "sma-cross",
        reason: `ゴールデンクロス: SMA${shortPeriod} が SMA${longPeriod} を上抜け`,
      });
    } else if (prevShort >= prevLong && curShort < curLong) {
      signals.push({
        date: prices[i].date,
        type: "sell",
        rule: "sma-cross",
        reason: `デッドクロス: SMA${shortPeriod} が SMA${longPeriod} を下抜け`,
      });
    }
  }
  return signals;
}

// 価格が移動平均線（既定 25日線）を下から上に抜けたら買い、上から下に割ったら売り
export function evaluatePriceCross(
  prices: PricePoint[],
  period = SMA_MID_PERIOD
): Signal[] {
  const values = prices.map((p) => p.adjClose);
  const line = sma(values, period);
  const signals: Signal[] = [];

  for (let i = 1; i < prices.length; i++) {
    const prevLine = line[i - 1];
    const curLine = line[i];
    if (prevLine == null || curLine == null) continue;
    const prev = values[i - 1];
    const cur = values[i];
    if (prev <= prevLine && cur > curLine) {
      signals.push({
        date: prices[i].date,
        type: "buy",
        rule: "price-cross",
        reason: `価格が ${period}日線を上抜け`,
      });
    } else if (prev >= prevLine && cur < curLine) {
      signals.push({
        date: prices[i].date,
        type: "sell",
        rule: "price-cross",
        reason: `価格が ${period}日線を下抜け`,
      });
    }
  }
  return signals;
}

// RSI が売られすぎ圏（30 以下）に入った瞬間 → 買い
// 買われすぎ圏（70 以上）に入った瞬間 → 売り
// （圏内に留まる間の連発を防ぐため「入った瞬間」のみシグナルとする）
export function evaluateRsi(
  prices: PricePoint[],
  period = 14,
  oversold = 30,
  overbought = 70
): Signal[] {
  const values = prices.map((p) => p.adjClose);
  const r = rsi(values, period);
  const signals: Signal[] = [];

  for (let i = 1; i < prices.length; i++) {
    const prev = r[i - 1];
    const cur = r[i];
    if (prev == null || cur == null) continue;
    if (prev > oversold && cur <= oversold) {
      signals.push({
        date: prices[i].date,
        type: "buy",
        rule: "rsi",
        reason: `RSI(${period}) が ${oversold} 以下（売られすぎ）: ${cur.toFixed(1)}`,
      });
    } else if (prev < overbought && cur >= overbought) {
      signals.push({
        date: prices[i].date,
        type: "sell",
        rule: "rsi",
        reason: `RSI(${period}) が ${overbought} 以上（買われすぎ）: ${cur.toFixed(1)}`,
      });
    }
  }
  return signals;
}

// ダッシュボードの「現在シグナル」: cutoff 以降で最新のシグナルを返す（なければ中立 = null）
export function recentSignal(signals: Signal[], cutoff: Date): Signal | null {
  for (let i = signals.length - 1; i >= 0; i--) {
    if (signals[i].date >= cutoff) return signals[i];
  }
  return null;
}

import { sma } from "./sma";

// ボリンジャーバンド（±kσ、σ は母標準偏差）
// ±2σ には価格の約 95% が収まるとされる
export interface BollingerPoint {
  middle: number | null;
  upper: number | null;
  lower: number | null;
}

export function bollinger(
  values: number[],
  period = 25,
  k = 2
): BollingerPoint[] {
  const middle = sma(values, period);
  return values.map((_, i) => {
    const m = middle[i];
    if (m == null) return { middle: null, upper: null, lower: null };
    let sumSq = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sumSq += (values[j] - m) ** 2;
    }
    const sd = Math.sqrt(sumSq / period);
    return { middle: m, upper: m + k * sd, lower: m - k * sd };
  });
}

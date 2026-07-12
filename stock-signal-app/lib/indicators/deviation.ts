import { sma } from "./sma";

// 移動平均線からの乖離率（%）
// 例: 価格 110・SMA 100 → +10。25日線から大きく乖離したら天井警戒に使う
export function deviationFromSma(
  values: number[],
  period = 25
): (number | null)[] {
  const base = sma(values, period);
  return values.map((v, i) => {
    const m = base[i];
    if (m == null || m === 0) return null;
    return ((v - m) / m) * 100;
  });
}

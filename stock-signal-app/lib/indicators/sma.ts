// 単純移動平均（SMA）
// 各位置に対して直近 period 個の平均を返す。データ不足の先頭は null
export function sma(values: number[], period: number): (number | null)[] {
  if (period < 1) {
    throw new Error(`period は 1 以上を指定してください: ${period}`);
  }
  const result: (number | null)[] = new Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) {
      sum -= values[i - period];
    }
    if (i >= period - 1) {
      result[i] = sum / period;
    }
  }
  return result;
}

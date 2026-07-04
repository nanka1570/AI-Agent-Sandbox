// RSI（相対力指数）: Wilder 方式の平滑化
// 各位置の RSI を返す。計算に必要な period 本が揃わない先頭は null
export function rsi(values: number[], period = 14): (number | null)[] {
  if (period < 1) {
    throw new Error(`period は 1 以上を指定してください: ${period}`);
  }
  const result: (number | null)[] = new Array(values.length).fill(null);
  if (values.length <= period) {
    return result;
  }

  let avgGain = 0;
  let avgLoss = 0;

  // 初期値: 最初の period 本の変化幅の単純平均
  for (let i = 1; i <= period; i++) {
    const change = values[i] - values[i - 1];
    if (change > 0) avgGain += change;
    else avgLoss -= change;
  }
  avgGain /= period;
  avgLoss /= period;
  result[period] = toRsi(avgGain, avgLoss);

  // 以降は Wilder の平滑化
  for (let i = period + 1; i < values.length; i++) {
    const change = values[i] - values[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    result[i] = toRsi(avgGain, avgLoss);
  }
  return result;
}

function toRsi(avgGain: number, avgLoss: number): number {
  if (avgLoss === 0) return 100; // 下落なし（横ばい含む）は最強値とする慣例
  return 100 - 100 / (1 + avgGain / avgLoss);
}

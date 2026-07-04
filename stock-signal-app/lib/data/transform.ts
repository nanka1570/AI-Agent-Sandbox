// yahoo-finance2 のレスポンスを DB 保存用の形に変換する純粋関数群

export interface PriceRow {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  adjClose: number;
  volume: number;
}

// チャート API が返す 1 日分の生データ（必要なフィールドのみ）
export interface RawQuote {
  date: Date;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  adjclose?: number | null;
  volume: number | null;
}

// タイムゾーンずれによる重複行を防ぐため UTC 00:00 に正規化する
export function toUtcMidnight(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}

// 欠損行（休場等で null を含む）を除外し、日付を正規化する
// 同一日が複数来た場合は後の行を採用する
export function mapChartQuotes(quotes: RawQuote[]): PriceRow[] {
  const byDate = new Map<number, PriceRow>();
  for (const q of quotes) {
    if (
      q.open == null ||
      q.high == null ||
      q.low == null ||
      q.close == null ||
      q.volume == null
    ) {
      continue;
    }
    const date = toUtcMidnight(q.date);
    byDate.set(date.getTime(), {
      date,
      open: q.open,
      high: q.high,
      low: q.low,
      close: q.close,
      adjClose: q.adjclose ?? q.close,
      volume: q.volume,
    });
  }
  return [...byDate.values()].sort((a, b) => a.date.getTime() - b.date.getTime());
}

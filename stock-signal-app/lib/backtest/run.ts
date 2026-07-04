import type { PricePoint, Signal } from "@/lib/signals/evaluate";

// 約定はシグナル当日の調整後終値（手数料・スリッページ・税は考慮しない簡易モデル）

export interface Trade {
  buyDate: Date;
  buyPrice: number;
  sellDate: Date | null; // null = 期間終了時点で保有中
  sellPrice: number | null;
  returnPct: number | null; // 決済済み取引のみ
}

export interface BacktestResult {
  totalReturnPct: number;
  buyHoldReturnPct: number;
  winRate: number | null; // 決済済み取引がない場合 null
  tradeCount: number; // 買い entry の回数
  maxDrawdownPct: number;
  trades: Trade[];
}

export interface BacktestOptions {
  from: Date;
  to: Date;
}

// prices はウォームアップ込みの全期間、signals も全期間分を渡す
// （このなかで from〜to に絞る。期間初日から SMA200 由来のシグナルが有効）
export function runBacktest(
  prices: PricePoint[],
  signals: Signal[],
  { from, to }: BacktestOptions
): BacktestResult {
  const range = prices.filter((p) => p.date >= from && p.date <= to);
  if (range.length < 2) {
    throw new Error("バックテスト期間内の価格データが不足しています");
  }
  const signalByDate = new Map<number, Signal>();
  for (const s of signals) {
    if (s.date >= from && s.date <= to) {
      signalByDate.set(s.date.getTime(), s); // 同日は最後のシグナルを採用
    }
  }

  const initialCapital = range[0].adjClose; // 1株分を基準にした相対値（結果は%のみ使う）
  let cash = initialCapital;
  let shares = 0;
  const trades: Trade[] = [];
  let peak = -Infinity;
  let maxDrawdownPct = 0;

  for (const p of range) {
    const signal = signalByDate.get(p.date.getTime());
    if (signal?.type === "buy" && shares === 0) {
      shares = cash / p.adjClose;
      cash = 0;
      trades.push({
        buyDate: p.date,
        buyPrice: p.adjClose,
        sellDate: null,
        sellPrice: null,
        returnPct: null,
      });
    } else if (signal?.type === "sell" && shares > 0) {
      cash = shares * p.adjClose;
      shares = 0;
      const trade = trades[trades.length - 1];
      trade.sellDate = p.date;
      trade.sellPrice = p.adjClose;
      trade.returnPct = (p.adjClose / trade.buyPrice - 1) * 100;
    }
    // 保有中の買い・未保有時の売りは無視する

    const equity = cash + shares * p.adjClose;
    peak = Math.max(peak, equity);
    maxDrawdownPct = Math.max(maxDrawdownPct, (1 - equity / peak) * 100);
  }

  // 期間終了時に残ったポジションは最終日の調整後終値で評価
  const last = range[range.length - 1];
  const finalEquity = cash + shares * last.adjClose;

  const closed = trades.filter((t) => t.returnPct != null);
  return {
    totalReturnPct: (finalEquity / initialCapital - 1) * 100,
    buyHoldReturnPct: (last.adjClose / range[0].adjClose - 1) * 100,
    winRate:
      closed.length > 0
        ? (closed.filter((t) => (t.returnPct as number) > 0).length /
            closed.length) *
          100
        : null,
    tradeCount: trades.length,
    maxDrawdownPct,
    trades,
  };
}

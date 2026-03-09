import { formatCurrency } from "@/lib/utils/format";

interface SummaryCardsProps {
  salaryTotal: number;
  paymentTotal: number;
  balance: number;
  confirmedBalance: number;
}

export function SummaryCards({
  salaryTotal,
  paymentTotal,
  balance,
  confirmedBalance,
}: SummaryCardsProps) {
  const isNegativeBalance = balance < 0;
  const balancePercent = salaryTotal > 0 ? ((balance / salaryTotal) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-3 animate-fadein-2">
      {/* 残額メインパネル */}
      <div className="data-panel bracket-frame bracket-bottom glow-breathe p-5" style={{ borderColor: 'rgba(255,179,0,0.15)' }}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="font-mono text-[8px] text-muted-foreground tracking-[0.3em]">REMAINING</p>
            <p className="text-xs text-sage-gold mt-0.5">残存魔素量</p>
          </div>
          <p className="font-mono text-[9px] text-muted-foreground tracking-wider">{balancePercent}%</p>
        </div>
        <p className={`font-mono text-3xl font-bold tracking-wider text-right mb-3 ${
          isNegativeBalance ? "text-destructive" : "text-sage-gold-bright glow-gold"
        }`}>
          {formatCurrency(balance)}
        </p>
        <div className="main-gauge">
          <div
            className="main-gauge-fill"
            style={{ width: `${Math.max(0, Math.min(100, parseFloat(balancePercent)))}%` }}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,179,0,0.06)' }}>
          <div>
            <p className="font-mono text-[7px] text-muted-foreground tracking-[0.3em]">INCOME</p>
            <p className="text-[10px] text-sage-text-dim mt-0.5">魔素収入</p>
            <p className="font-mono text-base tracking-wide mt-1 text-sage-text">{formatCurrency(salaryTotal)}</p>
          </div>
          <div>
            <p className="font-mono text-[7px] text-muted-foreground tracking-[0.3em]">EXPENDITURE</p>
            <p className="text-[10px] text-sage-text-dim mt-0.5">魔素消費</p>
            <p className="font-mono text-base text-destructive tracking-wide mt-1">{formatCurrency(paymentTotal)}</p>
          </div>
        </div>
      </div>

      {/* 確定分残額 */}
      <div className="data-panel skill-flash p-3 px-4" style={{ borderColor: 'rgba(255,213,79,0.18)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="hex-icon" style={{ background: 'rgba(255,179,0,0.12)', color: '#FFB300' }}>確</div>
            <div>
              <p className="font-mono text-[7px] text-sage-gold tracking-[0.2em]">CONFIRMED</p>
              <p className="text-[11px] text-sage-gold">確定済残存魔素</p>
            </div>
          </div>
          <p className="font-mono text-lg font-bold text-sage-gold-bright glow-gold tracking-wider">
            {formatCurrency(confirmedBalance)}
          </p>
        </div>
      </div>
    </div>
  );
}

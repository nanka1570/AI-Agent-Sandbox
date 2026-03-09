import { PAYMENT_STATUSES, PAYMENT_STATUS_DISPLAY } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils/format";

interface StatusBreakdownProps {
  statusBreakdown: {
    unconfirmed: number;
    confirmed: number;
    paid: number;
  };
}

export function StatusBreakdown({ statusBreakdown }: StatusBreakdownProps) {
  const total = statusBreakdown.unconfirmed + statusBreakdown.confirmed + statusBreakdown.paid;

  /** 六角アイコン・ゲージの表示設定（共通定義にない部分） */
  const HEX_CONFIG = {
    unconfirmed: { hexLabel: "予", hexBg: `${PAYMENT_STATUS_DISPLAY.unconfirmed.color}1F`, gaugeGradient: "linear-gradient(90deg, #E65100, #FF8F00)" },
    confirmed:   { hexLabel: "確", hexBg: `${PAYMENT_STATUS_DISPLAY.confirmed.color}1A`,   gaugeGradient: "linear-gradient(90deg, #FF8F00, #FFB300)" },
    paid:        { hexLabel: "済", hexBg: `${PAYMENT_STATUS_DISPLAY.paid.color}14`,         gaugeGradient: "linear-gradient(90deg, #2E7D32, #69F0AE)" },
  } as const;

  const items = (["unconfirmed", "confirmed", "paid"] as const).map((key) => {
    const status = PAYMENT_STATUSES[key];
    const display = PAYMENT_STATUS_DISPLAY[key];
    const hex = HEX_CONFIG[key];
    return {
      key,
      label: status.label,
      amount: statusBreakdown[key],
      hexLabel: hex.hexLabel,
      hexBg: hex.hexBg,
      hexColor: display.color,
      engLabel: display.engLabel,
      colorClass: display.colorClass,
      gaugeGradient: hex.gaugeGradient,
      isPulsing: display.isPulsing,
    };
  });

  return (
    <div className="space-y-2 animate-fadein-3">
      <div className="section-label">
        <div className="section-label-line left" />
        <div className="section-label-tag font-mono">SKILL LIST</div>
        <div className="section-label-line right" />
      </div>

      {items.map((item) => {
        const percent = total > 0 ? ((item.amount / total) * 100).toFixed(1) : "0";
        return (
          <div
            key={item.key}
            className={`data-panel p-3 px-4 ${item.isPulsing ? "stream-bg" : ""}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="hex-icon" style={{ background: item.hexBg, color: item.hexColor }}>
                  {item.hexLabel}
                </div>
                <div>
                  <p className="text-sm text-sage-text">{item.label}</p>
                  <p className={`font-mono text-[8px] ${item.colorClass} tracking-wider ${item.isPulsing ? "animate-pulse-slow" : ""}`}>
                    {item.engLabel}
                  </p>
                </div>
              </div>
              <p className={`font-mono text-base ${item.colorClass} tracking-wider`}>
                {formatCurrency(item.amount)}
              </p>
            </div>
            <div className="gauge mt-2">
              <div
                className="gauge-fill"
                style={{ width: `${percent}%`, background: item.gaugeGradient }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

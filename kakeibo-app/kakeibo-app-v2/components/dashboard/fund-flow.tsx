import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils/format";
import { PAYMENT_STATUS_DISPLAY } from "@/lib/constants";
import type { DashboardData } from "@/lib/utils/dashboard";

interface FundFlowProps {
  fundFlow: DashboardData["fundFlow"];
}

/** タイムラインノードの追加表示設定（共通定義にない部分） */
const NODE_STYLES = {
  paid: { nodeClass: "done", nodeStyle: {} },
  confirmed: { nodeClass: "", nodeStyle: {} },
  unconfirmed: { nodeClass: "", nodeStyle: { borderColor: PAYMENT_STATUS_DISPLAY.unconfirmed.color } },
} as const;

export function FundFlow({ fundFlow }: FundFlowProps) {
  if (fundFlow.length === 0) {
    return (
      <p className="text-sm text-muted-foreground font-bold">
        データがありません
      </p>
    );
  }

  const hasBeforePayDayWarning = fundFlow.some(
    (entry) => entry.isBeforePayDay && entry.type !== "salary"
  );

  return (
    <div className="animate-fadein-4">
      <div className="relative pl-9 pb-2">
        <div className="tl-track" />

        {fundFlow.map((entry, index) => {
          const isSalary = entry.type === "salary";
          const status = entry.status ?? "unconfirmed";
          const display = PAYMENT_STATUS_DISPLAY[status];
          const node = NODE_STYLES[status];

          return (
            <div key={`${entry.type}-${entry.label}-${index}`} className="flex items-start gap-3 mb-5">
              <div
                className={`tl-node ${isSalary ? "special" : node.nodeClass}`}
                style={{
                  marginLeft: '-24px',
                  marginTop: '4px',
                  ...(!isSalary ? node.nodeStyle : {}),
                }}
              />
              <div className="flex-1">
                {isSalary ? (
                  <div className="data-panel skill-flash p-3 px-4" style={{ borderColor: 'rgba(255,213,79,0.18)' }}>
                    <div className="flex items-baseline justify-between">
                      <div>
                        <p className="font-mono text-[10px] text-sage-gold tracking-wider">
                          {format(entry.date, "MM/dd")}
                        </p>
                        <p className="text-[13px] text-sage-gold-bright font-bold mt-0.5">
                          {entry.label}
                        </p>
                      </div>
                      <p className="font-mono text-base text-sage-gold-bright glow-gold tracking-wider font-bold">
                        +{formatCurrency(entry.amount)}
                      </p>
                    </div>
                    <p className="text-[10px] text-sage-gold mt-1.5">
                      Extra Skill『魔素補給』発動
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline justify-between">
                      <div>
                        <p className="font-mono text-[10px] text-muted-foreground tracking-wider">
                          {format(entry.date, "MM/dd")}
                        </p>
                        <p className="text-[13px] mt-0.5 text-sage-text">
                          {entry.label}
                        </p>
                      </div>
                      <p className="font-mono text-[13px] text-destructive tracking-wider">
                        -{formatCurrency(entry.amount)}
                      </p>
                    </div>
                    <p className={`font-mono text-[7px] ${display.colorClass} tracking-[0.2em] mt-1 ${display.isPulsing ? "animate-pulse-slow" : ""}`}>
                      {display.icon} {display.engLabel}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {hasBeforePayDayWarning && (
        <div className="warn-panel mt-3">
          <p className="text-xs text-destructive leading-relaxed">
            <span className="font-bold">⚠ 警告。</span>給料日前に引落が集中しています。
          </p>
          <p className="text-[11px] text-destructive leading-relaxed mt-1" style={{ opacity: 0.75 }}>
            Unique Skill『捕食者<span className="text-[9px] text-sage-text-dim">（くいしんぼう）</span>』による支出抑制を推奨します。
          </p>
        </div>
      )}
    </div>
  );
}

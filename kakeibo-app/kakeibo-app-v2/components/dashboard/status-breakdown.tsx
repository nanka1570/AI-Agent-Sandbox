import { Badge } from "@/components/ui/badge";
import { PAYMENT_STATUSES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils/format";

interface StatusBreakdownProps {
  statusBreakdown: {
    unconfirmed: number;
    confirmed: number;
    paid: number;
  };
}

/**
 * ステータス別内訳
 * 未確定・確定・支払済の金額を Badge + 金額で横並び表示
 */
export function StatusBreakdown({ statusBreakdown }: StatusBreakdownProps) {
  const items = [
    {
      key: "unconfirmed" as const,
      ...PAYMENT_STATUSES.unconfirmed,
      amount: statusBreakdown.unconfirmed,
    },
    {
      key: "confirmed" as const,
      ...PAYMENT_STATUSES.confirmed,
      amount: statusBreakdown.confirmed,
    },
    {
      key: "paid" as const,
      ...PAYMENT_STATUSES.paid,
      amount: statusBreakdown.paid,
    },
  ];

  return (
    <div className="flex flex-wrap gap-4">
      {items.map((item) => (
        <div key={item.key} className="flex items-center gap-2">
          <Badge variant={item.variant}>{item.label}</Badge>
          <span className="text-sm font-medium">
            {formatCurrency(item.amount)}
          </span>
        </div>
      ))}
    </div>
  );
}

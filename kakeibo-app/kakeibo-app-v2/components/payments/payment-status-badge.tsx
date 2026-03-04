"use client";

import { Badge } from "@/components/ui/badge";
import { PAYMENT_STATUSES, type PaymentStatus } from "@/lib/constants";

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  onClick?: () => void;
}

/**
 * 支払いステータスを表示するバッジコンポーネント
 * onClick が渡された場合はクリック可能なスタイルになる
 */
export function PaymentStatusBadge({
  status,
  onClick,
}: PaymentStatusBadgeProps) {
  const config = PAYMENT_STATUSES[status];

  return (
    <Badge
      variant={config.variant}
      className={onClick ? "cursor-pointer select-none" : ""}
      onClick={onClick}
    >
      {config.label}
    </Badge>
  );
}

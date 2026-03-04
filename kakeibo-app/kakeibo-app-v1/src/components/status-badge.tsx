"use client";

import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { PaymentStatus } from "@/types";
import { updatePaymentStatus } from "@/lib/actions/payment";

// ステータス設定マップ（design_spec.md: Neo-Brutalism タグ風）
const STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; className: string; clickable: boolean }
> = {
  unconfirmed: {
    label: "未確定",
    className: "border-dashed bg-white text-foreground",
    clickable: true,
  },
  confirmed: {
    label: "確定",
    className: "border-solid bg-yellow-300 text-foreground",
    clickable: true,
  },
  paid: {
    label: "支払い済み",
    className: "border-solid bg-black text-white",
    clickable: true,
  },
};

type Props = {
  paymentId: string;
  status: PaymentStatus;
  readonly?: boolean;
  onClickOverride?: () => Promise<void>; // デフォルトのステータス循環の代わりに呼ばれるカスタムアクション
};

export function StatusBadge({ paymentId, status, readonly, onClickOverride }: Props) {
  const config = STATUS_CONFIG[status];
  const isClickable = config.clickable && !readonly;

  async function handleClick() {
    if (!isClickable) return;
    if (onClickOverride) {
      await onClickOverride();
    } else {
      const result = await updatePaymentStatus(paymentId);
      if (!result.success) {
        toast.error(result.error);
      }
    }
  }

  return (
    <button
      type="button"
      disabled={!isClickable}
      onClick={() => handleClick()}
      className={cn(
        "inline-block border-2 border-border px-2 py-0.5 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
        config.className,
        isClickable && "cursor-pointer hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
        !isClickable && "cursor-default"
      )}
    >
      {config.label}
    </button>
  );
}

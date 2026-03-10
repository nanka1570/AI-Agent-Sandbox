import { getNowJST } from "@/lib/utils/date";
import { calculatePaymentDate, calculateConfirmationDate } from "@/lib/utils/payment-date";
import { PAYMENT_STATUS_KEYS, type PaymentStatus } from "@/lib/constants";

/** 文字列が有効な PaymentStatus かどうかを判定する型ガード */
export function isPaymentStatus(v: string): v is PaymentStatus {
  return (PAYMENT_STATUS_KEYS as readonly string[]).includes(v);
}

interface StatusCheckParams {
  usageMonth: string;
  paymentMonthOffset: number;
  paymentDay: number;
  confirmationDay: number | null;
  confirmationMonthOffset: number | null;
}

export function determineAutoStatus(params: StatusCheckParams): PaymentStatus {
  const today = getNowJST();
  today.setHours(0, 0, 0, 0);

  // 引き落とし日を算出
  const paymentDate = calculatePaymentDate(
    params.usageMonth,
    params.paymentMonthOffset,
    params.paymentDay,
  );
  paymentDate.setHours(0, 0, 0, 0);

  // 優先順: paid > confirmed > unconfirmed
  if (paymentDate <= today) {
    return "paid";
  }

  // 確定日チェック（confirmationDay が設定されている場合のみ）
  if (params.confirmationDay !== null && params.confirmationMonthOffset !== null) {
    const confirmationDate = calculateConfirmationDate(
      params.usageMonth,
      params.confirmationMonthOffset,
      params.confirmationDay,
    );
    confirmationDate.setHours(0, 0, 0, 0);

    if (confirmationDate <= today) {
      return "confirmed";
    }
  }

  return "unconfirmed";
}

export function getNextStatus(current: PaymentStatus): PaymentStatus {
  const cycle: Record<PaymentStatus, PaymentStatus> = {
    unconfirmed: "confirmed",
    confirmed: "paid",
    paid: "unconfirmed",
  };
  return cycle[current];
}

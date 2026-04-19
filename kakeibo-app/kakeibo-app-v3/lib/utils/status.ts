import { getNowJST } from "@/lib/utils/date";
import {
  calculatePaymentDate,
  calculateConfirmationDate,
} from "@/lib/utils/payment-date";
import { PAYMENT_STATUS_KEYS, type PaymentStatus } from "@/lib/constants";

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

  const paymentDate = calculatePaymentDate(
    params.usageMonth,
    params.paymentMonthOffset,
    params.paymentDay,
  );
  paymentDate.setHours(0, 0, 0, 0);

  if (paymentDate <= today) {
    return "paid";
  }

  if (
    params.confirmationDay !== null &&
    params.confirmationMonthOffset !== null
  ) {
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

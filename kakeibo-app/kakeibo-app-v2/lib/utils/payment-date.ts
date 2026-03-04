import { addMonthsToMonth, getDateFromMonthAndDay } from "@/lib/utils/date";

export function calculatePaymentDate(
  usageMonth: string,
  paymentMonthOffset: number,
  paymentDay: number,
): Date {
  const paymentMonth = addMonthsToMonth(usageMonth, paymentMonthOffset);
  return getDateFromMonthAndDay(paymentMonth, paymentDay);
}

export function calculateConfirmationDate(
  usageMonth: string,
  confirmationMonthOffset: number,
  confirmationDay: number,
): Date {
  const confirmationMonth = addMonthsToMonth(usageMonth, confirmationMonthOffset);
  return getDateFromMonthAndDay(confirmationMonth, confirmationDay);
}

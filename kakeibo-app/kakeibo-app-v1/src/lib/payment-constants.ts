/**
 * 支払い関連の共有定数
 * サーバー・クライアント両方で使用される定数を一元管理する
 */

import type { PaymentStatus } from "@/types";

/** paymentDay/closingDay に「末日」を意味する特殊値 */
export const DAY_LAST_OF_MONTH = 32;

/** ステータス遷移マップ（循環: 支払い済み → 未確定に戻れる） */
export const STATUS_TRANSITIONS: Record<PaymentStatus, PaymentStatus> = {
  unconfirmed: "confirmed",
  confirmed: "paid",
  paid: "unconfirmed",
};

/** ステータス優先度: unconfirmed(最悪) > confirmed > paid(最良) */
export const STATUS_PRIORITY: Record<PaymentStatus, number> = {
  unconfirmed: 0,
  confirmed: 1,
  paid: 2,
};

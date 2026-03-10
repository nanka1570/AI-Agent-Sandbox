"use server";

import { revalidatePath } from "next/cache";
import { format, addMonths } from "date-fns";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { getActualDay } from "@/lib/utils";
import { paymentSchema, paymentStatusSchema, type PaymentInput, type ActionResult } from "@/types";
import type { CreditCard } from "@/generated/prisma/client";
import type { PaymentWithCard } from "@/lib/payment-query";
import { STATUS_TRANSITIONS } from "@/lib/payment-constants";

/**
 * 利用月と紐づくカードの設定から初期ステータスを計算する。
 * 引き落とし日が過去 → "paid"、確定日が過去 → "confirmed"、それ以外 → "unconfirmed"
 */
function computeInitialStatus(
  card: CreditCard,
  month: string // 利用月 (例: "2026-01")
): "unconfirmed" | "confirmed" | "paid" {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, mo] = month.split("-").map(Number);

  // 引き落とし日チェック
  const pdBase = new Date(year, mo - 1 + card.paymentMonthOffset, 1);
  const payDay = getActualDay(card.paymentDay, pdBase.getFullYear(), pdBase.getMonth() + 1);
  const payDate = new Date(pdBase.getFullYear(), pdBase.getMonth(), payDay);
  if (payDate <= today) return "paid";

  // 確定日チェック
  if (card.confirmationDay) {
    const offset = card.confirmationMonthOffset ?? 0;
    const cdBase = new Date(year, mo - 1 + offset, 1);
    const confDay = getActualDay(card.confirmationDay, cdBase.getFullYear(), cdBase.getMonth() + 1);
    const confDate = new Date(cdBase.getFullYear(), cdBase.getMonth(), confDay);
    if (confDate <= today) return "confirmed";
  }

  return "unconfirmed";
}

export async function createPayment(
  input: PaymentInput
): Promise<ActionResult<PaymentWithCard>> {
  const userId = await requireAuth();

  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  // クレカ存在確認（自分のカードのみ）
  const card = await prisma.creditCard.findUnique({
    where: { id: parsed.data.creditCardId, userId },
  });
  if (!card) {
    return { success: false, error: "指定されたクレジットカードが見つかりません" };
  }

  const isRecurring = parsed.data.isRecurring ?? false;

  // 繰り返し支払いの場合、グループIDを生成
  const recurringGroupId = isRecurring ? crypto.randomUUID() : null;

  // メインの支払いを作成（確定日・引き落とし日が過去なら自動でステータスを設定）
  const initialStatus = computeInitialStatus(card, parsed.data.month);
  const payment = await prisma.payment.create({
    data: {
      userId,
      creditCardId: parsed.data.creditCardId,
      categoryId: parsed.data.categoryId || null,
      month: parsed.data.month,
      amount: parsed.data.amount,
      memo: parsed.data.memo ?? null,
      isRecurring,
      recurringGroupId,
      status: initialStatus,
    },
    include: { creditCard: true, category: true },
  });

  // 繰り返し支払いの場合、翌月から3ヶ月分を自動生成
  if (isRecurring) {
    const baseDate = new Date(parsed.data.month + "-01");
    for (let i = 1; i <= 3; i++) {
      const futureMonth = format(addMonths(baseDate, i), "yyyy-MM");
      const futureStatus = computeInitialStatus(card, futureMonth);
      await prisma.payment.create({
        data: {
          userId,
          creditCardId: parsed.data.creditCardId,
          categoryId: parsed.data.categoryId || null,
          month: futureMonth,
          amount: parsed.data.amount,
          memo: parsed.data.memo ?? null,
          isRecurring: true,
          recurringGroupId,
          status: futureStatus,
        },
      });
    }
  }

  revalidatePath("/payments");
  revalidatePath("/");

  return { success: true, data: payment };
}

export async function updatePayment(
  id: string,
  input: PaymentInput
): Promise<ActionResult<PaymentWithCard>> {
  const userId = await requireAuth();

  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const existing = await prisma.payment.findUnique({ where: { id, userId } });
  if (!existing) {
    return { success: false, error: "支払いデータが見つかりません" };
  }

  // クレカ存在確認（自分のカードのみ）
  const card = await prisma.creditCard.findUnique({
    where: { id: parsed.data.creditCardId, userId },
  });
  if (!card) {
    return { success: false, error: "指定されたクレジットカードが見つかりません" };
  }

  const payment = await prisma.payment.update({
    where: { id, userId },
    data: {
      creditCardId: parsed.data.creditCardId,
      categoryId: parsed.data.categoryId || null,
      month: parsed.data.month,
      amount: parsed.data.amount,
      memo: parsed.data.memo ?? null,
    },
    include: { creditCard: true, category: true },
  });

  revalidatePath("/payments");
  revalidatePath("/");
  revalidatePath("/budget");

  return { success: true, data: payment };
}

export async function deletePayment(
  id: string
): Promise<ActionResult<void>> {
  const userId = await requireAuth();

  const existing = await prisma.payment.findUnique({ where: { id, userId } });
  if (!existing) {
    return { success: false, error: "支払いデータが見つかりません" };
  }

  await prisma.payment.delete({ where: { id, userId } });

  revalidatePath("/payments");
  revalidatePath("/");

  return { success: true, data: undefined };
}

export async function updatePaymentStatus(
  id: string
): Promise<ActionResult<PaymentWithCard>> {
  const userId = await requireAuth();

  const existing = await prisma.payment.findUnique({ where: { id, userId } });
  if (!existing) {
    return { success: false, error: "支払いデータが見つかりません" };
  }

  const currentStatus = paymentStatusSchema.safeParse(existing.status);
  if (!currentStatus.success) {
    return { success: false, error: "無効なステータスです" };
  }
  const nextStatus = STATUS_TRANSITIONS[currentStatus.data];

  const payment = await prisma.payment.update({
    where: { id, userId },
    data: { status: nextStatus },
    include: { creditCard: true, category: true },
  });

  revalidatePath("/payments");
  revalidatePath("/");

  return { success: true, data: payment };
}

// カード単位でそのカードの全支払いのステータスを一括変更する
export async function updateCardPaymentsStatus(
  creditCardId: string,
  month: string,
  newStatus: string
): Promise<ActionResult<void>> {
  const userId = await requireAuth();

  const parsed = paymentStatusSchema.safeParse(newStatus);
  if (!parsed.success) {
    return { success: false, error: "無効なステータスです" };
  }

  await prisma.payment.updateMany({
    where: { creditCardId, month, userId },
    data: { status: parsed.data },
  });

  revalidatePath("/");
  revalidatePath("/payments");

  return { success: true, data: undefined };
}

export async function updatePaymentOrder(
  ids: string[]
): Promise<ActionResult<void>> {
  const userId = await requireAuth();
  await Promise.all(
    ids.map((id, index) =>
      prisma.payment.update({ where: { id, userId }, data: { sortOrder: index } })
    )
  );
  revalidatePath("/payments");
  revalidatePath("/");
  return { success: true, data: undefined };
}

/**
 * 複数の支払いを一括作成する（合計から振り分け入力用）
 */
export async function createBulkPayments(
  rows: PaymentInput[]
): Promise<ActionResult<void>> {
  const userId = await requireAuth();

  for (const input of rows) {
    const parsed = paymentSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const card = await prisma.creditCard.findUnique({
      where: { id: parsed.data.creditCardId, userId },
    });
    if (!card) {
      return { success: false, error: "指定されたクレジットカードが見つかりません" };
    }
    const initialStatus = computeInitialStatus(card, parsed.data.month);
    await prisma.payment.create({
      data: {
        userId,
        creditCardId: parsed.data.creditCardId,
        categoryId: parsed.data.categoryId || null,
        month: parsed.data.month,
        amount: parsed.data.amount,
        memo: parsed.data.memo ?? null,
        isRecurring: false,
        recurringGroupId: null,
        status: initialStatus,
      },
    });
  }

  revalidatePath("/payments");
  revalidatePath("/");

  return { success: true, data: undefined };
}

/**
 * 繰り返しグループの支払いを一括削除する
 */
export async function deleteRecurringPayments(
  recurringGroupId: string
): Promise<ActionResult<void>> {
  const userId = await requireAuth();

  // 指定グループの支払いが存在するか確認（自分のデータのみ）
  const payments = await prisma.payment.findMany({
    where: { recurringGroupId, userId },
  });

  if (payments.length === 0) {
    return { success: false, error: "繰り返しグループの支払いが見つかりません" };
  }

  await prisma.payment.deleteMany({
    where: { recurringGroupId, userId },
  });

  revalidatePath("/payments");
  revalidatePath("/");

  return { success: true, data: undefined };
}

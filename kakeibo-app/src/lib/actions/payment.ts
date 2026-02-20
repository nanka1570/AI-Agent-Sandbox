"use server";

import { revalidatePath } from "next/cache";
import { format, addMonths } from "date-fns";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { paymentSchema, type PaymentInput, type ActionResult } from "@/types";
import type { Payment, CreditCard, Category } from "@/generated/prisma/client";

// Payment にリレーション（creditCard, category）を含めた型
type PaymentWithCard = Payment & { creditCard: CreditCard; category: Category | null };

// ステータス遷移マップ
const STATUS_TRANSITIONS: Record<string, string | null> = {
  unconfirmed: "confirmed",
  confirmed: "paid",
  paid: null,
};

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

  // メインの支払いを作成
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
    },
    include: { creditCard: true, category: true },
  });

  // 繰り返し支払いの場合、翌月から3ヶ月分を自動生成
  if (isRecurring) {
    const baseDate = new Date(parsed.data.month + "-01");
    for (let i = 1; i <= 3; i++) {
      const futureMonth = format(addMonths(baseDate, i), "yyyy-MM");
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

  const nextStatus = STATUS_TRANSITIONS[existing.status];
  if (!nextStatus) {
    return { success: false, error: "これ以上ステータスを変更できません" };
  }

  const payment = await prisma.payment.update({
    where: { id, userId },
    data: { status: nextStatus },
    include: { creditCard: true, category: true },
  });

  revalidatePath("/payments");
  revalidatePath("/");

  return { success: true, data: payment };
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

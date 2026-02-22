"use server";

import { revalidatePath } from "next/cache";
import { format, addMonths } from "date-fns";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { paymentSchema, paymentStatusSchema, type PaymentInput, type ActionResult } from "@/types";
import type { Payment, CreditCard, Category } from "@/generated/prisma/client";

// Payment にリレーション（creditCard, category）を含めた型
type PaymentWithCard = Payment & { creditCard: CreditCard; category: Category | null };

// ステータス遷移マップ（循環: 支払い済み → 未確定に戻れる）
const STATUS_TRANSITIONS: Record<string, string> = {
  unconfirmed: "confirmed",
  confirmed: "paid",
  paid: "unconfirmed",
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

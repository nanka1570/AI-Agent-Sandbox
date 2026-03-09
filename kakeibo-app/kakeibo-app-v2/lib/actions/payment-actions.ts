"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/supabase/server";
import {
  paymentSchema,
  recurringPaymentSchema,
  bulkRegisterSchema,
} from "@/lib/validations/payment";
import { z } from "zod/v4";
import { determineAutoStatus, getNextStatus } from "@/lib/utils/status";
import { addMonthsToMonth } from "@/lib/utils/date";
import type { ActionResult } from "@/lib/types";
import { SORT_ORDER_INITIAL, MONTH_PARAM_REGEX, RECURRING_PAYMENT_COUNT } from "@/lib/constants";
import type { PaymentStatus } from "@/lib/constants";

/**
 * カード情報から自動ステータスを判定するためのヘルパー
 * 指定したカードの確定日・引き落とし日情報を取得し、determineAutoStatus に渡す
 */
async function getAutoStatusForCard(
  creditCardId: string,
  userId: string,
  usageMonth: string
): Promise<PaymentStatus> {
  const card = await prisma.creditCard.findUnique({
    where: { id: creditCardId, userId },
    select: {
      paymentMonthOffset: true,
      paymentDay: true,
      confirmationDay: true,
      confirmationMonthOffset: true,
    },
  });

  if (!card) {
    return "unconfirmed";
  }

  return determineAutoStatus({
    usageMonth,
    paymentMonthOffset: card.paymentMonthOffset,
    paymentDay: card.paymentDay,
    confirmationDay: card.confirmationDay,
    confirmationMonthOffset: card.confirmationMonthOffset,
  });
}

/**
 * 支払いを新規作成する
 */
export async function createPayment(data: unknown): Promise<ActionResult> {
  const parsed = paymentSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "入力内容に誤りがあります",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const userId = await getAuthUserId();

    // 自動ステータス判定
    const status = await getAutoStatusForCard(
      parsed.data.creditCardId,
      userId,
      parsed.data.month
    );

    // sortOrder を既存の最大値 + 1 にする
    const maxSortOrder = await prisma.payment.aggregate({
      where: { userId },
      _max: { sortOrder: true },
    });
    const nextSortOrder = (maxSortOrder._max.sortOrder ?? SORT_ORDER_INITIAL) + 1;

    await prisma.payment.create({
      data: {
        userId,
        creditCardId: parsed.data.creditCardId,
        month: parsed.data.month,
        amount: parsed.data.amount,
        categoryId: parsed.data.categoryId ?? null,
        memo: parsed.data.memo ?? null,
        status,
        sortOrder: nextSortOrder,
      },
    });

    revalidatePath("/payments");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "支払いの作成に失敗しました" };
  }
}

/**
 * 支払いを更新する
 */
export async function updatePayment(
  id: string,
  data: unknown
): Promise<ActionResult> {
  const parsed = paymentSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "入力内容に誤りがあります",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const userId = await getAuthUserId();

    const existing = await prisma.payment.findUnique({
      where: { id, userId },
    });
    if (!existing) {
      return { success: false, error: "支払いデータが見つかりません" };
    }

    await prisma.payment.update({
      where: { id, userId },
      data: {
        creditCardId: parsed.data.creditCardId,
        month: parsed.data.month,
        amount: parsed.data.amount,
        categoryId: parsed.data.categoryId ?? null,
        memo: parsed.data.memo ?? null,
      },
    });

    revalidatePath("/payments");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "支払いの更新に失敗しました" };
  }
}

/**
 * 支払いを削除する
 */
export async function deletePayment(id: string): Promise<ActionResult> {
  try {
    const userId = await getAuthUserId();

    const payment = await prisma.payment.findUnique({
      where: { id, userId },
    });
    if (!payment) {
      return { success: false, error: "支払いデータが見つかりません" };
    }

    await prisma.payment.delete({
      where: { id, userId },
    });

    revalidatePath("/payments");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "支払いの削除に失敗しました" };
  }
}

/**
 * 支払いステータスを循環遷移させる
 * unconfirmed → confirmed → paid → unconfirmed
 */
export async function togglePaymentStatus(
  id: string
): Promise<ActionResult> {
  try {
    const userId = await getAuthUserId();

    const payment = await prisma.payment.findUnique({
      where: { id, userId },
      select: { status: true },
    });
    if (!payment) {
      return { success: false, error: "支払いデータが見つかりません" };
    }

    const nextStatus = getNextStatus(payment.status as PaymentStatus); // Prisma returns string from DB

    await prisma.payment.update({
      where: { id, userId },
      data: { status: nextStatus },
    });

    revalidatePath("/payments");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "ステータスの変更に失敗しました" };
  }
}

/**
 * カード単位で一括ステータス変更する
 */
export async function bulkUpdatePaymentStatus(
  creditCardId: string,
  month: string,
  newStatus: PaymentStatus
): Promise<ActionResult> {
  // パラメータのバリデーション
  const paramsSchema = z.object({
    creditCardId: z.string().min(1),
    month: z.string().regex(MONTH_PARAM_REGEX),
    newStatus: z.enum(["unconfirmed", "confirmed", "paid"]),
  });
  const statusResult = paramsSchema.safeParse({ creditCardId, month, newStatus });
  if (!statusResult.success) {
    return { success: false, error: "無効なパラメータです" };
  }

  try {
    const userId = await getAuthUserId();
    const validated = statusResult.data;

    await prisma.payment.updateMany({
      where: {
        userId,
        creditCardId: validated.creditCardId,
        month: validated.month,
      },
      data: { status: validated.newStatus },
    });

    revalidatePath("/payments");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "一括ステータス変更に失敗しました" };
  }
}

/**
 * 繰り返し支払いを作成する（指定月を1件目とし、+1, +2, +3ヶ月の計4件）
 */
export async function createRecurringPayments(
  data: unknown
): Promise<ActionResult> {
  const parsed = recurringPaymentSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "入力内容に誤りがあります",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const userId = await getAuthUserId();
    const recurringGroupId = crypto.randomUUID();

    // sortOrder の基準値を取得
    const maxSortOrder = await prisma.payment.aggregate({
      where: { userId },
      _max: { sortOrder: true },
    });
    let nextSortOrder = (maxSortOrder._max.sortOrder ?? SORT_ORDER_INITIAL) + 1;

    const months = Array.from({ length: RECURRING_PAYMENT_COUNT }, (_, i) =>
      addMonthsToMonth(parsed.data.month, i)
    );

    // カード情報を1回だけ取得し、各月のステータスを判定（N+1解消）
    const card = await prisma.creditCard.findUnique({
      where: { id: parsed.data.creditCardId, userId },
      select: {
        paymentMonthOffset: true,
        paymentDay: true,
        confirmationDay: true,
        confirmationMonthOffset: true,
      },
    });

    const paymentDataList = months.map((month) => {
      const status = card
        ? determineAutoStatus({
            usageMonth: month,
            paymentMonthOffset: card.paymentMonthOffset,
            paymentDay: card.paymentDay,
            confirmationDay: card.confirmationDay,
            confirmationMonthOffset: card.confirmationMonthOffset,
          })
        : ("unconfirmed" as const);
      return {
        userId,
        creditCardId: parsed.data.creditCardId,
        month,
        amount: parsed.data.amount,
        categoryId: parsed.data.categoryId ?? null,
        memo: parsed.data.memo ?? null,
        status,
        isRecurring: true,
        recurringGroupId,
        sortOrder: nextSortOrder++,
      };
    });

    await prisma.payment.createMany({ data: paymentDataList });

    revalidatePath("/payments");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "繰り返し支払いの作成に失敗しました" };
  }
}

/**
 * 繰り返しグループを一括削除する
 */
export async function deleteRecurringGroup(
  recurringGroupId: string
): Promise<ActionResult> {
  try {
    const userId = await getAuthUserId();

    const count = await prisma.payment.count({
      where: { userId, recurringGroupId },
    });
    if (count === 0) {
      return { success: false, error: "繰り返しグループが見つかりません" };
    }

    await prisma.payment.deleteMany({
      where: { userId, recurringGroupId },
    });

    revalidatePath("/payments");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "繰り返しグループの削除に失敗しました" };
  }
}

/**
 * 一括登録（カテゴリ別振り分け）
 */
export async function bulkRegisterPayments(
  data: unknown
): Promise<ActionResult> {
  const parsed = bulkRegisterSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "入力内容に誤りがあります",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // 振り分け合計額が合計額と一致するかチェック
  const itemsTotal = parsed.data.items.reduce(
    (sum, item) => sum + item.amount,
    0
  );
  if (itemsTotal !== parsed.data.totalAmount) {
    return {
      success: false,
      error: `振り分け合計（${itemsTotal}円）が合計額（${parsed.data.totalAmount}円）と一致しません`,
    };
  }

  // 金額が0のアイテムは除外
  const validItems = parsed.data.items.filter((item) => item.amount > 0);
  if (validItems.length === 0) {
    return { success: false, error: "金額が0円以上の振り分けが1件以上必要です" };
  }

  try {
    const userId = await getAuthUserId();

    // sortOrder の基準値を取得
    const maxSortOrder = await prisma.payment.aggregate({
      where: { userId },
      _max: { sortOrder: true },
    });
    let nextSortOrder = (maxSortOrder._max.sortOrder ?? SORT_ORDER_INITIAL) + 1;

    // 同一カード・同一月なのでステータス判定は1回のみ実行（N+1解消）
    const status = await getAutoStatusForCard(
      parsed.data.creditCardId,
      userId,
      parsed.data.month
    );

    const paymentDataList = validItems.map((item) => ({
      userId,
      creditCardId: parsed.data.creditCardId,
      month: parsed.data.month,
      amount: item.amount,
      categoryId: item.categoryId ?? null,
      memo: null,
      status,
      sortOrder: nextSortOrder++,
    }));

    await prisma.payment.createMany({ data: paymentDataList });

    revalidatePath("/payments");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "一括登録に失敗しました" };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/supabase/server";
import { paymentSchema } from "@/lib/validations/payment";
import { determineAutoStatus } from "@/lib/utils/status";
import { ensureFallbackCategory } from "@/lib/utils/fallback-category";
import { format, addMonths } from "date-fns";
import { getNowJST } from "@/lib/utils/date";
import type { ActionResult } from "@/lib/types";
import type { Payment } from "@prisma/client";

async function computeCardStatus(
  userId: string,
  creditCardId: string,
  usageDate: Date,
) {
  const card = await prisma.creditCard.findUnique({
    where: { id: creditCardId, userId },
    select: {
      paymentDay: true,
      paymentMonthOffset: true,
      confirmationDay: true,
      confirmationMonthOffset: true,
    },
  });
  if (!card) return "unconfirmed" as const;

  const usageMonth = format(usageDate, "yyyy-MM");
  return determineAutoStatus({
    usageMonth,
    paymentMonthOffset: card.paymentMonthOffset,
    paymentDay: card.paymentDay,
    confirmationDay: card.confirmationDay,
    confirmationMonthOffset: card.confirmationMonthOffset,
  });
}

function computeAccountStatus(usageDate: Date) {
  const today = getNowJST();
  today.setHours(0, 0, 0, 0);
  return usageDate <= today ? ("paid" as const) : ("unconfirmed" as const);
}

function toUsageDate(input: string | null | undefined, month: string): Date {
  if (input) return new Date(input);
  return new Date(`${month}-01`);
}

export async function createPayment(
  data: unknown,
): Promise<ActionResult<Payment>> {
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
    const firstUsageDate = toUsageDate(parsed.data.usageDate, parsed.data.month);

    if (parsed.data.source === "card" && parsed.data.creditCardId) {
      const card = await prisma.creditCard.findUnique({
        where: { id: parsed.data.creditCardId, userId },
        select: { id: true, accountId: true },
      });
      if (!card) return { success: false, error: "カードが見つかりません" };
    }
    if (parsed.data.source === "account" && parsed.data.accountId) {
      const account = await prisma.account.findFirst({
        where: { id: parsed.data.accountId, userId },
        select: { id: true },
      });
      if (!account) return { success: false, error: "口座が見つかりません" };
    }

    if (parsed.data.categoryId) {
      const cat = await prisma.category.findFirst({
        where: { id: parsed.data.categoryId, userId },
        select: { id: true },
      });
      if (!cat) return { success: false, error: "カテゴリが見つかりません" };
    }

    const categoryId =
      parsed.data.categoryId ?? (await ensureFallbackCategory(userId));

    const installments = parsed.data.installments ?? 1;
    const isRecurring = installments > 1;
    const recurringGroupId = isRecurring ? randomUUID() : null;

    let linkedAccountId: string | null = null;
    if (parsed.data.source === "card" && parsed.data.creditCardId) {
      const card = await prisma.creditCard.findUnique({
        where: { id: parsed.data.creditCardId, userId },
        select: { accountId: true },
      });
      linkedAccountId = card?.accountId ?? null;
    } else if (parsed.data.source === "account") {
      linkedAccountId = parsed.data.accountId ?? null;
    }

    const rows: Array<Omit<Payment, "id" | "createdAt" | "updatedAt">> = [];
    for (let i = 0; i < installments; i++) {
      const usageDate = addMonths(firstUsageDate, i);
      const month = format(usageDate, "yyyy-MM");
      const status =
        parsed.data.source === "card" && parsed.data.creditCardId
          ? await computeCardStatus(userId, parsed.data.creditCardId, usageDate)
          : computeAccountStatus(usageDate);
      const memo = isRecurring
        ? `${parsed.data.memo ?? ""}${parsed.data.memo ? " " : ""}（${i + 1}/${installments}回目）`.trim()
        : (parsed.data.memo ?? null);
      rows.push({
        userId,
        usageDate,
        month,
        amount: parsed.data.amount,
        status,
        categoryId,
        creditCardId:
          parsed.data.source === "card" ? (parsed.data.creditCardId ?? null) : null,
        accountId: linkedAccountId,
        memo,
        isRecurring,
        recurringGroupId,
      });
    }

    if (isRecurring) {
      await prisma.payment.createMany({ data: rows });
    } else {
      await prisma.payment.create({ data: rows[0] });
    }

    revalidatePath("/payments");
    revalidatePath("/");
    revalidatePath("/calendar");
    return {
      success: true,
      data: { ...rows[0], id: "", createdAt: new Date(), updatedAt: new Date() } as Payment,
    };
  } catch (e) {
    console.error(e);
    return { success: false, error: "支払いの作成に失敗しました" };
  }
}

export async function updatePayment(
  id: string,
  data: unknown,
): Promise<ActionResult<Payment>> {
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
    const target = await prisma.payment.findUnique({ where: { id, userId } });
    if (!target) {
      return { success: false, error: "支払いが見つかりません" };
    }

    const usageDate = toUsageDate(parsed.data.usageDate, parsed.data.month);
    const categoryId =
      parsed.data.categoryId ?? (await ensureFallbackCategory(userId));
    const month = format(usageDate, "yyyy-MM");

    let status: string;
    let linkedAccountId: string | null = null;
    if (parsed.data.source === "card" && parsed.data.creditCardId) {
      status = await computeCardStatus(
        userId,
        parsed.data.creditCardId,
        usageDate,
      );
      const card = await prisma.creditCard.findUnique({
        where: { id: parsed.data.creditCardId, userId },
        select: { accountId: true },
      });
      linkedAccountId = card?.accountId ?? null;
    } else if (parsed.data.source === "account" && parsed.data.accountId) {
      status = computeAccountStatus(usageDate);
      linkedAccountId = parsed.data.accountId;
    } else {
      return { success: false, error: "支払い元が不正です" };
    }

    const updated = await prisma.payment.update({
      where: { id, userId },
      data: {
        usageDate,
        month,
        amount: parsed.data.amount,
        status,
        categoryId,
        creditCardId:
          parsed.data.source === "card" ? (parsed.data.creditCardId ?? null) : null,
        accountId: linkedAccountId,
        memo: parsed.data.memo ?? null,
      },
    });

    revalidatePath("/payments");
    revalidatePath("/");
    revalidatePath("/calendar");
    return { success: true, data: updated };
  } catch {
    return { success: false, error: "支払いの更新に失敗しました" };
  }
}

export async function deletePayment(id: string): Promise<ActionResult> {
  try {
    const userId = await getAuthUserId();
    const target = await prisma.payment.findUnique({ where: { id, userId } });
    if (!target) {
      return { success: false, error: "支払いが見つかりません" };
    }

    await prisma.payment.delete({ where: { id, userId } });

    revalidatePath("/payments");
    revalidatePath("/");
    revalidatePath("/calendar");
    return { success: true };
  } catch {
    return { success: false, error: "支払いの削除に失敗しました" };
  }
}

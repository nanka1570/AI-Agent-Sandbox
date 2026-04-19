"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/supabase/server";
import { paymentSchema } from "@/lib/validations/payment";
import { determineAutoStatus } from "@/lib/utils/status";
import { ensureFallbackCategory } from "@/lib/utils/fallback-category";
import { format } from "date-fns";
import type { ActionResult } from "@/lib/types";
import type { Payment } from "@prisma/client";

async function computeStatus(
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
    const usageDate = toUsageDate(parsed.data.usageDate, parsed.data.month);

    const card = await prisma.creditCard.findUnique({
      where: { id: parsed.data.creditCardId, userId },
      select: { id: true, accountId: true },
    });
    if (!card) {
      return { success: false, error: "カードが見つかりません" };
    }

    if (parsed.data.categoryId) {
      const cat = await prisma.category.findFirst({
        where: { id: parsed.data.categoryId, userId },
        select: { id: true },
      });
      if (!cat) {
        return { success: false, error: "カテゴリが見つかりません" };
      }
    }

    const status = await computeStatus(
      userId,
      parsed.data.creditCardId,
      usageDate,
    );

    const categoryId = parsed.data.categoryId ?? (await ensureFallbackCategory(userId));

    const month = format(usageDate, "yyyy-MM");

    const payment = await prisma.payment.create({
      data: {
        userId,
        usageDate,
        month,
        amount: parsed.data.amount,
        status,
        categoryId,
        creditCardId: parsed.data.creditCardId,
        accountId: card.accountId,
        memo: parsed.data.memo ?? null,
      },
    });

    revalidatePath("/payments");
    revalidatePath("/");
    revalidatePath("/calendar");
    return { success: true, data: payment };
  } catch {
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
    const status = await computeStatus(
      userId,
      parsed.data.creditCardId,
      usageDate,
    );
    const categoryId = parsed.data.categoryId ?? (await ensureFallbackCategory(userId));

    const month = format(usageDate, "yyyy-MM");

    const updated = await prisma.payment.update({
      where: { id, userId },
      data: {
        usageDate,
        month,
        amount: parsed.data.amount,
        status,
        categoryId,
        creditCardId: parsed.data.creditCardId,
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


"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/supabase/server";
import { csvImportSchema } from "@/lib/validations/payment";
import { determineAutoStatus } from "@/lib/utils/status";
import { ensureFallbackCategory } from "@/lib/utils/fallback-category";
import { format } from "date-fns";
import type { ActionResult } from "@/lib/types";
import type { Prisma } from "@prisma/client";

export async function bulkCreatePayments(
  data: unknown,
): Promise<ActionResult<{ created: number; skipped: number }>> {
  const parsed = csvImportSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "入力内容に誤りがあります" };
  }

  try {
    const userId = await getAuthUserId();

    const card = await prisma.creditCard.findFirst({
      where: { id: parsed.data.creditCardId, userId },
      select: {
        id: true,
        accountId: true,
        paymentDay: true,
        paymentMonthOffset: true,
        confirmationDay: true,
        confirmationMonthOffset: true,
      },
    });
    if (!card) {
      return { success: false, error: "カードが見つかりません" };
    }

    const fallbackCategoryId = await ensureFallbackCategory(userId);

    const items = parsed.data.items;
    if (items.length === 0) {
      return { success: true, data: { created: 0, skipped: 0 } };
    }

    const sortedDates = items.map((i) => i.usageDate).sort();
    const minDate = new Date(sortedDates[0]);
    const maxDate = new Date(sortedDates[sortedDates.length - 1]);
    const amountSet = Array.from(new Set(items.map((i) => i.amount)));

    const existing = await prisma.payment.findMany({
      where: {
        userId,
        creditCardId: card.id,
        usageDate: { gte: minDate, lte: maxDate },
        amount: { in: amountSet },
      },
      select: { usageDate: true, amount: true },
    });
    const dupKeys = new Set(
      existing.map(
        (e) => `${format(e.usageDate, "yyyy-MM-dd")}:${e.amount}`,
      ),
    );

    const toCreate: Prisma.PaymentCreateManyInput[] = [];
    let skipped = 0;
    for (const item of items) {
      const key = `${item.usageDate}:${item.amount}`;
      if (dupKeys.has(key)) {
        skipped++;
        continue;
      }
      dupKeys.add(key);

      const usageDate = new Date(item.usageDate);
      const month = format(usageDate, "yyyy-MM");
      const status = determineAutoStatus({
        usageMonth: month,
        paymentMonthOffset: card.paymentMonthOffset,
        paymentDay: card.paymentDay,
        confirmationDay: card.confirmationDay,
        confirmationMonthOffset: card.confirmationMonthOffset,
      });

      toCreate.push({
        userId,
        usageDate,
        month,
        amount: item.amount,
        status,
        categoryId: item.categoryId ?? fallbackCategoryId,
        creditCardId: card.id,
        accountId: card.accountId,
        memo: item.memo ?? null,
      });
    }

    if (toCreate.length > 0) {
      await prisma.payment.createMany({ data: toCreate });
    }

    revalidatePath("/payments");
    revalidatePath("/");
    revalidatePath("/calendar");
    return {
      success: true,
      data: { created: toCreate.length, skipped },
    };
  } catch {
    return { success: false, error: "一括登録に失敗しました" };
  }
}

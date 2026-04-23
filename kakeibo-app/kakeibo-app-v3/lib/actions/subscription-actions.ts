"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/supabase/server";
import { subscriptionSchema } from "@/lib/validations/subscription";
import type { ActionResult } from "@/lib/types";
import type { Subscription } from "@prisma/client";

export async function createSubscription(
  data: unknown,
): Promise<ActionResult<Subscription>> {
  const parsed = subscriptionSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "入力内容に誤りがあります",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const userId = await getAuthUserId();
    const v = parsed.data;

    if (v.source === "card" && v.creditCardId) {
      const card = await prisma.creditCard.findUnique({
        where: { id: v.creditCardId, userId },
        select: { id: true },
      });
      if (!card) return { success: false, error: "カードが見つかりません" };
    }
    if (v.source === "account" && v.accountId) {
      const account = await prisma.account.findFirst({
        where: { id: v.accountId, userId },
        select: { id: true },
      });
      if (!account) return { success: false, error: "口座が見つかりません" };
    }
    const cat = await prisma.category.findFirst({
      where: { id: v.categoryId, userId },
      select: { id: true },
    });
    if (!cat) return { success: false, error: "カテゴリが見つかりません" };

    const sub = await prisma.subscription.create({
      data: {
        userId,
        name: v.name,
        amount: v.amount,
        source: v.source,
        creditCardId: v.source === "card" ? (v.creditCardId ?? null) : null,
        accountId: v.source === "account" ? (v.accountId ?? null) : null,
        categoryId: v.categoryId,
        dayOfMonth: v.dayOfMonth,
        startMonth: v.startMonth,
        endMonth: v.endMonth ?? null,
        memo: v.memo ?? null,
      },
    });

    revalidatePath("/subscriptions");
    revalidatePath("/payments");
    revalidatePath("/calendar");
    revalidatePath("/");
    return { success: true, data: sub };
  } catch (e) {
    console.error(e);
    return { success: false, error: "定期支払の作成に失敗しました" };
  }
}

export async function updateSubscription(
  id: string,
  data: unknown,
): Promise<ActionResult<Subscription>> {
  const parsed = subscriptionSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "入力内容に誤りがあります",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const userId = await getAuthUserId();
    const existing = await prisma.subscription.findUnique({
      where: { id, userId },
    });
    if (!existing) return { success: false, error: "定期支払が見つかりません" };

    const v = parsed.data;
    const updated = await prisma.subscription.update({
      where: { id, userId },
      data: {
        name: v.name,
        amount: v.amount,
        source: v.source,
        creditCardId: v.source === "card" ? (v.creditCardId ?? null) : null,
        accountId: v.source === "account" ? (v.accountId ?? null) : null,
        categoryId: v.categoryId,
        dayOfMonth: v.dayOfMonth,
        startMonth: v.startMonth,
        endMonth: v.endMonth ?? null,
        memo: v.memo ?? null,
      },
    });

    revalidatePath("/subscriptions");
    revalidatePath("/payments");
    revalidatePath("/calendar");
    revalidatePath("/");
    return { success: true, data: updated };
  } catch {
    return { success: false, error: "定期支払の更新に失敗しました" };
  }
}

export async function upsertSubscriptionOverride(input: {
  subscriptionId: string;
  month: string;
  amount?: number | null;
  skip?: boolean;
  memo?: string | null;
}): Promise<ActionResult> {
  try {
    const userId = await getAuthUserId();
    const sub = await prisma.subscription.findUnique({
      where: { id: input.subscriptionId, userId },
      select: { id: true },
    });
    if (!sub) return { success: false, error: "定期支払が見つかりません" };

    if (!/^\d{4}-\d{2}$/.test(input.month)) {
      return { success: false, error: "月は YYYY-MM 形式で指定してください" };
    }
    if (input.amount != null && (!Number.isInteger(input.amount) || input.amount < 1)) {
      return { success: false, error: "金額は 1 円以上で入力してください" };
    }

    const skip = input.skip ?? false;
    const amount = skip ? null : (input.amount ?? null);

    if (!skip && amount == null && !input.memo) {
      await prisma.subscriptionOverride.deleteMany({
        where: { subscriptionId: input.subscriptionId, month: input.month },
      });
    } else {
      await prisma.subscriptionOverride.upsert({
        where: {
          subscriptionId_month: {
            subscriptionId: input.subscriptionId,
            month: input.month,
          },
        },
        create: {
          userId,
          subscriptionId: input.subscriptionId,
          month: input.month,
          amount,
          skip,
          memo: input.memo ?? null,
        },
        update: {
          amount,
          skip,
          memo: input.memo ?? null,
        },
      });
    }

    revalidatePath("/subscriptions");
    revalidatePath("/payments");
    revalidatePath("/calendar");
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "定期支払の変更に失敗しました" };
  }
}

export async function deleteSubscription(id: string): Promise<ActionResult> {
  try {
    const userId = await getAuthUserId();
    const existing = await prisma.subscription.findUnique({
      where: { id, userId },
    });
    if (!existing) return { success: false, error: "定期支払が見つかりません" };

    await prisma.subscription.delete({ where: { id, userId } });

    revalidatePath("/subscriptions");
    revalidatePath("/payments");
    revalidatePath("/calendar");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "定期支払の削除に失敗しました" };
  }
}

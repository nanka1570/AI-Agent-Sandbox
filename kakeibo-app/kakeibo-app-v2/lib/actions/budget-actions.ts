"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/supabase/server";
import { budgetSchema } from "@/lib/validations/budget";
import type { ActionResult } from "@/lib/types";

/**
 * 予算を作成または更新する（upsert）
 * 同一ユーザー・カテゴリ・月の組み合わせが既存なら更新、なければ新規作成
 */
export async function upsertBudget(data: unknown): Promise<ActionResult> {
  const parsed = budgetSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "入力内容に誤りがあります",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const userId = await getAuthUserId();

    await prisma.budget.upsert({
      where: {
        userId_categoryId_month: {
          userId,
          categoryId: parsed.data.categoryId,
          month: parsed.data.month,
        },
      },
      update: { amount: parsed.data.amount },
      create: {
        userId,
        categoryId: parsed.data.categoryId,
        month: parsed.data.month,
        amount: parsed.data.amount,
      },
    });

    revalidatePath("/budget");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "予算の保存に失敗しました" };
  }
}

/**
 * 予算を削除する
 * 所有権チェックを行い、自分の予算のみ削除可能
 */
export async function deleteBudget(id: string): Promise<ActionResult> {
  try {
    const userId = await getAuthUserId();

    const budget = await prisma.budget.findUnique({
      where: { id },
    });

    if (!budget || budget.userId !== userId) {
      return { success: false, error: "予算が見つかりません" };
    }

    await prisma.budget.delete({
      where: { id },
    });

    revalidatePath("/budget");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "予算の削除に失敗しました" };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { budgetSchema, type BudgetInput, type ActionResult } from "@/types";
import type { Budget, Category } from "@/generated/prisma/client";

// Budget にカテゴリ情報を含めた型
type BudgetWithCategory = Budget & { category: Category };

/**
 * 月別予算一覧を取得する
 */
export async function getBudgets(
  userId: string,
  month: string
): Promise<BudgetWithCategory[]> {
  return prisma.budget.findMany({
    where: { userId, month },
    include: { category: true },
    orderBy: { category: { sortOrder: "asc" } },
  });
}

/**
 * 予算を設定する（なければ作成、あれば更新）
 */
export async function upsertBudget(
  input: BudgetInput
): Promise<ActionResult<BudgetWithCategory>> {
  const userId = await requireAuth();

  const parsed = budgetSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  // カテゴリ存在確認（自分のカテゴリのみ）
  const category = await prisma.category.findUnique({
    where: { id: parsed.data.categoryId, userId },
  });
  if (!category) {
    return { success: false, error: "指定されたカテゴリが見つかりません" };
  }

  const budget = await prisma.budget.upsert({
    where: {
      userId_categoryId_month: {
        userId,
        categoryId: parsed.data.categoryId,
        month: parsed.data.month,
      },
    },
    update: {
      amount: parsed.data.amount,
    },
    create: {
      userId,
      categoryId: parsed.data.categoryId,
      month: parsed.data.month,
      amount: parsed.data.amount,
    },
    include: { category: true },
  });

  revalidatePath("/budget");
  revalidatePath("/");

  return { success: true, data: budget };
}

/**
 * 予算を削除する
 */
export async function deleteBudget(
  id: string
): Promise<ActionResult<void>> {
  const userId = await requireAuth();

  const existing = await prisma.budget.findUnique({
    where: { id, userId },
  });
  if (!existing) {
    return { success: false, error: "予算データが見つかりません" };
  }

  await prisma.budget.delete({ where: { id, userId } });

  revalidatePath("/budget");
  revalidatePath("/");

  return { success: true, data: undefined };
}

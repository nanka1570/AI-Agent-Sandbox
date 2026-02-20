"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { categorySchema, type CategoryInput, type ActionResult } from "@/types";
import type { Category } from "@/generated/prisma/client";

// デフォルトカテゴリ定義
const DEFAULT_CATEGORIES = [
  { name: "食費", color: "#FF6384" },
  { name: "光熱費", color: "#36A2EB" },
  { name: "通信費", color: "#FFCE56" },
  { name: "交通費", color: "#4BC0C0" },
  { name: "娯楽", color: "#9966FF" },
  { name: "日用品", color: "#FF9F40" },
  { name: "医療", color: "#C9CBCF" },
  { name: "その他", color: "#7C8798" },
];

/**
 * デフォルトカテゴリを作成する（カテゴリが0件の場合のみ）
 */
export async function ensureDefaultCategories(userId: string): Promise<void> {
  const count = await prisma.category.count({ where: { userId } });
  if (count > 0) return;

  await prisma.category.createMany({
    data: DEFAULT_CATEGORIES.map((cat, index) => ({
      userId,
      name: cat.name,
      color: cat.color,
      sortOrder: index,
      isDefault: true,
    })),
  });
}

/**
 * カテゴリ一覧を取得する
 */
export async function getCategories(userId: string): Promise<Category[]> {
  return prisma.category.findMany({
    where: { userId },
    orderBy: { sortOrder: "asc" },
  });
}

/**
 * カテゴリを作成する
 */
export async function createCategory(
  input: CategoryInput
): Promise<ActionResult<Category>> {
  const userId = await requireAuth();

  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  // 同名カテゴリの重複チェック
  const existing = await prisma.category.findFirst({
    where: { userId, name: parsed.data.name },
  });
  if (existing) {
    return { success: false, error: "同じ名前のカテゴリが既に存在します" };
  }

  const category = await prisma.category.create({
    data: {
      userId,
      name: parsed.data.name,
      color: parsed.data.color,
      sortOrder: parsed.data.sortOrder,
      isDefault: false,
    },
  });

  revalidatePath("/budget");
  revalidatePath("/payments");
  revalidatePath("/");

  return { success: true, data: category };
}

/**
 * カテゴリを更新する
 */
export async function updateCategory(
  id: string,
  input: CategoryInput
): Promise<ActionResult<Category>> {
  const userId = await requireAuth();

  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const existing = await prisma.category.findUnique({
    where: { id, userId },
  });
  if (!existing) {
    return { success: false, error: "カテゴリが見つかりません" };
  }

  // 同名カテゴリの重複チェック（自分自身を除く）
  const duplicate = await prisma.category.findFirst({
    where: { userId, name: parsed.data.name, id: { not: id } },
  });
  if (duplicate) {
    return { success: false, error: "同じ名前のカテゴリが既に存在します" };
  }

  const category = await prisma.category.update({
    where: { id, userId },
    data: {
      name: parsed.data.name,
      color: parsed.data.color,
      sortOrder: parsed.data.sortOrder,
    },
  });

  revalidatePath("/budget");
  revalidatePath("/payments");
  revalidatePath("/");

  return { success: true, data: category };
}

/**
 * カテゴリを削除する（デフォルトカテゴリは削除不可）
 */
export async function deleteCategory(
  id: string
): Promise<ActionResult<void>> {
  const userId = await requireAuth();

  const existing = await prisma.category.findUnique({
    where: { id, userId },
  });
  if (!existing) {
    return { success: false, error: "カテゴリが見つかりません" };
  }

  if (existing.isDefault) {
    return { success: false, error: "デフォルトカテゴリは削除できません" };
  }

  await prisma.category.delete({ where: { id, userId } });

  revalidatePath("/budget");
  revalidatePath("/payments");
  revalidatePath("/");

  return { success: true, data: undefined };
}

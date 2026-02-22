"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { categorySchema, type CategoryInput, type ActionResult } from "@/types";
import type { Category } from "@/generated/prisma/client";

// デフォルトカテゴリ定義
const DEFAULT_CATEGORIES = [
  { name: "食費", color: "#FF6384" },
  { name: "水道光熱費", color: "#36A2EB" },
  { name: "通信費", color: "#FFCE56" },
  { name: "交通費", color: "#4BC0C0" },
  { name: "娯楽", color: "#9966FF" },
  { name: "日用品", color: "#FF9F40" },
  { name: "医療", color: "#C9CBCF" },
  { name: "その他", color: "#7C8798" },
  { name: "雑費", color: "#94A3B8" },
];

/**
 * デフォルトカテゴリを作成する
 * - カテゴリが0件の場合: 全デフォルトカテゴリを作成
 * - 既存ユーザーで「いろいろ」がある場合: 「雑費」に改名
 * - 既存ユーザーで「雑費」がない場合: 追加
 */
export async function ensureDefaultCategories(userId: string): Promise<void> {
  const count = await prisma.category.count({ where: { userId } });

  if (count === 0) {
    // 新規ユーザー: 全カテゴリを一括作成
    await prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map((cat, index) => ({
        userId,
        name: cat.name,
        color: cat.color,
        sortOrder: index,
        isDefault: true,
      })),
    });
    return;
  }

  // 既存ユーザー: 「いろいろ」を「雑費」に改名
  await prisma.category.updateMany({
    where: { userId, name: "いろいろ" },
    data: { name: "雑費" },
  });

  // 「光熱費」を「水道光熱費」に改名
  await prisma.category.updateMany({
    where: { userId, name: "光熱費" },
    data: { name: "水道光熱費" },
  });

  // 「雑費」がなければ追加
  const hasZappi = await prisma.category.findFirst({
    where: { userId, name: "雑費" },
  });
  if (!hasZappi) {
    await prisma.category.create({
      data: {
        userId,
        name: "雑費",
        color: "#94A3B8",
        sortOrder: 99,
        isDefault: true,
      },
    });
  }
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

  // 新規カテゴリ追加後、「その他」を末尾に移動
  const sonota = await prisma.category.findFirst({ where: { userId, name: "その他" } });
  if (sonota) {
    const agg = await prisma.category.aggregate({ where: { userId }, _max: { sortOrder: true } });
    const maxOrder = agg._max.sortOrder ?? 0;
    if (sonota.sortOrder < maxOrder) {
      await prisma.category.update({
        where: { id: sonota.id },
        data: { sortOrder: maxOrder + 1 },
      });
    }
  }

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
 * カテゴリの並び順を一括更新する
 */
export async function updateCategoryOrder(
  ids: string[]
): Promise<ActionResult<void>> {
  const userId = await requireAuth();
  await Promise.all(
    ids.map((id, index) =>
      prisma.category.update({ where: { id, userId }, data: { sortOrder: index } })
    )
  );
  revalidatePath("/budget");
  revalidatePath("/payments");
  revalidatePath("/");
  return { success: true, data: undefined };
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

  await prisma.category.delete({ where: { id, userId } });

  revalidatePath("/budget");
  revalidatePath("/payments");
  revalidatePath("/");

  return { success: true, data: undefined };
}

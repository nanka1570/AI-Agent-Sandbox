"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/supabase/server";
import { categorySchema } from "@/lib/validations/category";
import {
  DEFAULT_CATEGORIES,
  FIXED_LAST_CATEGORY_NAME,
  SORT_ORDER_INITIAL,
} from "@/lib/constants";
import type { ActionResult } from "@/lib/types";
import type { Category } from "@prisma/client";

export async function createCategory(
  data: unknown,
): Promise<ActionResult<Category>> {
  const parsed = categorySchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "入力内容に誤りがあります",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const userId = await getAuthUserId();

    const existing = await prisma.category.findFirst({
      where: {
        userId,
        name: { equals: parsed.data.name, mode: "insensitive" },
      },
    });
    if (existing) {
      return { success: false, error: "同じ名前のカテゴリが既に存在します" };
    }

    const maxSortOrder = await prisma.category.aggregate({
      where: { userId },
      _max: { sortOrder: true },
    });
    const nextSortOrder =
      (maxSortOrder._max.sortOrder ?? SORT_ORDER_INITIAL) + 1;

    const newCategory = await prisma.category.create({
      data: {
        userId,
        name: parsed.data.name,
        color: parsed.data.color,
        sortOrder: nextSortOrder,
        isDefault: false,
      },
    });

    revalidatePath("/categories");
    revalidatePath("/budget");
    return { success: true, data: newCategory };
  } catch {
    return { success: false, error: "カテゴリの作成に失敗しました" };
  }
}

export async function updateCategory(
  id: string,
  data: unknown,
): Promise<ActionResult<Category>> {
  const parsed = categorySchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "入力内容に誤りがあります",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const userId = await getAuthUserId();

    const target = await prisma.category.findUnique({ where: { id, userId } });
    if (!target) {
      return { success: false, error: "カテゴリが見つかりません" };
    }

    const existing = await prisma.category.findFirst({
      where: {
        userId,
        id: { not: id },
        name: { equals: parsed.data.name, mode: "insensitive" },
      },
    });
    if (existing) {
      return { success: false, error: "同じ名前のカテゴリが既に存在します" };
    }

    const updated = await prisma.category.update({
      where: { id, userId },
      data: { name: parsed.data.name, color: parsed.data.color },
    });

    revalidatePath("/categories");
    revalidatePath("/budget");
    return { success: true, data: updated };
  } catch {
    return { success: false, error: "カテゴリの更新に失敗しました" };
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    const userId = await getAuthUserId();

    const category = await prisma.category.findUnique({
      where: { id, userId },
    });
    if (!category) {
      return { success: false, error: "カテゴリが見つかりません" };
    }
    if (category.isDefault) {
      return { success: false, error: "デフォルトカテゴリは削除できません" };
    }

    await prisma.category.delete({ where: { id, userId } });

    revalidatePath("/categories");
    revalidatePath("/budget");
    return { success: true };
  } catch {
    return { success: false, error: "カテゴリの削除に失敗しました" };
  }
}

export async function reorderCategories(
  orderedIds: string[],
): Promise<ActionResult> {
  if (orderedIds.length === 0) return { success: true };

  try {
    const userId = await getAuthUserId();
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.category.update({
          where: { id, userId },
          data: { sortOrder: index },
        }),
      ),
    );
    revalidatePath("/categories");
    revalidatePath("/budget");
    return { success: true };
  } catch {
    return { success: false, error: "カテゴリの並び替えに失敗しました" };
  }
}

export async function createDefaultCategories(): Promise<ActionResult> {
  try {
    const userId = await getAuthUserId();

    const sorted = [...DEFAULT_CATEGORIES].sort((a, b) => {
      if (a.name === FIXED_LAST_CATEGORY_NAME) return 1;
      if (b.name === FIXED_LAST_CATEGORY_NAME) return -1;
      return 0;
    });

    await prisma.$transaction(async (tx) => {
      const existing = await tx.category.count({ where: { userId } });
      if (existing > 0) return;
      await tx.category.createMany({
        data: sorted.map((cat, index) => ({
          userId,
          name: cat.name,
          color: cat.color,
          sortOrder: index,
          isDefault: true,
        })),
      });
    });

    revalidatePath("/categories");
    revalidatePath("/budget");
    return { success: true };
  } catch {
    return {
      success: false,
      error: "デフォルトカテゴリの作成に失敗しました",
    };
  }
}

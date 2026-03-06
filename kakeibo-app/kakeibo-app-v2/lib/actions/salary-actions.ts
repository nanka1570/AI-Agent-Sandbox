"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/supabase/server";
import { salarySchema } from "@/lib/validations/salary";
import type { ActionResult } from "@/lib/types";
import type { Salary } from "@prisma/client";

/**
 * 手取りを新規作成する
 */
export async function createSalary(data: unknown): Promise<ActionResult<Salary>> {
  const parsed = salarySchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "入力内容に誤りがあります",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const userId = await getAuthUserId();

    // 同月の重複チェック
    const existing = await prisma.salary.findFirst({
      where: { userId, month: parsed.data.month },
    });
    if (existing) {
      return { success: false, error: "同じ月の手取りが既に登録されています" };
    }

    // sortOrder を month の降順でソートするために、YYYY-MM を数値化して使う
    // 例: 2026-03 → 202603 とすることで、大きい値ほど新しい月
    const [year, month] = parsed.data.month.split("-").map(Number);
    const sortOrder = year * 100 + month;

    const newSalary = await prisma.salary.create({
      data: {
        userId,
        month: parsed.data.month,
        payDay: parsed.data.payDay,
        amount: parsed.data.amount,
        memo: parsed.data.memo ?? null,
        sortOrder,
      },
    });

    revalidatePath("/salary");
    revalidatePath("/");
    return { success: true, data: newSalary };
  } catch {
    return { success: false, error: "手取りの作成に失敗しました" };
  }
}

/**
 * 手取りを更新する
 */
export async function updateSalary(id: string, data: unknown): Promise<ActionResult<Salary>> {
  const parsed = salarySchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "入力内容に誤りがあります",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const userId = await getAuthUserId();

    // 所有権チェック
    const target = await prisma.salary.findUnique({
      where: { id, userId },
    });
    if (!target) {
      return { success: false, error: "手取りデータが見つかりません" };
    }

    // 同月の重複チェック（自身を除外）
    const existing = await prisma.salary.findFirst({
      where: {
        userId,
        month: parsed.data.month,
        id: { not: id },
      },
    });
    if (existing) {
      return { success: false, error: "同じ月の手取りが既に登録されています" };
    }

    // sortOrder を更新
    const [year, month] = parsed.data.month.split("-").map(Number);
    const sortOrder = year * 100 + month;

    const updatedSalary = await prisma.salary.update({
      where: { id, userId },
      data: {
        month: parsed.data.month,
        payDay: parsed.data.payDay,
        amount: parsed.data.amount,
        memo: parsed.data.memo ?? null,
        sortOrder,
      },
    });

    revalidatePath("/salary");
    revalidatePath("/");
    return { success: true, data: updatedSalary };
  } catch {
    return { success: false, error: "手取りの更新に失敗しました" };
  }
}

/**
 * 手取りを削除する
 */
export async function deleteSalary(id: string): Promise<ActionResult> {
  try {
    const userId = await getAuthUserId();

    const salary = await prisma.salary.findUnique({
      where: { id, userId },
    });

    if (!salary) {
      return { success: false, error: "手取りデータが見つかりません" };
    }

    await prisma.salary.delete({
      where: { id, userId },
    });

    revalidatePath("/salary");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "手取りの削除に失敗しました" };
  }
}

/**
 * 直近の手取りレコードからユニークな金額を最大3件取得する
 */
export async function getRecentAmounts(): Promise<number[]> {
  try {
    const userId = await getAuthUserId();

    const salaries = await prisma.salary.findMany({
      where: { userId },
      orderBy: { sortOrder: "desc" },
      select: { amount: true },
      take: 10,
    });

    // ユニークな金額を抽出し、最大3件返す
    const uniqueAmounts = [...new Set(salaries.map((s) => s.amount))];
    return uniqueAmounts.slice(0, 3);
  } catch {
    return [];
  }
}

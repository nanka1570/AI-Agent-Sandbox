"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/supabase/server";
import { salarySchema } from "@/lib/validations/salary";
import type { ActionResult } from "@/lib/types";
import type { Salary } from "@prisma/client";

/**
 * "YYYY-MM" 形式の月文字列を sortOrder 用整数に変換する（例: "2026-03" → 202603）
 * 呼び出し前に salarySchema（MONTH_PARAM_REGEX）で形式を保証済みのため、
 * NaN ガードは防御的ブロックとして存在する
 */
function monthToSortOrder(month: string): number {
  const [yearStr, monthStr] = month.split("-");
  const year = parseInt(yearStr, 10);
  const m = parseInt(monthStr, 10);
  if (isNaN(year) || isNaN(m)) {
    throw new Error(`Invalid month format: ${month}`);
  }
  return year * 100 + m;
}

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

    const sortOrder = monthToSortOrder(parsed.data.month);

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

    const sortOrder = monthToSortOrder(parsed.data.month);

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

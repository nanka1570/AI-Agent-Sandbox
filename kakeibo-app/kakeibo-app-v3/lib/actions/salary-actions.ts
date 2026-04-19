"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/supabase/server";
import { salarySchema } from "@/lib/validations/salary";
import type { ActionResult } from "@/lib/types";
import type { Salary } from "@prisma/client";

function monthToSortOrder(month: string): number {
  const [yearStr, monthStr] = month.split("-");
  const year = parseInt(yearStr, 10);
  const m = parseInt(monthStr, 10);
  if (isNaN(year) || isNaN(m)) {
    throw new Error(`Invalid month format: ${month}`);
  }
  return year * 100 + m;
}

export async function createSalary(
  data: unknown,
): Promise<ActionResult<Salary>> {
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

    const existing = await prisma.salary.findFirst({
      where: { userId, month: parsed.data.month },
      select: { id: true },
    });
    if (existing) {
      return {
        success: false,
        error: `${parsed.data.month} の手取りは既に登録されています`,
      };
    }

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

export async function updateSalary(
  id: string,
  data: unknown,
): Promise<ActionResult<Salary>> {
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

    const target = await prisma.salary.findUnique({ where: { id, userId } });
    if (!target) {
      return { success: false, error: "手取りデータが見つかりません" };
    }

    if (target.month !== parsed.data.month) {
      const duplicate = await prisma.salary.findFirst({
        where: { userId, month: parsed.data.month, NOT: { id } },
        select: { id: true },
      });
      if (duplicate) {
        return {
          success: false,
          error: `${parsed.data.month} の手取りは既に登録されています`,
        };
      }
    }

    const sortOrder = monthToSortOrder(parsed.data.month);

    const updated = await prisma.salary.update({
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
    return { success: true, data: updated };
  } catch {
    return { success: false, error: "手取りの更新に失敗しました" };
  }
}

export async function deleteSalary(id: string): Promise<ActionResult> {
  try {
    const userId = await getAuthUserId();
    const salary = await prisma.salary.findUnique({ where: { id, userId } });
    if (!salary) {
      return { success: false, error: "手取りデータが見つかりません" };
    }
    await prisma.salary.delete({ where: { id, userId } });

    revalidatePath("/salary");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "手取りの削除に失敗しました" };
  }
}

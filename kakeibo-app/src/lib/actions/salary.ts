"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { salarySchema, type SalaryInput, type ActionResult } from "@/types";
import type { Salary } from "@/generated/prisma/client";

export async function createSalary(
  input: SalaryInput
): Promise<ActionResult<Salary>> {
  const userId = await requireAuth();

  const parsed = salarySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const salary = await prisma.salary.create({
    data: {
      userId,
      month: parsed.data.month,
      payDay: parsed.data.payDay,
      amount: parsed.data.amount,
      memo: parsed.data.memo ?? null,
    },
  });

  revalidatePath("/salary");
  revalidatePath("/");

  return { success: true, data: salary };
}

export async function updateSalary(
  id: string,
  input: SalaryInput
): Promise<ActionResult<Salary>> {
  const userId = await requireAuth();

  const parsed = salarySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const existing = await prisma.salary.findUnique({ where: { id, userId } });
  if (!existing) {
    return { success: false, error: "給料データが見つかりません" };
  }

  const salary = await prisma.salary.update({
    where: { id, userId },
    data: {
      month: parsed.data.month,
      payDay: parsed.data.payDay,
      amount: parsed.data.amount,
      memo: parsed.data.memo ?? null,
    },
  });

  revalidatePath("/salary");
  revalidatePath("/");

  return { success: true, data: salary };
}

export async function updateSalaryOrder(
  ids: string[]
): Promise<ActionResult<void>> {
  const userId = await requireAuth();
  await Promise.all(
    ids.map((id, index) =>
      prisma.salary.update({ where: { id, userId }, data: { sortOrder: index } })
    )
  );
  revalidatePath("/salary");
  revalidatePath("/");
  return { success: true, data: undefined };
}

export async function deleteSalary(
  id: string
): Promise<ActionResult<void>> {
  const userId = await requireAuth();

  const existing = await prisma.salary.findUnique({ where: { id, userId } });
  if (!existing) {
    return { success: false, error: "給料データが見つかりません" };
  }

  await prisma.salary.delete({ where: { id, userId } });

  revalidatePath("/salary");
  revalidatePath("/");

  return { success: true, data: undefined };
}

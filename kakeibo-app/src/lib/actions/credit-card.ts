"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { creditCardSchema, type CreditCardInput, type ActionResult } from "@/types";
import type { CreditCard } from "@/generated/prisma/client";

export async function createCreditCard(
  input: CreditCardInput
): Promise<ActionResult<CreditCard>> {
  const userId = await requireAuth();

  const parsed = creditCardSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const card = await prisma.creditCard.create({
    data: {
      userId,
      name: parsed.data.name,
      closingDay: parsed.data.closingDay,
      paymentDay: parsed.data.paymentDay,
      paymentMonthOffset: parsed.data.paymentMonthOffset,
      confirmationDay: parsed.data.confirmationDay ?? null,
      confirmationMonthOffset: parsed.data.confirmationMonthOffset ?? null,
      brand: parsed.data.brand ?? null,
      memo: parsed.data.memo ?? null,
    },
  });

  revalidatePath("/credit-cards");
  revalidatePath("/");

  return { success: true, data: card };
}

export async function updateCreditCard(
  id: string,
  input: CreditCardInput
): Promise<ActionResult<CreditCard>> {
  const userId = await requireAuth();

  const parsed = creditCardSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const existing = await prisma.creditCard.findUnique({ where: { id, userId } });
  if (!existing) {
    return { success: false, error: "クレジットカードが見つかりません" };
  }

  const card = await prisma.creditCard.update({
    where: { id, userId },
    data: {
      name: parsed.data.name,
      closingDay: parsed.data.closingDay,
      paymentDay: parsed.data.paymentDay,
      paymentMonthOffset: parsed.data.paymentMonthOffset,
      confirmationDay: parsed.data.confirmationDay ?? null,
      confirmationMonthOffset: parsed.data.confirmationMonthOffset ?? null,
      brand: parsed.data.brand ?? null,
      memo: parsed.data.memo ?? null,
    },
  });

  revalidatePath("/credit-cards");
  revalidatePath("/");

  return { success: true, data: card };
}

export async function updateCreditCardOrder(
  ids: string[]
): Promise<ActionResult<void>> {
  const userId = await requireAuth();
  await Promise.all(
    ids.map((id, index) =>
      prisma.creditCard.update({ where: { id, userId }, data: { sortOrder: index } })
    )
  );
  revalidatePath("/credit-cards");
  revalidatePath("/");
  return { success: true, data: undefined };
}

export async function deleteCreditCard(
  id: string
): Promise<ActionResult<void>> {
  const userId = await requireAuth();

  const existing = await prisma.creditCard.findUnique({ where: { id, userId } });
  if (!existing) {
    return { success: false, error: "クレジットカードが見つかりません" };
  }

  await prisma.creditCard.delete({ where: { id, userId } });

  revalidatePath("/credit-cards");
  revalidatePath("/payments");
  revalidatePath("/");

  return { success: true, data: undefined };
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { creditCardSchema, type CreditCardInput, type ActionResult } from "@/types";
import type { CreditCard } from "@/generated/prisma/client";

export async function createCreditCard(
  input: CreditCardInput
): Promise<ActionResult<CreditCard>> {
  const parsed = creditCardSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const card = await prisma.creditCard.create({
    data: {
      name: parsed.data.name,
      closingDay: parsed.data.closingDay,
      paymentDay: parsed.data.paymentDay,
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
  const parsed = creditCardSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const existing = await prisma.creditCard.findUnique({ where: { id } });
  if (!existing) {
    return { success: false, error: "クレジットカードが見つかりません" };
  }

  const card = await prisma.creditCard.update({
    where: { id },
    data: {
      name: parsed.data.name,
      closingDay: parsed.data.closingDay,
      paymentDay: parsed.data.paymentDay,
      memo: parsed.data.memo ?? null,
    },
  });

  revalidatePath("/credit-cards");
  revalidatePath("/");

  return { success: true, data: card };
}

export async function deleteCreditCard(
  id: string
): Promise<ActionResult<void>> {
  const existing = await prisma.creditCard.findUnique({ where: { id } });
  if (!existing) {
    return { success: false, error: "クレジットカードが見つかりません" };
  }

  await prisma.creditCard.delete({ where: { id } });

  revalidatePath("/credit-cards");
  revalidatePath("/payments");
  revalidatePath("/");

  return { success: true, data: undefined };
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { paymentSchema, type PaymentInput, type ActionResult } from "@/types";
import type { Payment, CreditCard } from "@/generated/prisma/client";

// Payment にリレーション（creditCard）を含めた型
type PaymentWithCard = Payment & { creditCard: CreditCard };

// ステータス遷移マップ
const STATUS_TRANSITIONS: Record<string, string | null> = {
  unconfirmed: "confirmed",
  confirmed: "paid",
  paid: null,
};

export async function createPayment(
  input: PaymentInput
): Promise<ActionResult<PaymentWithCard>> {
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  // クレカ存在確認
  const card = await prisma.creditCard.findUnique({
    where: { id: parsed.data.creditCardId },
  });
  if (!card) {
    return { success: false, error: "指定されたクレジットカードが見つかりません" };
  }

  const payment = await prisma.payment.create({
    data: {
      creditCardId: parsed.data.creditCardId,
      month: parsed.data.month,
      amount: parsed.data.amount,
      memo: parsed.data.memo ?? null,
    },
    include: { creditCard: true },
  });

  revalidatePath("/payments");
  revalidatePath("/");

  return { success: true, data: payment };
}

export async function updatePayment(
  id: string,
  input: PaymentInput
): Promise<ActionResult<PaymentWithCard>> {
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const existing = await prisma.payment.findUnique({ where: { id } });
  if (!existing) {
    return { success: false, error: "支払いデータが見つかりません" };
  }

  // クレカ存在確認
  const card = await prisma.creditCard.findUnique({
    where: { id: parsed.data.creditCardId },
  });
  if (!card) {
    return { success: false, error: "指定されたクレジットカードが見つかりません" };
  }

  const payment = await prisma.payment.update({
    where: { id },
    data: {
      creditCardId: parsed.data.creditCardId,
      month: parsed.data.month,
      amount: parsed.data.amount,
      memo: parsed.data.memo ?? null,
    },
    include: { creditCard: true },
  });

  revalidatePath("/payments");
  revalidatePath("/");

  return { success: true, data: payment };
}

export async function deletePayment(
  id: string
): Promise<ActionResult<void>> {
  const existing = await prisma.payment.findUnique({ where: { id } });
  if (!existing) {
    return { success: false, error: "支払いデータが見つかりません" };
  }

  await prisma.payment.delete({ where: { id } });

  revalidatePath("/payments");
  revalidatePath("/");

  return { success: true, data: undefined };
}

export async function updatePaymentStatus(
  id: string
): Promise<ActionResult<PaymentWithCard>> {
  const existing = await prisma.payment.findUnique({ where: { id } });
  if (!existing) {
    return { success: false, error: "支払いデータが見つかりません" };
  }

  const nextStatus = STATUS_TRANSITIONS[existing.status];
  if (!nextStatus) {
    return { success: false, error: "これ以上ステータスを変更できません" };
  }

  const payment = await prisma.payment.update({
    where: { id },
    data: { status: nextStatus },
    include: { creditCard: true },
  });

  revalidatePath("/payments");
  revalidatePath("/");

  return { success: true, data: payment };
}

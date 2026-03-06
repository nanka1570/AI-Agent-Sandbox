"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/supabase/server";
import { creditCardSchema } from "@/lib/validations/credit-card";
import type { ActionResult } from "@/lib/types";
import type { CreditCard } from "@prisma/client";

/**
 * クレジットカードを新規作成する
 */
export async function createCreditCard(data: unknown): Promise<ActionResult<CreditCard>> {
  const parsed = creditCardSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "入力内容に誤りがあります",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const userId = await getAuthUserId();

    // sortOrder を既存の最大値 + 1 にする
    const maxSortOrder = await prisma.creditCard.aggregate({
      where: { userId },
      _max: { sortOrder: true },
    });
    const nextSortOrder = (maxSortOrder._max.sortOrder ?? -1) + 1;

    const newCard = await prisma.creditCard.create({
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
        sortOrder: nextSortOrder,
      },
    });

    revalidatePath("/credit-cards");
    revalidatePath("/");
    return { success: true, data: newCard };
  } catch {
    return { success: false, error: "クレジットカードの作成に失敗しました" };
  }
}

/**
 * クレジットカードを更新する
 */
export async function updateCreditCard(
  id: string,
  data: unknown
): Promise<ActionResult<CreditCard>> {
  const parsed = creditCardSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "入力内容に誤りがあります",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const userId = await getAuthUserId();

    const existing = await prisma.creditCard.findUnique({
      where: { id, userId },
    });
    if (!existing) {
      return { success: false, error: "クレジットカードが見つかりません" };
    }

    const updatedCard = await prisma.creditCard.update({
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
    revalidatePath("/payments");
    revalidatePath("/");
    return { success: true, data: updatedCard };
  } catch {
    return { success: false, error: "クレジットカードの更新に失敗しました" };
  }
}

/**
 * クレジットカードを削除する
 * Cascade により関連する Payment も全て削除される
 */
export async function deleteCreditCard(id: string): Promise<ActionResult> {
  try {
    const userId = await getAuthUserId();

    const card = await prisma.creditCard.findUnique({
      where: { id, userId },
    });

    if (!card) {
      return { success: false, error: "クレジットカードが見つかりません" };
    }

    await prisma.creditCard.delete({
      where: { id, userId },
    });

    revalidatePath("/credit-cards");
    revalidatePath("/payments");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "クレジットカードの削除に失敗しました" };
  }
}

/**
 * クレジットカードの並び順を更新する
 * orderedIds の順番に sortOrder を 0, 1, 2... に正規化する
 */
export async function reorderCreditCards(
  orderedIds: string[]
): Promise<ActionResult> {
  if (orderedIds.length === 0) {
    return { success: true };
  }

  try {
    const userId = await getAuthUserId();

    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.creditCard.update({
          where: { id, userId },
          data: { sortOrder: index },
        })
      )
    );

    revalidatePath("/credit-cards");
    return { success: true };
  } catch {
    return { success: false, error: "クレジットカードの並び替えに失敗しました" };
  }
}

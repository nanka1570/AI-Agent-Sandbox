"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/supabase/server";
import {
  statementSchema,
  statementWithdrawSchema,
} from "@/lib/validations/statement";
import type { ActionResult } from "@/lib/types";
import type { CreditCardStatement } from "@prisma/client";

export async function upsertStatement(
  data: unknown,
): Promise<ActionResult<CreditCardStatement>> {
  const parsed = statementSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "入力内容に誤りがあります",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const userId = await getAuthUserId();

    const card = await prisma.creditCard.findFirst({
      where: { id: parsed.data.creditCardId, userId },
      select: { id: true },
    });
    if (!card) {
      return { success: false, error: "カードが見つかりません" };
    }

    const stmt = await prisma.creditCardStatement.upsert({
      where: {
        userId_creditCardId_month: {
          userId,
          creditCardId: parsed.data.creditCardId,
          month: parsed.data.month,
        },
      },
      update: {
        confirmedAmount: parsed.data.confirmedAmount,
        memo: parsed.data.memo ?? null,
      },
      create: {
        userId,
        creditCardId: parsed.data.creditCardId,
        month: parsed.data.month,
        confirmedAmount: parsed.data.confirmedAmount,
        memo: parsed.data.memo ?? null,
      },
    });

    revalidatePath(`/credit-cards/${parsed.data.creditCardId}/reconcile`);
    revalidatePath("/");
    return { success: true, data: stmt };
  } catch {
    return { success: false, error: "請求明細の保存に失敗しました" };
  }
}

export async function recordWithdrawal(
  statementId: string,
  data: unknown,
): Promise<ActionResult> {
  const parsed = statementWithdrawSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "入力内容に誤りがあります",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const userId = await getAuthUserId();

    const stmt = await prisma.creditCardStatement.findUnique({
      where: { id: statementId, userId },
    });
    if (!stmt) {
      return { success: false, error: "請求明細が見つかりません" };
    }
    if (stmt.withdrawnAt !== null) {
      return { success: false, error: "この請求明細は既に引落済みです" };
    }

    const account = await prisma.account.findFirst({
      where: { id: parsed.data.accountId, userId },
      select: { id: true },
    });
    if (!account) {
      return { success: false, error: "口座が見つかりません" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.creditCardStatement.update({
        where: { id: statementId, userId },
        data: {
          withdrawnAmount: parsed.data.withdrawnAmount,
          withdrawnAt: new Date(),
          accountId: parsed.data.accountId,
        },
      });

      const updatedAccount = await tx.account.update({
        where: { id: parsed.data.accountId, userId },
        data: {
          balance: { decrement: parsed.data.withdrawnAmount },
          balanceUpdatedAt: new Date(),
        },
        select: { balance: true },
      });

      await tx.balanceHistory.create({
        data: {
          userId,
          accountId: parsed.data.accountId,
          balance: updatedAccount.balance,
          source: "withdrawal",
        },
      });

      await tx.payment.updateMany({
        where: {
          userId,
          creditCardId: stmt.creditCardId,
          month: stmt.month,
        },
        data: { status: "paid" },
      });
    });

    revalidatePath(`/credit-cards/${stmt.creditCardId}/reconcile`);
    revalidatePath("/accounts");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "引落の記録に失敗しました" };
  }
}

export async function deleteStatement(id: string): Promise<ActionResult> {
  try {
    const userId = await getAuthUserId();
    const stmt = await prisma.creditCardStatement.findUnique({
      where: { id, userId },
    });
    if (!stmt) {
      return { success: false, error: "請求明細が見つかりません" };
    }

    await prisma.creditCardStatement.delete({ where: { id, userId } });
    revalidatePath(`/credit-cards/${stmt.creditCardId}/reconcile`);
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "請求明細の削除に失敗しました" };
  }
}

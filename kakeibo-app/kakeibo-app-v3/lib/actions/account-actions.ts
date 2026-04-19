"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/supabase/server";
import { accountSchema } from "@/lib/validations/account";
import { SORT_ORDER_INITIAL } from "@/lib/constants";
import type { ActionResult } from "@/lib/types";
import type { Account } from "@prisma/client";

export async function createAccount(
  data: unknown,
): Promise<ActionResult<Account>> {
  const parsed = accountSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "入力内容に誤りがあります",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const userId = await getAuthUserId();

    const maxSortOrder = await prisma.account.aggregate({
      where: { userId },
      _max: { sortOrder: true },
    });
    const nextSortOrder =
      (maxSortOrder._max.sortOrder ?? SORT_ORDER_INITIAL) + 1;

    const now = new Date();

    const newAccount = await prisma.$transaction(async (tx) => {
      const account = await tx.account.create({
        data: {
          userId,
          name: parsed.data.name,
          type: parsed.data.type,
          balance: parsed.data.balance,
          balanceUpdatedAt: now,
          sortOrder: nextSortOrder,
        },
      });

      await tx.balanceHistory.create({
        data: {
          userId,
          accountId: account.id,
          balance: parsed.data.balance,
          source: "manual",
        },
      });

      return account;
    });

    revalidatePath("/accounts");
    revalidatePath("/");
    return { success: true, data: newAccount };
  } catch {
    return { success: false, error: "口座の作成に失敗しました" };
  }
}

export async function updateAccount(
  id: string,
  data: unknown,
): Promise<ActionResult<Account>> {
  const parsed = accountSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "入力内容に誤りがあります",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const userId = await getAuthUserId();

    const existing = await prisma.account.findUnique({
      where: { id, userId },
    });
    if (!existing) {
      return { success: false, error: "口座が見つかりません" };
    }

    const balanceChanged = existing.balance !== parsed.data.balance;
    const now = new Date();

    const updated = await prisma.$transaction(async (tx) => {
      const account = await tx.account.update({
        where: { id, userId },
        data: {
          name: parsed.data.name,
          type: parsed.data.type,
          balance: parsed.data.balance,
          balanceUpdatedAt: balanceChanged ? now : existing.balanceUpdatedAt,
        },
      });

      if (balanceChanged) {
        await tx.balanceHistory.create({
          data: {
            userId,
            accountId: id,
            balance: parsed.data.balance,
            source: "manual",
          },
        });
      }

      return account;
    });

    revalidatePath("/accounts");
    revalidatePath("/");
    return { success: true, data: updated };
  } catch {
    return { success: false, error: "口座の更新に失敗しました" };
  }
}

export async function deleteAccount(id: string): Promise<ActionResult> {
  try {
    const userId = await getAuthUserId();

    const account = await prisma.account.findUnique({
      where: { id, userId },
    });
    if (!account) {
      return { success: false, error: "口座が見つかりません" };
    }

    // 関連する CreditCard.accountId / Payment.accountId / Statement.accountId を null に戻す
    await prisma.$transaction([
      prisma.creditCard.updateMany({
        where: { userId, accountId: id },
        data: { accountId: null },
      }),
      prisma.payment.updateMany({
        where: { userId, accountId: id },
        data: { accountId: null },
      }),
      prisma.creditCardStatement.updateMany({
        where: { userId, accountId: id },
        data: { accountId: null },
      }),
      prisma.balanceHistory.deleteMany({
        where: { userId, accountId: id },
      }),
      prisma.account.delete({ where: { id, userId } }),
    ]);

    revalidatePath("/accounts");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "口座の削除に失敗しました" };
  }
}

export async function reorderAccounts(
  orderedIds: string[],
): Promise<ActionResult> {
  if (orderedIds.length === 0) return { success: true };

  try {
    const userId = await getAuthUserId();
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.account.update({
          where: { id, userId },
          data: { sortOrder: index },
        }),
      ),
    );
    revalidatePath("/accounts");
    return { success: true };
  } catch {
    return { success: false, error: "口座の並び替えに失敗しました" };
  }
}

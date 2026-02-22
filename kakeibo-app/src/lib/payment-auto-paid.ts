import { prisma } from "@/lib/db";
import { getActualDay } from "@/lib/utils";

/**
 * 支払い確定日を過ぎた支払いを自動で「確定」にする
 */
export async function autoMarkConfirmedOverdue(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pending = await prisma.payment.findMany({
    where: { userId, status: "unconfirmed" },
    include: { creditCard: true },
  });

  const overdueIds = pending
    .filter((p) => {
      if (!p.creditCard.confirmationDay) return false;
      const [year, month] = p.month.split("-").map(Number);
      const offset = p.creditCard.confirmationMonthOffset ?? 0;
      const d = new Date(year, month - 1 + offset, 1);
      const actualDay = getActualDay(
        p.creditCard.confirmationDay,
        d.getFullYear(),
        d.getMonth() + 1
      );
      const dueDate = new Date(d.getFullYear(), d.getMonth(), actualDay);
      return dueDate < today;
    })
    .map((p) => p.id);

  if (overdueIds.length > 0) {
    await prisma.payment.updateMany({
      where: { id: { in: overdueIds }, userId },
      data: { status: "confirmed" },
    });
  }
}

/**
 * 引き落とし日を過ぎた支払いを自動で「支払い済み」にする
 */
export async function autoMarkPaidOverdue(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pending = await prisma.payment.findMany({
    where: { userId, status: { not: "paid" } },
    include: { creditCard: true },
  });

  const overdueIds = pending
    .filter((p) => {
      const [year, month] = p.month.split("-").map(Number);
      const offset = p.creditCard.paymentMonthOffset;
      const d = new Date(year, month - 1 + offset, 1);
      const actualDay = getActualDay(
        p.creditCard.paymentDay,
        d.getFullYear(),
        d.getMonth() + 1
      );
      const dueDate = new Date(d.getFullYear(), d.getMonth(), actualDay);
      return dueDate < today;
    })
    .map((p) => p.id);

  if (overdueIds.length > 0) {
    await prisma.payment.updateMany({
      where: { id: { in: overdueIds }, userId },
      data: { status: "paid" },
    });
  }
}

import { getAuthUserId } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { CreditCardList } from "@/components/credit-cards/credit-card-list";

export default async function CreditCardsPage() {
  const userId = await getAuthUserId();
  const [cards, accounts] = await Promise.all([
    prisma.creditCard.findMany({
      where: { userId },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        brand: true,
        closingDay: true,
        paymentDay: true,
        paymentMonthOffset: true,
        confirmationDay: true,
        confirmationMonthOffset: true,
        accountId: true,
        memo: true,
        sortOrder: true,
      },
    }),
    prisma.account.findMany({
      where: { userId },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">クレジットカード</h1>
        <p className="text-sm text-muted-foreground">
          締め日・支払日を登録し、引落先口座と紐づけます。
        </p>
      </div>
      <CreditCardList cards={cards} accounts={accounts} />
    </div>
  );
}

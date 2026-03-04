export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/supabase/server";
import { CreditCardList } from "@/components/credit-cards/credit-card-list";

/**
 * クレジットカード管理ページ
 */
export default async function CreditCardsPage() {
  const userId = await getAuthUserId();

  const cards = await prisma.creditCard.findMany({
    where: { userId },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">クレジットカード管理</h1>
        <p className="text-sm text-muted-foreground">
          クレジットカードの締め日・支払日を管理します
        </p>
      </div>
      <CreditCardList cards={cards} />
    </div>
  );
}

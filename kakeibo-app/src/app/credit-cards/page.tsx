import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { CreditCardList } from "@/components/credit-cards/credit-card-list";

export default async function CreditCardsPage() {
  const userId = await requireAuth();

  const cards = await prisma.creditCard.findMany({
    where: { userId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return <CreditCardList cards={cards} />;
}

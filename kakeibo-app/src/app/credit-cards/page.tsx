import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { CreditCardList } from "@/components/credit-cards/credit-card-list";

export default async function CreditCardsPage() {
  const userId = await requireAuth();

  const cards = await prisma.creditCard.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return <CreditCardList cards={cards} />;
}

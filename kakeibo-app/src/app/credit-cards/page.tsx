import { prisma } from "@/lib/db";
import { CreditCardList } from "@/components/credit-cards/credit-card-list";

export default async function CreditCardsPage() {
  const cards = await prisma.creditCard.findMany({
    orderBy: { createdAt: "desc" },
  });

  return <CreditCardList cards={cards} />;
}

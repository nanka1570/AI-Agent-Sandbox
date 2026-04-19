import { getAuthUserId } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { CsvImportWizard } from "@/components/payments/import/csv-import-wizard";

export default async function PaymentImportPage() {
  const userId = await getAuthUserId();
  const [cards, categories] = await Promise.all([
    prisma.creditCard.findMany({
      where: { userId },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
    prisma.category.findMany({
      where: { userId },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, color: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">CSV 取り込み</h1>
        <p className="text-sm text-muted-foreground">
          カード会社の明細 CSV をアップロードして支払いを一括登録できます。
        </p>
      </div>

      {cards.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          先に「クレジットカード」を登録してください。
        </div>
      ) : (
        <CsvImportWizard cards={cards} categories={categories} />
      )}
    </div>
  );
}

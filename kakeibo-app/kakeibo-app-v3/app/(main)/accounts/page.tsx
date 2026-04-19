import { getAuthUserId } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { AccountList } from "@/components/accounts/account-list";

export default async function AccountsPage() {
  const userId = await getAuthUserId();
  const accounts = await prisma.account.findMany({
    where: { userId },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      type: true,
      balance: true,
      sortOrder: true,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">口座</h1>
        <p className="text-sm text-muted-foreground">
          銀行口座・現金の残高を管理します。引落時は自動で残高から差し引かれます。
        </p>
      </div>
      <AccountList accounts={accounts} />
    </div>
  );
}

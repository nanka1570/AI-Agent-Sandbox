import { getAuthUserId } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { SalaryList } from "@/components/salary/salary-list";

export default async function SalaryPage() {
  const userId = await getAuthUserId();
  const salaries = await prisma.salary.findMany({
    where: { userId },
    orderBy: { sortOrder: "desc" },
    select: {
      id: true,
      month: true,
      payDay: true,
      amount: true,
      memo: true,
      sortOrder: true,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">手取り</h1>
        <p className="text-sm text-muted-foreground">
          給与の手取り額を月ごとに登録します。
        </p>
      </div>
      <SalaryList salaries={salaries} />
    </div>
  );
}

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { SalaryList } from "@/components/salary/salary-list";

export default async function SalaryPage() {
  const userId = await requireAuth();

  const salaries = await prisma.salary.findMany({
    where: { userId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return <SalaryList salaries={salaries} />;
}

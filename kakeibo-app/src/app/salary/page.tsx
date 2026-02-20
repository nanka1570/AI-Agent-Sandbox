import { prisma } from "@/lib/db";
import { SalaryList } from "@/components/salary/salary-list";

export default async function SalaryPage() {
  const salaries = await prisma.salary.findMany({
    orderBy: { month: "desc" },
  });

  return <SalaryList salaries={salaries} />;
}

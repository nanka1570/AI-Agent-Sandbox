"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { formatCurrency } from "@/lib/utils/format";

interface CategoryDatum {
  name: string;
  value: number;
  color: string;
}

interface CategoryPieProps {
  data: CategoryDatum[];
}

export function CategoryPie({ data }: CategoryPieProps) {
  if (data.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        データがありません
      </p>
    );
  }
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={50}
            outerRadius={90}
            paddingAngle={1}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v) => formatCurrency(Number(v ?? 0))}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

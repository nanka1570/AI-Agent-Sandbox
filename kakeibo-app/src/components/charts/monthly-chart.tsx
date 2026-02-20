"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

type ChartData = {
  month: string;
  total: number;
};

type Props = {
  data: ChartData[];
};

export function MonthlyChart({ data }: Props) {
  return (
    <div className="border-2 border-border bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <h3 className="mb-6 flex items-center gap-2 text-xl font-black">
        <span className="inline-block -skew-x-12 bg-black px-2 py-1 text-sm text-white">TRENDS</span>
        月次推移
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <XAxis dataKey="month" tick={{ fontWeight: 700, fontSize: 12 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `¥${(Number(v) / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          <Bar
            dataKey="total"
            fill="hsl(340 90% 60%)"
            stroke="black"
            strokeWidth={2}
            radius={0}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

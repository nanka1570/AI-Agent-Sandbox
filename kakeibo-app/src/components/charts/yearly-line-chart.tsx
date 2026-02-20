"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

type ChartData = {
  month: string;
  amount: number;
};

type Props = {
  data: ChartData[];
};

export function YearlyLineChart({ data }: Props) {
  return (
    <div className="border-2 border-border bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <h3 className="mb-6 flex items-center gap-2 text-xl font-black">
        <span className="inline-block -skew-x-12 bg-black px-2 py-1 text-sm text-white">
          YEARLY
        </span>
        月別支出推移
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" tick={{ fontWeight: 700, fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `¥${(Number(v) / 1000).toFixed(0)}k`}
          />
          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="hsl(265 89% 66%)"
            strokeWidth={3}
            dot={{
              fill: "hsl(265 89% 66%)",
              stroke: "black",
              strokeWidth: 2,
              r: 5,
            }}
            activeDot={{
              fill: "hsl(340 90% 60%)",
              stroke: "black",
              strokeWidth: 2,
              r: 7,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

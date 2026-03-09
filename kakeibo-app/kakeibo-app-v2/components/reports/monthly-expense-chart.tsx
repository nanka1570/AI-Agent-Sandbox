"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface MonthlyExpenseChartProps {
  data: Array<{ month: string; total: number }>;
}

export function MonthlyExpenseChart({ data }: MonthlyExpenseChartProps) {
  const chartData = data.map((d) => ({
    name: d.month.split("-")[1] + "月",
    金額: d.total,
  }));

  if (data.every((d) => d.total === 0)) {
    return (
      <div className="data-panel p-6 text-center text-sm text-muted-foreground">
        この年のデータがありません
      </div>
    );
  }

  return (
    <div className="data-panel p-4">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,179,0,0.1)" />
          <XAxis
            dataKey="name"
            tick={{ fill: "#8A7560", fontSize: 11 }}
            axisLine={{ stroke: "#8A7560" }}
          />
          <YAxis
            tick={{ fill: "#8A7560", fontSize: 11 }}
            axisLine={{ stroke: "#8A7560" }}
            tickFormatter={(v) => `${(v / 10000).toFixed(0)}万`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#161B28",
              border: "1px solid #FFB300",
              borderRadius: "4px",
              color: "#F5E6C8",
            }}
            formatter={(value) => [
              `¥${Number(value).toLocaleString()}`,
              "支出",
            ]}
          />
          <Bar dataKey="金額" fill="#FFB300" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface CategoryPieChartProps {
  data: Array<{ name: string; color: string; total: number }>;
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  if (data.length === 0) {
    return (
      <div className="data-panel p-6 text-center text-sm text-muted-foreground">
        カテゴリデータがありません
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: d.name,
    value: d.total,
    color: d.color,
  }));

  return (
    <div className="data-panel p-4">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={100}
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) =>
              `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
            }
            labelLine={{ stroke: "#8A7560" }}
          >
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
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
          <Legend wrapperStyle={{ fontSize: "11px", color: "#8A7560" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

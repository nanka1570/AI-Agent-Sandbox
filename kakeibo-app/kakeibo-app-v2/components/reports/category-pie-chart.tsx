"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { CHART_THEME } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils/format";

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
            labelLine={{ stroke: CHART_THEME.axisColor }}
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: CHART_THEME.tooltipBg,
              border: `1px solid ${CHART_THEME.tooltipBorder}`,
              borderRadius: CHART_THEME.tooltipBorderRadius,
              color: CHART_THEME.tooltipText,
            }}
            formatter={(value) => [formatCurrency(Number(value)), "支出"]}
          />
          <Legend wrapperStyle={{ fontSize: `${CHART_THEME.axisFontSize}px`, color: CHART_THEME.axisColor }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

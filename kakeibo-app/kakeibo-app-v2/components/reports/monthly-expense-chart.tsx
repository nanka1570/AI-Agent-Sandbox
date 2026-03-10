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
import { CHART_THEME } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils/format";

interface MonthlyExpenseChartProps {
  data: Array<{ month: string; total: number }>;
}

export function MonthlyExpenseChart({ data }: MonthlyExpenseChartProps) {
  if (data.length === 0 || data.every((d) => d.total === 0)) {
    return (
      <div className="data-panel p-6 text-center text-sm text-muted-foreground">
        この年のデータがありません
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: d.month.split("-")[1] + "月",
    金額: d.total,
  }));

  return (
    <div className="data-panel p-4">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.gridColor} />
          <XAxis
            dataKey="name"
            tick={{ fill: CHART_THEME.axisColor, fontSize: CHART_THEME.axisFontSize }}
            axisLine={{ stroke: CHART_THEME.axisColor }}
          />
          <YAxis
            tick={{ fill: CHART_THEME.axisColor, fontSize: CHART_THEME.axisFontSize }}
            axisLine={{ stroke: CHART_THEME.axisColor }}
            tickFormatter={(v) => `${(v / 10000).toFixed(0)}万`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: CHART_THEME.tooltipBg,
              border: `1px solid ${CHART_THEME.tooltipBorder}`,
              borderRadius: CHART_THEME.tooltipBorderRadius,
              color: CHART_THEME.tooltipText,
            }}
            formatter={(value) => [formatCurrency(Number(value)), "支出"]}
          />
          <Bar dataKey="金額" fill={CHART_THEME.accentColor} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

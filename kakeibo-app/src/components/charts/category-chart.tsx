"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  type PieLabelRenderProps,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

type ChartData = {
  name: string;
  total: number;
};

type Props = {
  data: ChartData[];
};

// design_spec.md のチャートカラー
const COLORS = [
  "hsl(265 89% 66%)", // Violet
  "hsl(188 90% 45%)", // Cyan
  "hsl(340 90% 60%)", // Pink
  "hsl(50 100% 65%)", // Yellow
  "hsl(150 90% 40%)", // Mint
];

function renderLabel(props: PieLabelRenderProps): string {
  const name = props.name ?? "";
  const percent = typeof props.percent === "number" ? props.percent : 0;
  return `${name} ${(percent * 100).toFixed(0)}%`;
}

export function CategoryChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center border-2 border-border bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <p className="text-muted-foreground">データがありません</p>
      </div>
    );
  }

  return (
    <div className="border-2 border-border bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <h3 className="mb-6 flex items-center gap-2 text-xl font-black">
        <span className="inline-block -skew-x-12 bg-black px-2 py-1 text-sm text-white">BREAKDOWN</span>
        利用内訳
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={90}
            stroke="black"
            strokeWidth={2}
            label={renderLabel}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface ChartPoint {
  date: string; // "YYYY-MM-DD"
  adjClose: number;
  sma50: number | null;
  sma200: number | null;
  rsi: number | null;
}

// 価格（調整後終値 + SMA50/200）と RSI の 2 段チャート
export function PriceChart({ data }: { data: ChartPoint[] }) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-2 text-sm font-bold">
          株価（調整後終値）と移動平均
        </h2>
        {/* 軸・グリッドは currentColor で描くため、ここの文字色がチャートの配色になる */}
        <ResponsiveContainer className="text-gray-500 dark:text-gray-400" width="100%" height={320}>
          <LineChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              strokeOpacity={0.25}
            />
            <XAxis dataKey="date" minTickGap={60} tick={{ fontSize: 11, fill: "currentColor" }} />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fontSize: 11, fill: "currentColor" }}
              tickFormatter={(v: number) => `$${v}`}
            />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="adjClose"
              name="調整後終値"
              stroke="#3b82f6"
              dot={false}
              strokeWidth={1.5}
            />
            <Line
              type="monotone"
              dataKey="sma50"
              name="SMA50"
              stroke="#f59e0b"
              dot={false}
              strokeWidth={1}
            />
            <Line
              type="monotone"
              dataKey="sma200"
              name="SMA200"
              stroke="#dc2626"
              dot={false}
              strokeWidth={1}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-lg border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-2 text-sm font-bold">RSI (14)</h2>
        {/* 軸・グリッドは currentColor で描くため、ここの文字色がチャートの配色になる */}
        <ResponsiveContainer className="text-gray-500 dark:text-gray-400" width="100%" height={140}>
          <LineChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              strokeOpacity={0.25}
            />
            <XAxis dataKey="date" minTickGap={60} tick={{ fontSize: 11, fill: "currentColor" }} />
            <YAxis domain={[0, 100]} ticks={[0, 30, 50, 70, 100]} tick={{ fontSize: 11, fill: "currentColor" }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="rsi"
              name="RSI"
              stroke="#8b5cf6"
              dot={false}
              strokeWidth={1.5}
            />
          </LineChart>
        </ResponsiveContainer>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          30 以下 = 売られすぎ（買い目安） / 70 以上 = 買われすぎ（売り目安）
        </p>
      </div>
    </div>
  );
}

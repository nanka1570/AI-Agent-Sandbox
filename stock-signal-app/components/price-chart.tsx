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
      <div className="rounded-lg border bg-white p-4">
        <h2 className="mb-2 text-sm font-bold">
          株価（調整後終値）と移動平均
        </h2>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" minTickGap={60} tick={{ fontSize: 11 }} />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fontSize: 11 }}
              tickFormatter={(v: number) => `$${v}`}
            />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="adjClose"
              name="調整後終値"
              stroke="#2563eb"
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

      <div className="rounded-lg border bg-white p-4">
        <h2 className="mb-2 text-sm font-bold">RSI (14)</h2>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" minTickGap={60} tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} ticks={[0, 30, 50, 70, 100]} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="rsi"
              name="RSI"
              stroke="#7c3aed"
              dot={false}
              strokeWidth={1.5}
            />
          </LineChart>
        </ResponsiveContainer>
        <p className="mt-1 text-xs text-gray-500">
          30 以下 = 売られすぎ（買い目安） / 70 以上 = 買われすぎ（売り目安）
        </p>
      </div>
    </div>
  );
}

"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const COLORS = ["#1f4d3a", "#9a6700", "#9f1239", "#1d4ed8", "#0f766e", "#7c3aed"];

export function WeightChart({ series }: { series: Array<{ pigId: string; points: Array<{ date: string; weightKg: number }> }> }) {
  const dates = [...new Set(series.flatMap((item) => item.points.map((point) => point.date)))].sort();
  const data = dates.map((date) => {
    const row: Record<string, string | number> = { date };
    for (const item of series) {
      const point = item.points.find((entry) => entry.date === date);
      if (point) row[item.pigId] = point.weightKg;
    }
    return row;
  });
  if (data.length === 0) return null;
  return (
    <div className="h-72 w-full rounded-2xl border bg-white p-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="#eee" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} unit=" kg" width={56} />
          <Tooltip />
          <Legend />
          {series.map((item, index) => (
            <Line key={item.pigId} type="monotone" dataKey={item.pigId} stroke={COLORS[index % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} connectNulls />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

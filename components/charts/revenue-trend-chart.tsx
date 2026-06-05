"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartGrid, chartPalette, compactMoney, tooltipMoney, type ChartDatum } from "@/components/charts/chart-types";

export function RevenueTrendChart({ data }: { data: ChartDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid stroke={chartGrid} vertical={false} />
        <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis tickFormatter={compactMoney} tickLine={false} axisLine={false} fontSize={12} />
        <Tooltip formatter={tooltipMoney} />
        <Line type="monotone" dataKey="value" stroke={chartPalette.teal} strokeWidth={3} dot={false} />
        <Line type="monotone" dataKey="secondary" stroke={chartPalette.gold} strokeWidth={3} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

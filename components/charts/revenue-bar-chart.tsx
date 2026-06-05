"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartGrid, chartPalette, compactMoney, tooltipMoney, type ChartDatum } from "@/components/charts/chart-types";

export function RevenueBarChart({ data }: { data: ChartDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid stroke={chartGrid} vertical={false} />
        <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis tickFormatter={compactMoney} tickLine={false} axisLine={false} fontSize={12} />
        <Tooltip formatter={tooltipMoney} />
        <Bar dataKey="value" fill={chartPalette.teal} radius={[6, 6, 0, 0]} />
        <Bar dataKey="secondary" fill={chartPalette.gold} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

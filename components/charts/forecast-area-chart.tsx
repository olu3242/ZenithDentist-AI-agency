"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartGrid, chartPalette, compactMoney, tooltipMoney, type ChartDatum } from "@/components/charts/chart-types";

export function ForecastAreaChart({ data }: { data: ChartDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="forecastRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={chartPalette.teal} stopOpacity={0.45} />
            <stop offset="95%" stopColor={chartPalette.teal} stopOpacity={0.04} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={chartGrid} vertical={false} />
        <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis tickFormatter={compactMoney} tickLine={false} axisLine={false} fontSize={12} />
        <Tooltip formatter={tooltipMoney} />
        <Area type="monotone" dataKey="value" stroke={chartPalette.teal} strokeWidth={3} fill="url(#forecastRevenue)" />
        <Area type="monotone" dataKey="secondary" stroke={chartPalette.gold} strokeWidth={2} fill="transparent" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

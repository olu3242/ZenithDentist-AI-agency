"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartGrid, chartPalette, compactNumber, type ChartDatum } from "@/components/charts/chart-types";

export function RecallFunnel({ data }: { data: ChartDatum[] }) {
  return <FunnelBars data={data} color={chartPalette.emerald} />;
}

export function FunnelBars({ data, color }: { data: ChartDatum[]; color: string }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data}>
        <CartesianGrid stroke={chartGrid} vertical={false} />
        <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis tickFormatter={compactNumber} tickLine={false} axisLine={false} fontSize={12} />
        <Tooltip />
        <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

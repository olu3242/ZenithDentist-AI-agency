"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartGrid, chartPalette, type ChartDatum } from "@/components/charts/chart-types";

export function ProviderPerformanceBar({ data }: { data: ChartDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
        <CartesianGrid stroke={chartGrid} horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} fontSize={12} />
        <YAxis dataKey="name" type="category" width={92} tickLine={false} axisLine={false} fontSize={12} />
        <Tooltip />
        <Bar dataKey="value" fill={chartPalette.blue} radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { chartPalette, type ChartDatum } from "@/components/charts/chart-types";

export function WorkflowHealthDonut({ data }: { data: ChartDatum[] }) {
  return <Donut data={data} colors={[chartPalette.teal, chartPalette.gold, chartPalette.rust, chartPalette.blue]} />;
}

export function Donut({ data, colors }: { data: ChartDatum[]; colors: string[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} innerRadius={64} outerRadius={92} dataKey="value" nameKey="name" paddingAngle={3}>
          {data.map((entry, index) => <Cell key={entry.name} fill={entry.fill ?? colors[index % colors.length]} />)}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

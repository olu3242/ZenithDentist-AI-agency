import { RevenueBarChart, RevenueTrendChart, WorkflowHealthDonut } from "@/components/charts";
import { workflowHealthData } from "@/components/executive/sample-data";

const volume = [
  { name: "Mon", value: 320, secondary: 18 },
  { name: "Tue", value: 410, secondary: 22 },
  { name: "Wed", value: 390, secondary: 16 },
  { name: "Thu", value: 460, secondary: 24 },
  { name: "Fri", value: 520, secondary: 20 }
];

export function WorkflowHealthWidget() {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-gold">Executive NOC</p>
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <WorkflowHealthDonut data={workflowHealthData} />
        <RevenueTrendChart data={volume} />
        <RevenueBarChart data={volume.map(item => ({ ...item, value: item.secondary ?? 0, secondary: Math.round((item.secondary ?? 0) / 2) }))} />
      </div>
    </section>
  );
}

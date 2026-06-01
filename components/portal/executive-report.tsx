import Link from "next/link";
import { Download } from "lucide-react";
import type { Report } from "@/lib/data/operations";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export function ExecutiveReport({ report }: { report: Report }) {
  const metrics = report.metrics as Record<string, number>;
  return (
    <section className="rounded border border-card bg-white p-6 shadow-card">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-accent">{report.period} executive report</p>
          <h2 className="mt-2 text-3xl font-black">{report.title}</h2>
          <p className="mt-3 max-w-3xl text-muted">{report.summary}</p>
        </div>
        <Button asChild variant="secondary">
          <Link href={`/api/reports/${report.id}`}>
            <Download className="h-4 w-4" />
            Download
          </Link>
        </Button>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <ReportStat label="Recovered Revenue" value={formatCurrency(metrics.recoveredRevenue ?? 0)} />
        <ReportStat label="No-show Reduction" value={`${metrics.noShowReduction ?? 0} pts`} />
        <ReportStat label="Reviews Generated" value={String(metrics.reviewsGenerated ?? 0)} />
        <ReportStat label="Admin Hours Saved" value={String(metrics.adminHoursSaved ?? 0)} />
      </div>
    </section>
  );
}

function ReportStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-background p-4">
      <span className="text-xs font-black uppercase tracking-wider text-muted">{label}</span>
      <strong className="mt-2 block text-2xl font-black text-[#F8FAFC]">{value}</strong>
    </div>
  );
}

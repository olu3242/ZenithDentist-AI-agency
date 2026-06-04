import { NextRequest, NextResponse } from "next/server";
import { getPortalData, buildExecutiveReport } from "@/lib/data/operations";
import { getTenantData } from "@/lib/data/tenants";
import { reportToHtml } from "@/lib/reports";
import { trackOutreachEvent } from "@/lib/data/leads";
import { createServiceClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  const { id } = await params;

  const data = await getPortalData();

  const report =
    data.reports.find((item) => item.id === id) ??
    buildExecutiveReport(data);

  const html = reportToHtml(report);

  await trackOutreachEvent({
    eventType: "cta_clicked",
    metadata: {
      area: "report_download",
      reportId: report.id,
      period: report.period,
    },
  });

  const supabase = createServiceClient();
  if (supabase) {
    await (supabase as any).from("report_generation_log").insert({
      report_id: report.id,
      organization_id: report.organization_id,
      source_records: [
        { table: "reports", id: report.id },
        { table: "operational_metrics", scope: "latest" },
        { table: "recommendations", scope: "report_recommendations" }
      ],
      generated_by: "report_download_route",
      generated_at: report.generated_at,
      downloaded_at: new Date().toISOString()
    });
  }

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${report.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}.html"`,
    },
  });
}

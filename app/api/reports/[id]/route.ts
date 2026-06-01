import { NextResponse } from "next/server";
import { getPortalData, buildExecutiveReport } from "@/lib/data/operations";
import { reportToHtml } from "@/lib/reports";
import { trackOutreachEvent } from "@/lib/data/leads";

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const data = await getPortalData();
  const report = data.reports.find(item => item.id === id) ?? buildExecutiveReport(data);
  const html = reportToHtml(report);
  await trackOutreachEvent({
    eventType: "cta_clicked",
    metadata: { area: "report_download", reportId: report.id, period: report.period }
  });

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${report.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.html"`
    }
  });
}

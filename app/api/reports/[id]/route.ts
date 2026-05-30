import { NextResponse } from "next/server";
import { getPortalData, buildExecutiveReport } from "@/lib/data/operations";
import { reportToHtml } from "@/lib/reports";
import { trackOutreachEvent } from "@/lib/data/leads";
import { getTenantData } from "@/lib/data/tenants";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const tenantData = await getTenantData();
  const data = await getPortalData(tenantData.tenant.organizationId ?? undefined);
  const report = data.reports.find(item => item.id === params.id) ?? buildExecutiveReport(data);
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

import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard, extractOrgId } from "@/lib/tenant/tenant-guards";
import { getPortalData, buildExecutiveReport } from "@/lib/data/operations";
import { reportToHtml } from "@/lib/reports";
import { trackOutreachEvent } from "@/lib/data/leads";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const orgId = extractOrgId(req);
  const ctx = await withTenantGuard(orgId).catch(() =>
    NextResponse.json({ ok: false, error: "Tenant resolution failed" }, { status: 403 })
  );
  if (ctx instanceof NextResponse) return ctx;

  const data = await getPortalData(ctx.organizationId);
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

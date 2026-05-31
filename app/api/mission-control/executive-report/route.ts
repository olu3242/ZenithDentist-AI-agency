import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard, extractOrgId } from "@/lib/tenant/tenant-guards";
import { buildExecutiveReportSnapshot, persistExecutiveReportSnapshot, renderExecutiveReportHtml } from "@/lib/runtime/executive-reporting";

export async function GET(req: NextRequest) {
  const orgId = extractOrgId(req);
  const ctx = await withTenantGuard(orgId).catch(() =>
    NextResponse.json({ ok: false, error: "Tenant resolution failed" }, { status: 403 })
  );
  if (ctx instanceof NextResponse) return ctx;

  const report = await buildExecutiveReportSnapshot();
  const url = new URL(req.url);
  const persist = url.searchParams.get("persist") === "true";
  const format = url.searchParams.get("format");
  const snapshot = persist ? await persistExecutiveReportSnapshot(report) : null;

  if (format === "html") {
    return new NextResponse(renderExecutiveReportHtml(report), {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="runtime-intelligence-report.html"`
      }
    });
  }

  return NextResponse.json({ report, snapshot });
}

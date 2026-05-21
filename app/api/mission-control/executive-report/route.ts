import { NextResponse } from "next/server";
import { buildExecutiveReportSnapshot, persistExecutiveReportSnapshot, renderExecutiveReportHtml } from "@/lib/runtime/executive-reporting";

export async function GET(request: Request) {
  const report = await buildExecutiveReportSnapshot();
  const url = new URL(request.url);
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

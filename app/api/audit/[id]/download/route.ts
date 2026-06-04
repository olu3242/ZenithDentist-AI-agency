import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { trackOutreachEvent } from "@/lib/data/leads";

type RouteContext = { params: Promise<{ id: string }> };

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  if (id === "00000000-0000-0000-0000-000000000000") {
    return NextResponse.json({ error: "Audit not found" }, { status: 404 });
  }
  const supabase = createServiceClient();

  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  // Fetch audit record
  const auditResult = await withTimeout(
    supabase.from("audits").select("*").eq("id", id).single(),
    5_000
  );
  if (!auditResult) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
  const { data: audit, error } = auditResult;
  if (error || !audit) {
    logger.warn("audit_download_not_found", { auditId: id });
    return NextResponse.json({ error: "Audit not found" }, { status: 404 });
  }

  // Fetch associated lead
  const { data: lead } = audit.lead_id
    ? await supabase.from("leads").select("*").eq("id", audit.lead_id).single()
    : { data: null };

  const recovery = Number(audit.projected_recovery ?? 0);
  const aliceReport = audit.alice_report as Record<string, unknown> | null;
  const score = (aliceReport as any)?.practiceHealthScore ?? null;
  const recommendations = (audit.recommendations as Array<{ title?: string; description?: string }> | null) ?? [];
  const snapshot = audit.ninety_day_snapshot as Record<string, unknown> | null;

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Revenue Opportunity Audit — ${lead?.practice_name ?? "Your Practice"}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Inter,-apple-system,Arial,sans-serif;color:#0f172a;background:#fff;padding:48px;max-width:900px;margin:0 auto}
    .header{border-bottom:3px solid #14b8a6;padding-bottom:24px;margin-bottom:32px}
    .brand{color:#14b8a6;font-size:11px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;margin-bottom:8px}
    h1{font-size:36px;font-weight:900;line-height:1.1;margin-bottom:8px}
    .subtitle{color:#64748b;font-size:13px}
    .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin:32px 0}
    .card{border:1px solid #e2e8f0;border-radius:12px;padding:20px}
    .card-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#64748b;margin-bottom:6px}
    .card-value{font-size:32px;font-weight:900;color:#14b8a6}
    .card-value.dark{color:#0f172a}
    .section{margin:32px 0}
    .section-title{font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.15em;color:#14b8a6;margin-bottom:16px}
    h2{font-size:22px;font-weight:900;margin-bottom:12px}
    .rec{border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin-bottom:10px}
    .rec-title{font-weight:900;margin-bottom:4px}
    .rec-desc{font-size:13px;color:#64748b}
    .snap-item{display:flex;align-items:start;gap:12px;margin-bottom:12px}
    .snap-dot{width:8px;height:8px;border-radius:50%;background:#14b8a6;margin-top:5px;flex-shrink:0}
    .footer{border-top:1px solid #e2e8f0;margin-top:40px;padding-top:20px;font-size:11px;color:#94a3b8}
    @media print{body{padding:32px}}
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">Zenith AI Automation Agency™ · Dental Revenue Operating System</div>
    <h1>Revenue Opportunity Audit</h1>
    <div class="subtitle">
      ${lead?.practice_name ?? "Your Practice"}
      ${lead?.email ? ` · ${lead.email}` : ""}
      · Generated ${new Date(audit.generated_at ?? Date.now()).toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" })}
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="card-label">Estimated Monthly Recovery</div>
      <div class="card-value">${formatCurrency(recovery)}</div>
    </div>
    <div class="card">
      <div class="card-label">Practice Growth Score</div>
      <div class="card-value dark">${score !== null ? `${score} / 100` : "—"}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Executive Summary</div>
    <p style="line-height:1.7;color:#334155">${audit.audit_summary ?? "Assessment complete. See recommendations below."}</p>
  </div>

  ${recommendations.length > 0 ? `
  <div class="section">
    <div class="section-title">Recovery Recommendations</div>
    <h2>Top Opportunities Identified</h2>
    ${recommendations.slice(0, 6).map((r) => `
      <div class="rec">
        <div class="rec-title">${r.title ?? "Opportunity"}</div>
        <div class="rec-desc">${r.description ?? ""}</div>
      </div>
    `).join("")}
  </div>` : ""}

  ${snapshot ? `
  <div class="section">
    <div class="section-title">90-Day Opportunity Snapshot</div>
    ${Object.entries(snapshot).slice(0, 6).map(([key, val]) => `
      <div class="snap-item">
        <div class="snap-dot"></div>
        <div><strong>${key.replace(/_/g," ")}:</strong> ${String(val)}</div>
      </div>
    `).join("")}
  </div>` : ""}

  <div style="margin-top:40px;background:#f8fafc;border-radius:12px;padding:24px">
    <div class="section-title">Next Step</div>
    <h2 style="margin-bottom:8px">Book Your Strategy Session</h2>
    <p style="color:#64748b;line-height:1.7">
      This report has been prepared as a complimentary analysis.
      Schedule a strategy session to walk through your personalized revenue recovery plan with a Zenith advisor.
    </p>
  </div>

  <div class="footer">
    <p>© ${new Date().getFullYear()} Zenith AI Automation Agency™. All rights reserved. This report is confidential and intended solely for the named practice.</p>
    <p style="margin-top:4px">Sample estimates based on industry benchmarks. Actual results vary by practice profile and implementation.</p>
  </div>
</body>
</html>`;

  void trackOutreachEvent({
    leadId: audit.lead_id,
    eventType: "cta_clicked",
    metadata: { area: "audit_download", auditId: id }
  });

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="zenith-revenue-audit-${id.slice(0, 8)}.html"`
    }
  });
}

async function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T | null> {
  let timeout: ReturnType<typeof setTimeout>;
  return Promise.race([
    Promise.resolve(promise),
    new Promise<null>(resolve => {
      timeout = setTimeout(() => resolve(null), ms);
    })
  ]).finally(() => clearTimeout(timeout!));
}

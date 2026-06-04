import type { Report } from "@/lib/data/operations";
import { brandConfig } from "@/lib/brand";
import { formatCurrency } from "@/lib/utils";

export function reportToHtml(report: Report) {
  const metrics = report.metrics as Record<string, number>;
  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${report.title}</title>
        <style>
          body { font-family: Inter, Arial, sans-serif; color: ${brandConfig.colors.foreground}; margin: 48px; }
          .report-header { border-bottom: 3px solid ${brandConfig.colors.primary}; margin-bottom: 28px; padding-bottom: 18px; }
          .brand { color: ${brandConfig.colors.primary}; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
          .subtitle { color: ${brandConfig.colors.muted}; font-size: 12px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
          h1 { font-size: 42px; line-height: 1.05; }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
          .card { border: 1px solid ${brandConfig.colors.border}; border-radius: 8px; padding: 18px; }
          .value { font-size: 30px; font-weight: 900; color: ${brandConfig.colors.secondary}; }
        </style>
      </head>
      <body>
        <div class="report-header">
          <div class="brand">${brandConfig.name} Executive Briefing</div>
          <div class="subtitle">${brandConfig.brandName}</div>
        </div>
        <h1>${report.title}</h1>
        <p>${report.summary}</p>
        <div class="grid">
          <div class="card"><div>Recovered Revenue</div><div class="value">${formatCurrency(metrics.recoveredRevenue ?? 0)}</div></div>
          <div class="card"><div>No-show Reduction</div><div class="value">${metrics.noShowReduction ?? 0}%</div></div>
          <div class="card"><div>Recall Recovery</div><div class="value">${metrics.recallRecovery ?? 0}</div></div>
          <div class="card"><div>Admin Hours Saved</div><div class="value">${metrics.adminHoursSaved ?? 0}</div></div>
        </div>
      </body>
    </html>
  `;
}

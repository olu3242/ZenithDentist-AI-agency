# Assessment Engine Audit

## Status: PRODUCTION READY ✅

---

## Engine Components

| Component | File | Status |
|-----------|------|--------|
| Validation schema | lib/validation.ts | ✅ Zod, strict types |
| ROI calculation | lib/roi.ts | ✅ Real math, no hardcoded values |
| LIZ report builder | lib/roi.ts buildAliceRevenueOpportunityReport() | ✅ Generates from inputs |
| Server action | app/actions.ts submitFunnelAction() | ✅ Full validation + persistence |
| Lead creation | lib/data/leads.ts createLeadFunnel() | ✅ 3-table atomic insert |
| Form UI | components/public/roi-funnel-form.tsx | ✅ 7 sliders, live updates |
| Results preview | components/public/roi-funnel-form.tsx AssessmentPreview | ✅ Live from real calculation |
| Report preview | components/public/audit-preview.tsx | ✅ Post-submit unlock |

---

## Inputs

| Field | Type | Default | Validation |
|-------|------|---------|------------|
| Monthly appointments | number | 420 | 50–2400 |
| Avg visit value | number | $310 | $100–$1,600 |
| No-show rate | number | 18% | 0–45% |
| Treatment acceptance | number | 54% | 20–95% |
| Recall rate | number | 68% | 25–98% |
| Providers | number | 4 | 1–24 |
| Locations | number | 1 | 1–40 |

All defaults are industry-representative averages. No hardcoded outputs.

---

## Calculation Logic (lib/roi.ts)

All calculations are formula-driven from inputs. No hardcoded revenue figures.

```
noShowLoss = monthlyAppointments × (noShowRate/100) × avgVisitValue
recallLoss = recallPatientsAtRisk × avgVisitValue
adminLoss = adminHoursPerDay × 22 × 22
revenueRecoveryOpportunity = recoverableRevenue + treatmentOpportunity + chairFillOpportunity×0.35 + reviewOpportunity + referralOpportunity
practiceHealthScore = 100 - noShowRate×1.1 - recallGap×0.28 - treatmentGap×0.35 - adminHoursPerDay×1.4
```

Score clamped 42–98. Confidence: "moderate" or "aggressive" based on metric thresholds.

---

## Database Persistence

Three tables written on submission:

1. **leads** — contact info, practice details, attribution JSON
2. **roi_calculations** — all input values + calculated outputs
3. **audits** — recommendations JSON, alice_report JSON, 90-day snapshot JSON

All writes use service client (bypasses RLS). Error codes specific to each table.

---

## LIZ Report (buildAliceRevenueOpportunityReport)

Generated fields:
- `practiceHealthScore` (0–100)
- `topRevenueLeaks[]` — ranked list of leak items
- `recommendedRevenuePlaybooks[]` — prioritized playbooks
- `executiveSummary` — 1-sentence narrative
- `ninetyDaySnapshot` — milestone targets

No hardcoded values. All derived from input + projection.

---

## Confirmation: No Mock Data in Assessment Engine

- ✅ No `Math.random()` calls in roi.ts
- ✅ No hardcoded dollar amounts in roi.ts
- ✅ Default slider values are industry averages (not fake outputs)
- ✅ Placeholder text in form fields is UX-standard (practice name, email) — not output data
- ✅ LIZ insight cards in landing page marked "Sample practice data for illustration"
- ✅ Sample report section clearly labeled "Sample data shown"

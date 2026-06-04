# Executive KPI Report

## Zenith — Executive Dashboard KPIs

**Date:** 2026-06-03

---

## Acquisition KPIs

| KPI | Source | Current Visibility |
|-----|--------|--------------------|
| Visitors | cta_events + outreach_events | ✅ Admin dashboard |
| Leads (Assessments) | leads table | ✅ Admin dashboard |
| Assessments Started | outreach_events (assessment_started) | ✅ Admin dashboard |
| Audits Delivered | audits table | ✅ Admin dashboard |
| Bookings (Strategy Sessions) | bookings table | ✅ Admin dashboard |
| Active Opportunities | opportunities table | ✅ Admin dashboard (FIXED) |

---

## Revenue KPIs

| KPI | Formula | Source | Current Visibility |
|-----|---------|--------|--------------------|
| Pipeline Value | SUM(opportunities.pipeline_value) | opportunities | ✅ Admin dashboard |
| Est. Recoverable Revenue | SUM(roi_calculations.revenue_recovery_opportunity) | roi_calculations | ✅ Admin dashboard |
| MRR | Active clients × monthly fee | External (billing system) | Manual |
| ARR | MRR × 12 | External | Manual |
| Customer LTV | Avg MRR × avg contract months | External | Manual |
| CAC | Total acquisition spend / new clients | External | Manual |

---

## Conversion KPIs

| KPI | Formula | Visibility |
|-----|---------|------------|
| Lead → Audit Conversion | audits / assessments_started × 100 | ✅ Admin dashboard |
| Audit → Booking Rate | bookings / audits × 100 | ✅ Admin dashboard |
| Show Rate | completed / scheduled bookings × 100 | ✅ Admin dashboard |
| Booking → Close Rate | clients_won / bookings | Manual (leads.status = "won") |

---

## Operational KPIs

| KPI | Source | Visibility |
|-----|--------|------------|
| Workflow Health Score | automation_traces | ✅ Executive Dashboard |
| Dead Letter Queue Depth | automation_dead_letters | ✅ Executive Dashboard |
| Recovery Success Rate | workflow_recovery_metrics | ✅ Executive Dashboard |
| PMS Sync Uptime | pms_integrations | ✅ /dashboard/pms/sync-health |
| Event Fabric Throughput | runtime_event_fabric_events | ✅ Executive Dashboard |

---

## KPI Dashboard Locations

| Dashboard | URL | Audience |
|-----------|-----|----------|
| Revenue Command Center | /admin | Internal team |
| Executive Dashboard | /mission-control | Platform ops |
| Automation Platform | /workflow-os | Engineering |
| Runtime OS | /runtime-os | Engineering |
| Client Portal | /portal/revenue | Client |
| GTM Command Center | /gtm-command-center | Sales/Marketing |

---

## Target State KPIs (First 100 Clients)

| KPI | Target |
|-----|--------|
| Monthly new leads | 50+ |
| Assessment → Booking conversion | 30%+ |
| Monthly new clients | 5-8 |
| MRR | $[TARGET_MRR] |
| Average pipeline value per lead | $[TARGET_PIPELINE] |
| Client retention (90-day) | 95%+ |

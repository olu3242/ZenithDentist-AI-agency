# Executive Dashboard Data Audit

## Status: WIRED ✅ — All dashboards read from canonical sources

---

## Admin Dashboard Data Sources

**Entry point**: `app/admin/page.tsx`  
**Data function**: `getAdminDashboardData()` — `lib/data/leads.ts`

### Tables Queried

| Table | Used For | Status |
|-------|----------|--------|
| leads | CRM table, pipeline, funnel counts | ✅ |
| roi_calculations | Revenue dashboard, charts | ✅ |
| audits | Audit records table | ✅ |
| bookings | Booking pipeline column | ✅ |
| outreach_events | Event log, funnel analytics | ✅ |

### Components Consuming Data

| Component | Data Source | Status |
|-----------|-------------|--------|
| RevenueDashboard | getAdminDashboardData() | ✅ |
| LeadPipeline | data.leads + data.bookings | ✅ |
| AdminCharts | data.leads + data.roiCalculations + data.events | ✅ |
| CRMTable | data.leads (first 8) | ✅ |

---

## Sub-pages Data Sources

| Page | Data Function | Source Table(s) |
|------|---------------|-----------------|
| admin/leads | getAdminDashboardData() | leads |
| admin/roi | getAdminDashboardData() | roi_calculations |
| admin/bookings | getAdminDashboardData() | bookings |
| admin/audits | getAdminDashboardData() | audits |
| admin/analytics | getAdminDashboardData() | outreach_events |

All admin pages use the same canonical `getAdminDashboardData()` function. No independent data fetching or hardcoded values.

---

## getAdminDashboardData() Structure

```typescript
{
  leads: Lead[],
  roiCalculations: RoiCalculation[],
  audits: Audit[],
  bookings: Booking[],
  events: OutreachEvent[]
}
```

Service client used (bypasses RLS — admin-only access).  
Organization scoping: optional `organizationId` parameter available for multi-tenant filtering.

---

## Executive Dashboard Pipeline

Lead statuses visible in pipeline:
- `new` — initial state
- `audit_requested` — assessment submitted
- `booked` — strategy session scheduled (via Calendly webhook)
- `qualified` — manual admin action
- `won` / `lost` — manual sales decision

Pipeline reads directly from `leads.status` column. No synthetic status derivation.

---

## Confirmation: No Mock Data in Admin Dashboard

- ✅ No hardcoded lead arrays
- ✅ No static chart data
- ✅ Empty state handled by `emptyAdminData()` (returns zero values, not fake data)
- ✅ All revenue figures derived from roi_calculations.revenue_recovery_opportunity
- ✅ Assessment count derived from leads where source = "free_revenue_opportunity_assessment"

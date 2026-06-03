# Schema Inventory Report

## Date: 2026-06-03 | Source: Local Migration Files (39 files)

---

## Totals

| Object Type | Count |
|-------------|-------|
| Tables | 248 |
| Tables with RLS | 290+ |
| Indexes | 308 |
| Triggers | 4 (updated_at) |
| Enums | 15+ |

---

## Module Table Counts

| Module | Tables |
|--------|--------|
| Organizations / Tenancy | 8 |
| Patient Revenue Engine | 12 |
| Workflow OS | 12 |
| ALICE Intelligence | 22 |
| Revenue Attribution | 11 |
| Communications / Video | 15 |
| Mission Control | 12 |
| GTM / Sales | 9 |
| Client Success | 6 |
| Recovery / DLQ | 5 |
| Operational OS | 13 |
| Commercial / Billing | 12 |
| SLA / Governance | 8 |
| Evidence / Compliance | 10 |
| Other | 103 |

---

## Core Revenue Funnel Tables (Application-Queried)

| Table | FK | Queried By |
|-------|----|----|
| public.leads | — | lib/data/leads.ts |
| public.roi_calculations | lead_id | lib/data/leads.ts |
| public.audits | lead_id | lib/data/leads.ts |
| public.bookings | lead_id, assessment_id | lib/data/leads.ts |
| public.outreach_events | lead_id | lib/data/leads.ts |
| public.opportunities | lead_id, assessment_id | lib/data/leads.ts (FIXED) |
| public.cta_events | lead_id | api/analytics/cta |
| public.organizations | — | lib/data/tenants.ts |
| public.runtime_event_fabric_events | — | lib/event-fabric.ts |

---

## RLS Policy Pattern

All operational tables:
```sql
CREATE POLICY "service_role_all" ON public.<table>
  FOR ALL TO service_role USING (true);
```

Service role key (SUPABASE_SERVICE_ROLE_KEY) bypasses RLS on all server-side operations.

---

## Index Strategy

- **FK indexes** — all foreign key columns indexed
- **Timestamp indexes** — created_at, emitted_at, generated_at (for time-range queries)
- **Status indexes** — event_type, stage, booking_status (for filter queries)
- **Attribution indexes** — utm_source, session_id, lead_id (for funnel analytics)

---

## Triggers

| Trigger | Table | Action |
|---------|-------|--------|
| set_updated_at | leads | BEFORE UPDATE → updated_at = now() |
| set_updated_at | organizations | BEFORE UPDATE → updated_at = now() |
| set_updated_at | opportunities | BEFORE UPDATE → updated_at = now() |
| set_updated_at | pms_integrations | BEFORE UPDATE → updated_at = now() |

---

## Schema Gap Findings

| Gap | Severity |
|-----|---------|
| `workflow_executions` referenced in automation-health API but no CREATE TABLE found | Medium |
| Remote schema state unknown (CLI auth blocked) | High |

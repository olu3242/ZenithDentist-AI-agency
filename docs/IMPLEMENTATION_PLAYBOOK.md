
# Implementation Playbook — PROS Sprint
**Generated:** 2026-06-01  
**For:** Dental Practice Onboarding Teams

---

## 30-Day Launch Plan

### Week 1: Setup

**Objective:** Platform configured, practice connected, team onboarded.

**Day 1–2: Supabase Configuration**
- Deploy Supabase project
- Run all migrations in order (040 through 202606010002)
- Verify `organizations`, `profiles`, `organization_members` tables exist
- Verify RLS policies enabled on all tables

**Day 3: Environment Configuration**
```
NEXT_PUBLIC_SUPABASE_URL=your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ANTHROPIC_API_KEY=sk-ant-...
AI_PROVIDER=anthropic
```

**Day 4: First User Bootstrap**
- Navigate to `/signup`
- Create practice owner account via `BootstrapInput` flow
- `provisionOrganization()` creates org + default settings + owner membership
- Verify `organization_id` in profiles table

**Day 5: PMS Connection**
- Select PMS provider from `listSupportedProviders()`: dentrix | eaglesoft | open_dental | denticon
- Run `adapter.testConnection()` — verify `{ connected: true }`
- Register in `pms_integrations` table with `sync_status: "never"`
- For Open Dental pilot: verify `runOpenDentalPilotSync()` returns without error

**Day 6–7: Team Onboarding**
- Create team members in `profiles` table with appropriate roles (org_admin, provider, staff)
- Verify `organization_members` rows with correct `role`
- Grant Executive Dashboard access (org_admin role required)

---

### Week 2: Workflow Activation

**Objective:** Default workflows installed and tested.

**Install Default Workflows** (per `lib/onboarding/index.ts::DEFAULT_WORKFLOWS_FOR_NEW_PRACTICE`):
1. `appointment_no_show` — no-show prevention reminders
2. `recall_due` — recall recovery outreach
3. `review_request_due` — post-visit review requests
4. `treatment_followup_due` — treatment plan follow-up
5. `reactivation_candidate_detected` — inactive patient reactivation

**Test No-Show Prevention:**
```
triggerNoShowPrevention({
  organizationId: "org-xxx",
  patientId: "patient-xxx",
  appointmentId: "appt-xxx",
  scheduledAt: "2026-06-15T14:00:00Z",
  patientName: "Test Patient"
})
→ verify automation_events row created
→ verify automation_traces row with status="completed"
```

**Test Recall Recovery:**
```
triggerRecallRecovery("org-xxx", { patientId: "patient-xxx", recallType: "6-month" })
→ verify workflow_executions row created
→ verify executeWorkflow() returns executionId
```

**Verify in Executive Dashboard:**
- `automation-blueprint-table.tsx` — shows all 5 workflows as "active"
- `runtime-health-dashboard.tsx` — operational score > 0
- `sla-breach-panel.tsx` — no breaches

---

### Week 3: Revenue Engine Live

**Objective:** All 6 revenue engines active, attribution tracking confirmed.

**Activate all 6 engines:**
1. No-Show Prevention — trigger on every new appointment
2. Recall Recovery — trigger daily for patients with `recall_due_date <= today + 30 days`
3. Treatment Acceptance — trigger on treatment plan proposal
4. Chair Fill — trigger when appointment cancelled (open slot detected)
5. Review Generation — trigger 24h after appointment completed
6. Referral Engine — trigger on referral source field populated

**Verify Attribution:**
```
GET /api/dental/attribution?workflowId=recall_due&start=2026-06-01&end=2026-06-30
→ verify totalAttributedRevenue > 0 after first recall bookings
→ verify breakdown.recallRecovery > 0
```

**Check Revenue Summary:**
```
GET /api/dental/revenue-summary
→ verify 7 buckets returned
→ verify appointmentsAttributed > 0
```

**Executive Dashboard Revenue Panels:**
- `dental-intelligence-panel.tsx` — shows recall conversion rate
- `executive-kpi-grid.tsx` — shows revenue attributed to date

---

### Week 4: Executive Dashboard Live

**Objective:** All dashboards operational, ALICE insights active.

**Executive Dashboard Activation:**
- Access `/mission-control` — requires org_admin role
- Verify `getMissionControlState(orgId)` returns without error
- All 21 data sources loading (check Network tab for parallel requests)

**ALICE Activation:**
- Verify `ANTHROPIC_API_KEY` set
- Call `generateRevenueAnalysis(orgId, { start, end })` — verify non-empty `topOpportunities`
- Call `generateExecutiveSummary(orgId, "daily")` — verify non-empty `headline`
- ALICE copilot panel shows in Executive Dashboard

**Daily Operations:**
- Review ALICE daily summary each morning
- Monitor `sla-breach-panel.tsx` — address breaches within SLA window
- Check `dead-letter-explorer.tsx` — resolve dead letters via replay console
- Review `recall-recovery` metrics — target 40% booking rate

---

## 60-Day Optimization Plan

### Weeks 5–6: Attribution Analysis

- Export `workflow_revenue_attribution` view to spreadsheet
- Identify top-performing workflow (highest `revenue_recovered`)
- Identify lowest `recall_booked` rate (drop-off analysis)
- Tune `slaMinutes` for slow workflows in registry
- Adjust `followUpDays` in treatment acceptance (default 7 — test 3, 5, 10)

### Weeks 7–8: Multi-Location (if applicable)

- Provision additional `organizations` for new locations
- Each location gets own `organization_id` — full RLS isolation
- Cross-location analytics via `getOrganizationRevenueSummary()` per org

### ALICE Weekly Briefings

- Schedule `generateExecutiveSummary(orgId, "weekly")` every Monday
- Review `topOpportunities` — assign to specific team members
- Track `riskAreas` — create action items from recommendations
- Compare `workflowHealthScore` week-over-week

---

## 90-Day Revenue Growth Plan

### Full Recall Recovery Analysis (Day 61–75)

- Query `recall_recovery_events` for last 90 days
- Segment by `recall_type` (6-month, annual, perio)
- Identify patient segments with lowest response rate
- Adjust `outreach_channel` (email vs SMS vs both) per segment
- Target: >50% recall appointment booking rate

### Treatment Acceptance Campaign (Day 76–83)

- Query `revenue_recovery_events` where `recovery_type = "treatment_acceptance"`
- Identify high-value pending treatment plans (`estimatedValue > $2,000`)
- Reduce `followUpDays` to 3 for high-value cases
- Track `acceptanceRate` improvement from `getTreatmentAcceptanceMetrics()`

### Referral Engine Activation (Day 84–90)

- Audit `revenue_recovery_events` where `recovery_type = "referral"`
- Set up referral source tracking in PMS for all new patients
- Target: `conversionRate > 0.3` from `getReferralMetrics()`
- Recognize top referral patients in `advocate` lifecycle state

---

## Implementation Checklist

- [ ] Supabase project created and configured
- [ ] All migrations run (040 through 202606010002)
- [ ] `ANTHROPIC_API_KEY` set to valid key
- [ ] `AI_PROVIDER=anthropic` in environment
- [ ] PMS adapter selected and `testConnection()` passing
- [ ] First user bootstrapped via `/signup`
- [ ] Organization provisioned (`provisionOrganization()` completed)
- [ ] Default 5 workflows installed and visible in Executive Dashboard
- [ ] No-show prevention tested with sample appointment
- [ ] Recall recovery tested with sample patient
- [ ] Revenue attribution returning non-zero values
- [ ] Executive Dashboard `/mission-control` accessible
- [ ] ALICE revenue analysis returning `topOpportunities`
- [ ] ALICE daily summary scheduled
- [ ] No dead letters in `dead-letter-explorer.tsx`
- [ ] No SLA breaches in `sla-breach-panel.tsx`
- [ ] All 6 revenue engines active
- [ ] Team members onboarded with appropriate roles

# Customer Implementation Playbook

Date: 2026-06-01

## 30-Day Plan

- Complete practice signup and admin user creation.
- Connect PMS and verify sync health.
- Capture baseline metrics.
- Install six revenue playbooks.
- Activate ALICE Daily Summary and Executive Dashboard monitoring.
- Run first weekly executive report.

## 60-Day Plan

- Review playbook health weekly.
- Tune no-show, recall, and chair fill triggers against baseline.
- Validate recovered, generated, and protected revenue attribution.
- Review AI Revenue Intelligence recommendations with practice leadership.
- Publish monthly executive report.

## 90-Day Plan

- Compare production, collections, recall, reviews, referrals, and chair utilization against baseline.
- Certify workflow health and revenue attribution.
- Confirm customer success score trend.
- Deliver quarterly executive report.
- Decide expansion, renewal, or remediation plan.

## Implementation Checklist

- Practice signup completed
- Organization created
- Admin user created
- PMS connected
- Baseline captured
- Six playbooks installed
- ALICE advisor verified
- Executive Dashboard monitoring active
- ROI formulas validated
- Executive reporting cadence scheduled

## Go-Live Checklist

- PMS health score acceptable
- Playbook workflows active
- Attribution rules configured
- Monitoring active
- ALICE daily and weekly summaries available
- Executive Dashboard projection healthy
- Customer success owner assigned
- First executive report generated

## Success Criteria

- Baseline is stored before activation.
- All six playbooks are installed.
- Revenue attribution can answer by playbook, workflow, and patient journey.
- ALICE produces actionable practice recommendations.
- Executive Dashboard reflects workflow health and revenue attribution.
- ROI can be measured using pilot formulas.



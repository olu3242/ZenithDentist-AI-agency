# Role Matrix
## Zenith AI Dental Platform — Roles, Responsibilities, and Access v1.0

**Owner:** Founder  
**Review Cadence:** Quarterly  
**Last Updated:** 2026-05-30

---

## Overview

Zenith operates with 8 defined roles. Each role has a specific scope, system access level, escalation path, and measurable KPIs. This document is the authoritative reference for what each person does, what they can access, and how success is measured.

---

## Role 1: Founder

### Responsibilities
- Sets company strategy, pricing, and product roadmap
- Approves all discounts > 10%, non-standard contract terms, and plan tier pricing changes
- Signs off on all P0 incident post-mortems and AI model retraining decisions
- Reviews and approves tenant deprovisioning requests
- Serves as final escalation point for Critical (score < 40) customer accounts
- Approves all infrastructure changes (new environment variables, provider connections, schema changes)
- Reviews monthly operations report from Platform Admin and AI Operations Manager
- Responsible for HIPAA compliance posture and any legal/regulatory decisions

### System Access
- Full access to all internal dashboards: Mission Control, GTM Command Center, Lead Operations, Client Operations
- Full Supabase access (service key) — reads and writes all tables
- Stripe dashboard: full admin access
- Resend dashboard: full admin access
- GitHub/code repository: owner access
- All environment variables and secrets

### Escalation Paths
- Final escalation — no upward path
- External: legal counsel (data breach, HIPAA violation), Supabase support (P0 database issues)

### KPIs
- Monthly Recurring Revenue (MRR) growth: target > 15% MoM at early stage
- Gross Revenue Retention: > 90% annually
- Platform uptime (P0 incident free months): target 11/12 months per year
- Net Promoter Score from practice admins: target > 50
- Time-to-hire for each open role: < 60 days

### Success Criteria
The Founder has succeeded when: (1) Zenith operates for 30 days without requiring Founder involvement in daily operations, (2) MRR exceeds a sustainable level to fund team growth, and (3) all 8 roles are filled and operating per this matrix.

---

## Role 2: Platform Admin

### Responsibilities
- Maintains production infrastructure: Supabase, Vercel/hosting, environment variables
- Provisions new tenants in Supabase after Implementation Manager requests
- Enables and monitors external integrations at the platform level (Twilio, Google Business)
- Performs monthly cross-tenant isolation verification tests
- Reviews and applies schema migrations; verifies no data leak after each migration
- Manages `INTERNAL_ACCESS_TOKEN`, `PORTAL_ACCESS_TOKEN`, and `ADMIN_ACCESS_TOKEN` secrets
- Monitors Mission Control daily; responds to P1/P2 infrastructure incidents per Incident Response Playbook
- Maintains external uptime monitoring (when implemented)
- Performs quarterly infrastructure security review

### System Access
- Full Supabase access (service key and dashboard)
- Vercel/hosting platform: admin access
- Mission Control: full access (`/mission-control`, all `/api/mission-control/*` routes)
- All API routes (via `INTERNAL_ACCESS_TOKEN`)
- GitHub: push access to main branch (with review requirements)
- Environment variable management: all variables
- No Stripe admin access (payment processing is Founder-only)

### Escalation Paths
- P0 infrastructure issues → Founder (immediate)
- Cross-tenant isolation breach → Founder (immediate)
- Schema migration risk → Founder approval required before applying

### KPIs
- Platform uptime: > 99.5% monthly
- Mean time to detect (MTTD) for P1 incidents: < 30 minutes
- Mean time to resolve (MTTR) for P1 incidents: < 8 hours
- Cross-tenant isolation verification: 100% pass rate monthly
- Environment variable rotation: completed per security schedule

### Success Criteria
Platform Admin succeeds when the platform runs reliably at scale without Founder involvement in infrastructure decisions, and when all isolation guarantees are verifiably maintained.

---

## Role 3: Implementation Manager

### Responsibilities
- Owns the technical onboarding of new dental practices from kickoff through go-live
- Executes the Implementation Playbook for each new tenant
- Configures OpenDental integration, verifies sync, and activates required workflows
- Conducts admin training and self-guided portal tour sessions
- Signs off on go-live checklist alongside Customer Success Manager
- Handles technical blockers during onboarding (escalates to Platform Admin if infra-level)
- Re-engages with at-risk accounts when the CSM identifies technical root causes
- Documents all implementation decisions in `tenant_onboarding_runs.setup_payload`

### System Access
- Mission Control: read access (implementation health monitoring)
- Supabase: read and write to `tenant_onboarding_runs`, `extension_configurations`, `organization_members`
- OpenDental API testing: via `/api/opendental/sync`
- Internal API access via `INTERNAL_ACCESS_TOKEN` for implementation verification tests
- No production data deletion access

### Escalation Paths
- Infrastructure blockers → Platform Admin
- Customer conflict or relationship issue → Customer Success Manager
- Blocker unresolved > 48 hours → Founder awareness

### KPIs
- Average days to go-live: target ≤ 14 days
- Go-live checklist completion rate: 100% (no tenant goes live with required items incomplete)
- First-sync success rate: > 95% (OpenDental sync succeeds on first attempt)
- Customer satisfaction at go-live (CSM-reported): ≥ 4/5
- Re-engagement resolution rate for at-risk technical issues: ≥ 80% within 2 weeks

### Success Criteria
Implementation Manager succeeds when practices reach go-live in ≤ 14 days with all required checklist items complete and a health score ≥ 70 at Day 1.

---

## Role 4: Customer Success Manager (CSM)

### Responsibilities
- Owns account health, retention, and expansion for a named book of accounts (target: 20–30 accounts)
- Runs weekly health check process for all accounts using `computeCustomerHealth()` and `assessCustomerRisk()`
- Executes escalation procedures for Monitor, At Risk, and Critical accounts per Customer Success Playbook
- Drives renewal conversations starting 90 days before contract end
- Conducts Quarterly Business Reviews (QBRs) for all Growth and Enterprise accounts
- Identifies expansion opportunities using `getExpansionOpportunities()` and presents upsell proposals
- Coordinates with Implementation Manager for technical issues affecting account health
- Conducts exit interviews for churned accounts and logs loss reasons in CRM

### System Access
- Customer portal: admin-level view of assigned tenant accounts
- Mission Control: read access to per-tenant health and workflow data
- Workflow analytics: `getTenantWorkflowAnalytics()` outputs for assigned accounts
- ALICE insights: `/api/alice/insights` for assigned accounts
- CRM: full access to assigned account records
- No Supabase admin access; no production data modification

### Escalation Paths
- Critical accounts (score < 40) → Founder within 24 hours
- Technical root causes → Implementation Manager
- Renewal requiring > 10% discount → Revenue Operations Manager → Founder
- Churn request → Revenue Operations Manager + Founder awareness

### KPIs
- Net Revenue Retention: > 110% (accounts grow in total MRR over time)
- Gross Renewal Rate: > 90% (fewer than 10% of accounts churn)
- Average account health score: > 75 across book of business
- Time-to-intervention for At Risk accounts: < 48 hours from signal
- QBR completion rate: 100% for Growth/Enterprise accounts

### Success Criteria
CSM succeeds when their book of business maintains > 90% gross retention, average health score > 75, and expansion revenue equals or exceeds churn MRR.

---

## Role 5: Revenue Operations Manager

### Responsibilities
- Manages the full lead-to-close pipeline: lead qualification, demo delivery, proposal generation, contract close
- Maintains pipeline CRM with accurate stage, expected close date, and deal value for all opportunities
- Delivers weekly and monthly revenue forecasts to Founder
- Owns the Closed-Won handoff package and ensures CSM receives it within 24 hours of signature
- Conducts quarterly win/loss analysis and presents findings to Founder
- Maintains the canonical pricing document and enforces pricing governance (escalates discounts > 10% to Founder)
- Partners with Founder to update qualification criteria and sales approach quarterly
- Tracks lead source quality and conversion rates to optimize top-of-funnel

### System Access
- GTM Command Center: full access (`/gtm-command-center`)
- Lead Operations dashboard: full access (`/lead-operations`)
- CRM: full access to all opportunity records
- ROI audit data: access to prospect audit outputs for demo preparation
- Calendly admin: manages booking links and availability
- No Supabase admin access

### Escalation Paths
- Contract terms outside standard → Founder approval
- Discount > 10% → Founder approval
- Technical questions during sales that exceed knowledge → Implementation Manager
- Prospect requests a feature that doesn't exist → Founder (product decision)

### KPIs
- Lead-to-demo conversion: > 40%
- Demo-to-close rate: > 25%
- Average sales cycle: < 21 days
- Pipeline forecast accuracy: within 15% of actual monthly close
- Handoff quality score (CSM-rated): ≥ 4/5

### Success Criteria
Revenue Operations Manager succeeds when the pipeline is predictable, forecasts are accurate, and new MRR per month consistently grows quarter-over-quarter.

---

## Role 6: Support Specialist

### Responsibilities
- Responds to P3 and P2 inbound support requests from practice admins within SLA
- Triages all inbound issues: determines severity, escalates P1/P0 to Platform Admin or AI Operations Manager
- Maintains FAQ and knowledge base for common practice admin questions
- Handles password resets, user access issues, and basic portal navigation questions
- Monitors the support inbox daily and ensures no ticket ages more than 24 hours without a response
- Conducts quality review of common support issues monthly and recommends self-service improvements
- Supports CSM with technical explanation of platform behavior for accounts under review

### System Access
- Customer portal: read-only view for all tenant accounts (support context only)
- CRM: read access to customer records; write access to support ticket fields
- Mission Control: read access (enough to verify basic platform health when supporting customers)
- No Supabase admin access; no production data modification
- No access to ALICE governance or workflow activation

### Escalation Paths
- P2 issues unresolved in 8 business hours → Platform Admin
- P1/P0 issues → Platform Admin immediately (do not attempt to resolve independently)
- Customer escalation or hostility → Customer Success Manager

### KPIs
- First response time (P3): < 8 business hours
- First response time (P2): < 2 hours
- Resolution time (P3): < 72 hours
- Customer satisfaction score on resolved tickets: ≥ 4/5
- Ticket escalation rate: < 20% (most P3 tickets resolved without escalation)

### Success Criteria
Support Specialist succeeds when P3/P2 issues are resolved within SLA with high customer satisfaction, and the escalation rate to Platform Admin remains below 20%.

---

## Role 7: AI Operations Manager

### Responsibilities
- Monitors the ALICE approval queue daily and processes interventions within SLA (P1 < 1 hour, P2 < 4 hours)
- Reviews acceptance rate and trust score weekly; investigates degradation below 70% acceptance or < 75 trust score
- Manages the agent learning feedback loop: ensures operator approvals/rejections are logged with context-rich notes
- Determines when model retraining is warranted using the criteria in the AI Governance Playbook
- Conducts monthly agent learning output review and quarterly full AI governance audit
- Responds to AI failure incidents per the AI Governance Playbook
- Maintains `aliceGroundingSurfaces` accuracy as new workflows and data domains are added
- Presents monthly AI operations report to Founder

### System Access
- ALICE AI interfaces: full access (`/api/alice/*`)
- Mission Control: full access, with emphasis on `aiHealth` and `governanceTrustScore` panels
- Autonomous operations API: full access (`/api/autonomous/*`)
- Governance state: full access (`/api/mission-control/governance`)
- `runtime_governance_decisions` and `runtime_audit_timeline`: read access
- No Supabase admin (write) access — reads via API; writes only via approved governance actions
- GitHub: read access for reviewing AI-related code changes

### Escalation Paths
- Trust score < 60 → Founder within 2 hours
- AI failure with patient impact → Founder immediately
- Model retraining decision → Founder approval required
- Systemic workflow failure caused by AI → Platform Admin + Founder

### KPIs
- ALICE approval queue processing: 100% within SLA (P1 < 1 hr, P2 < 4 hr, P3 < 24 hr)
- Acceptance rate trend: maintained 70–85%
- Trust score: maintained ≥ 75
- AI-caused incidents: zero P0 incidents per quarter
- Retraining decisions documented and justified: 100% of triggers addressed

### Success Criteria
AI Operations Manager succeeds when ALICE operates with a sustained trust score ≥ 75, acceptance rate 70–85%, and zero AI-caused P0 incidents per quarter.

---

## Role 8: Tenant Admin (Customer Role)

*Note: This role is held by the dental practice's own staff, not Zenith employees. It is documented here to define what Zenith's system grants them.*

### Responsibilities
- Manages the practice's Zenith portal configuration (settings, locations, user invitations)
- Reviews and acts on ALICE recommendations surfaced in the practice portal
- Monitors workflow activity and performance via the practice-facing dashboard
- Contacts Zenith support for technical issues via the support channel
- Completes the onboarding portal tour and training sessions
- Invites and manages practice staff users (staff and viewer roles)

### System Access
- Practice portal: full access to their own organization's data only
- Tenant-scoped dashboard: workflow status, health scores, ROI reports, ALICE insights
- User management: invite, manage roles, remove users within their organization
- Integration settings: view active integrations; submit configuration change requests to Zenith Implementation Manager
- No access to: Mission Control, any other tenant's data, Zenith internal APIs, governance tools

### Escalation Paths
- Technical issues → Zenith Support Specialist (support inbox)
- Billing questions → Customer Success Manager
- Feature requests → Customer Success Manager (surfaces to Founder/Revenue Operations)

### KPIs (measured by Zenith, shared in QBRs)
- Portal active sessions per month (engagement signal)
- ALICE recommendations acted on vs. ignored ratio
- Workflow adoption rate (% of provisioned workflows actively running)
- Health score trend over time

### Success Criteria
A Tenant Admin is successful when their practice has a health score ≥ 80, workflow adoption rate ≥ 70%, and they are actively engaging with ALICE recommendations at least monthly.

---

## Role Access Summary Matrix

| System / Resource | Founder | Platform Admin | Impl. Mgr | CSM | RevOps | Support | AI Ops Mgr | Tenant Admin |
|---|---|---|---|---|---|---|---|---|
| Mission Control | Full | Full | Read | Read | — | Read | Full | — |
| Supabase (admin) | Full | Full | Scoped write | — | — | — | Read (API) | — |
| ALICE API | Full | — | — | Read | — | — | Full | — |
| Governance API | Full | Full | — | — | — | — | Full | — |
| GTM Command Center | Full | — | — | — | Full | — | — | — |
| CRM | Full | — | Read | Full | Full | Scoped | — | — |
| Stripe | Full | — | — | — | — | — | — | — |
| Tenant Portal | Full | Full | Full | Full | Read | Read | Read | Own org only |
| GitHub/Code | Full | Push | Read | — | — | — | Read | — |

# Business Continuity Report
## Zenith AI Dental Platform — Founder Unavailability Simulation v1.0

**Prepared By:** Founder / Platform Admin  
**Date:** 2026-05-30  
**Purpose:** Assess which operations continue automatically, which stall without the Founder, and define mitigation plans for each gap across 30/60/90-day unavailability scenarios.

---

## Assessment Framework

For each scenario, we assess:
1. **Continues automatically** — platform code or documented procedures allow the operation without Founder involvement
2. **Continues with delegation** — another role can handle it if empowered to do so
3. **Stalls** — requires Founder action, judgment, or credentials that cannot be delegated

Current team state: All 8 roles defined in the Role Matrix but **not all roles are currently filled by dedicated individuals**. At current stage, the Founder is likely covering Platform Admin, AI Operations Manager, and Revenue Operations functions personally. This report assumes the roles exist and are filled as documented — where they are not, the gap is more severe.

---

## Scenario 1: Founder Unavailable for 30 Days

### Operations That Continue

**Platform Automation (fully automated):**
- All active Zenith workflows execute automatically via the Workflow OS: `recall_due`, `appointment_no_show`, `review_request_due`, `lead_created`, and others
- ALICE generates insights and recommendations for practice admins continuously
- Resend email delivery fires automatically as workflow events trigger notifications
- Dead letter and retry mechanisms (`retryEnabled: true`, `deadLetterRequired: true` in every blueprint) handle transient failures without human intervention
- Autonomous recovery via `getAutonomousRecoveryState()` — the platform self-heals SLA breaches within configured parameters
- OpenDental sync runs on the configured `sync_interval_minutes` schedule automatically

**Customer-Facing Operations (with delegation):**
- CSM manages account health, weekly health checks, and at-risk interventions per the Customer Success Playbook
- Implementation Manager handles any in-flight onboarding projects
- Support Specialist handles P3 and P2 support tickets
- AI Operations Manager processes the ALICE approval queue

**Evidence of automation depth:**
- `lib/workflow-os/workflow-scheduler.ts` — `dispatchScheduledRun()` dispatches workflows on schedule without human trigger
- `lib/runtime/autonomous-recovery.ts` — self-healing is automated
- `lib/ai-os/agent-governance.ts` — `canAutoApprove()` allows low-risk interventions without human input when trust score ≥ 75
- Resend is live and triggered by workflow events — no human needed to send recall emails

### Operations That Stall

| Operation | Why It Stalls | Frequency of Need |
|---|---|---|
| New tenant provisioning | No self-service org creation flow; requires SQL + `bootstrapTenant()` execution | Per new customer |
| Large discount approvals (> 10%) | Revenue Operations Playbook requires Founder sign-off | Per negotiation |
| P0 incident escalation | Final authority for P0 resolution and any HIPAA-related decision | Unpredictable |
| AI model retraining decision | AI Governance Playbook requires Founder approval | Monthly (if triggered) |
| Twilio / Google Business enablement | Platform-level infrastructure decision | One-time, blocking Growth tier |
| Contract signing | Revenue Operations Manager cannot execute contracts independently | Per new customer |
| New environment variable / secret rotation | Founder holds all infrastructure credentials | Per security event |

### 30-Day Assessment: MANAGEABLE with preparation

**30-day risk: MEDIUM.** Existing customers continue to be served. New customer acquisition slows or stops without Founder contract sign-off. One P0 incident or cross-tenant isolation breach would be unmanageable without Founder involvement.

### 30-Day Mitigation Plan

| Gap | Mitigation | Owner | Due |
|---|---|---|---|
| New tenant provisioning | Grant Platform Admin authority to execute `bootstrapTenant()` + pre-written SQL runbook | Platform Admin | Before absence |
| Contract signing | Grant Revenue Operations Manager limited signing authority for standard contracts | Founder (legal setup) | Before absence |
| P0 escalation | Designate Platform Admin as acting Founder for P0 incidents with pre-agreed decision criteria | Founder + Platform Admin | Before absence |
| AI model retraining | Defer all non-urgent retraining decisions until Founder returns | AI Operations Manager | Before absence |
| Infrastructure credentials | Document and securely share all credentials with Platform Admin (1Password or equivalent) | Founder | Before absence |

---

## Scenario 2: Founder Unavailable for 60 Days

### Operations That Continue

All automated operations from the 30-day scenario continue. The team can now operate with the Founder absent for 60 days IF:
- Mitigation steps from Scenario 1 have been implemented
- No new Growth/Enterprise features are required (Twilio, Google Business remain disconnected)
- No schema migrations are needed
- No P0 incidents occur

### Additional Operations That Stall by Day 60

| Operation | Why It Stalls | Compounding Risk |
|---|---|---|
| Strategic product decisions | No one else can decide to build new features or change direction | Roadmap freezes |
| Renewal negotiations with complex terms | Revenue Operations Manager can handle standard renewals but not contract restructuring | Revenue leakage |
| New hire onboarding | No authority to extend offers or execute employment agreements | Team capacity cannot grow |
| Stripe subscription model changes | Pricing or plan changes require Founder decision | Revenue Operations frozen |
| Partnership or API agreements (e.g., OpenDental partnership) | Contracts outside standard scope | Integration roadmap stalls |
| AI Operations Manager needs new grounding data sources | Adding new data sources to ALICE requires code changes + Founder approval | ALICE accuracy drifts |

### 60-Day Assessment: STRAINED

**60-day risk: HIGH.** Revenue growth stalls. Product development freezes. Any unexpected technical debt or P0 incident consuming Platform Admin time causes cascading failures across implementation and support. Trust score management becomes difficult without the AI Operations Manager having authority to make retraining decisions.

### 60-Day Mitigation Plan

| Gap | Mitigation | Owner | Due |
|---|---|---|---|
| Strategic product decisions | Create a 60-day product freeze document with pre-approved decisions | Founder | Before absence |
| Complex renewal negotiations | Pre-approve up to 20% discount authority for CSM on renewals | Founder | Before absence |
| New hires | Pre-approve specific hires and delegate offer authority to a designated person | Founder | Before absence |
| AI retraining decisions | Pre-approve AI Operations Manager to make retraining decisions below defined risk thresholds | Founder | Before absence |
| Emergency P0 authority | Expand Platform Admin's decision authority to include any infrastructure change needed for incident resolution | Founder | Before absence |

---

## Scenario 3: Founder Unavailable for 90 Days

### Operations That Continue (assuming all mitigations implemented)

With proper preparation, the following can continue for 90 days:
- All automated workflow execution
- Customer health monitoring and CSM account management
- Standard renewal processing (with pre-approved discount authority)
- P3/P2 support ticket resolution
- ALICE recommendation generation and basic governance
- Monthly financial close (if bookkeeper has access to Stripe and bank)

### Operations That Stall by Day 90

| Operation | Why It Stalls | Business Impact |
|---|---|---|
| Growth tier enablement (Twilio, Google Business) | No one can make infrastructure decisions | Growth tier cannot be sold |
| Investor or partner communications | External stakeholder management requires Founder | Fundraising/partnerships pause |
| HIPAA policy decisions | Any new data use or customer contract requiring HIPAA BAA | Enterprise sales blocked |
| Large enterprise contracts | Enterprise customization and negotiation | Enterprise revenue blocked |
| Platform security review | Quarterly security review requires Founder sign-off | Compliance risk grows |
| Code deployment above defined change threshold | Major features require Founder review | Product development frozen |
| Team conflict resolution | No HR authority | Team cohesion risk |

### 90-Day Assessment: CRITICAL RISK

**90-day risk: CRITICAL.** At 90 days of Founder unavailability without preparation, Zenith faces: frozen product development, inability to close Growth/Enterprise deals, mounting compliance risk, and potential team attrition if leadership vacuum is not addressed.

### 90-Day Mitigation Plan

| Gap | Mitigation | Owner | Due |
|---|---|---|---|
| Business continuity authority | Establish a formal Power of Attorney or designate a Chief of Operations with documented authority | Founder (legal) | Before absence |
| HIPAA policy decisions | Engage a HIPAA compliance consultant pre-emptively | Founder | Before absence |
| Investor communications | Brief key investors/advisors; designate spokesperson | Founder | Before absence |
| Enterprise sales | Freeze enterprise sales pursuit; focus on Starter/Growth with standard terms | Revenue Operations Manager | 30-day mark |
| Platform security review | Engage external security audit firm to conduct quarterly review | Platform Admin | 60-day mark |
| Code deployment | Implement pull request review requirement: 2 approvers for any production deployment | Platform Admin | Before absence |

---

## Cross-Scenario Summary

| Operation | 30 Days | 60 Days | 90 Days |
|---|---|---|---|
| Workflow execution (automated) | Continues | Continues | Continues |
| ALICE recommendations | Continues | Continues | Drift risk |
| Customer health / CSM | Continues | Continues | Continues |
| Standard renewals | Stalls → Mitigable | Stalls → Mitigable | Stalls |
| New tenant provisioning | Stalls → Mitigable | Stalls → Mitigable | Stalls |
| P0 incident response | CRITICAL gap | CRITICAL gap | CRITICAL gap |
| Product roadmap | Stalls → Defer | Frozen | Frozen |
| Growth tier activation | Stalls | Stalls | Blocked |
| Enterprise sales | Slows | Stalls | Blocked |
| New hires | Stalls | Stalls → Mitigable | Blocked |

---

## Immediate Actions Required (Before Any Extended Absence)

Ranked by criticality:

1. **Credential handoff:** All production credentials documented and shared securely with Platform Admin. This alone prevents most P0 scenarios from becoming catastrophic.

2. **P0 authority delegation:** Platform Admin designated as acting decision-maker for incidents, with pre-agreed criteria for when to seek external help (legal, Supabase support, security firm).

3. **Contract signing authority:** Revenue Operations Manager granted authority for standard-tier contracts. Limits defined (max MRR per deal, no custom terms without external review).

4. **Connect Twilio and Google Business:** These are infrastructure decisions that should happen now, not during an absence. Unblocks Growth tier and removes a key stall point.

5. **Build self-service org creation:** Removes the largest human dependency in the new customer flow. Estimated impact: eliminates Founder/Platform Admin involvement in 80% of new tenant provisioning steps.

6. **Hire and train Platform Admin and AI Operations Manager** as distinct roles before any planned absence. Current single-person coverage is the highest operational risk on the platform.

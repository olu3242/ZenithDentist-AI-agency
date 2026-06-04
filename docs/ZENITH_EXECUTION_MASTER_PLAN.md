# Zenith Patient OS™ — Execution Master Plan

**Classification:** Canonical Governance — Execution Authority
**Status:** ACTIVE — Architecture FROZEN, focus shifts to execution
**Owner:** Zenith Platform Governance Board
**Last Updated:** 2026-06-02

---

## Governing Principle

The Zenith Patient OS™ architecture is **frozen**. All 35+ DB tables are created. All 28+ lib modules are implemented. All 20+ API routes are live. All 7 agents are registered and operational. The platform is complete.

The mission now is: **execution, integration, adoption, and revenue validation**.

---

## Phase Summary

| Phase | Name | Status | Gate |
|-------|------|--------|------|
| Phase 1 | Foundation Layer | ✅ COMPLETE | All lib modules implemented |
| Phase 2 | Integration Layer | ✅ COMPLETE | All adapters implemented |
| Phase 3 | AI Agent Layer | ✅ COMPLETE | All 7 agents operational |
| Phase 4 | Intelligence Deepening | 🟡 IN PROGRESS | ALICE outcome reconciliation pending |
| Phase 5 | Live Delivery | 🔴 NEXT | Provider credentials required |

---

## Phase 1 — COMPLETE: Foundation Layer

**Objective:** Build the core platform infrastructure — data models, execution engine, patient intelligence, and revenue engines.

### Deliverables

| Component | Lib Module(s) | Status |
|-----------|--------------|--------|
| Digital Dentist Twin™ | lib/digital-dentist-twin, lib/avatar-studio, lib/voice-studio | ✅ |
| Patient Influence Engine™ | lib/patient-influence, lib/treatment-intelligence, lib/channel-optimization | ✅ |
| Workflow OS™ | lib/workflow-os (10 files) | ✅ |
| Patient Revenue Engine™ | lib/revenue-engine (4 engine files) | ✅ |
| Mission Control™ | app/api/mission-control | ✅ |
| Script Intelligence Engine™ | lib/script-engine | ✅ |
| Journey Library™ | lib/journey-library | ✅ |
| Patient Portal™ | lib/patient-portal | ✅ |
| Event Fabric | lib/event-fabric | ✅ |
| ALICE Foundation | lib/alice/patient-decision-engine | ✅ |

**Phase 1 gate criteria:** All lib modules exist, all DB tables created via migrations, all API routes respond to authenticated requests.
**Gate status:** PASSED ✅

---

## Phase 2 — COMPLETE: Integration Layer

**Objective:** Connect the platform to external systems — PMS, calendar, payments, and communication providers.

### Deliverables

| Integration | Adapter | Status |
|-------------|---------|--------|
| Integration OS™ core | lib/integration-os | ✅ |
| OpenDental PMS normalisation | lib/adapters/opendental-adapter.ts | ✅ |
| Google Calendar adapter | lib/adapters/google-calendar-adapter.ts | ✅ |
| Stripe payment integration | lib/stripe | ✅ |
| Twilio SMS adapter | lib/adapters/sms-adapter.ts | ✅ (adapter built; live credentials pending) |
| Resend Email adapter | lib/adapters/email-adapter.ts | ✅ (adapter built; live credentials pending) |
| HeyGen video adapter | lib/adapters/heygen-adapter.ts | ✅ (adapter built; live credentials pending) |
| ElevenLabs voice adapter | lib/adapters/elevenlabs-adapter.ts | ✅ (adapter built; live credentials pending) |
| n8n dependency reduction | — | ✅ n8n dependency score: 4/100 (external connectors only) |

**Phase 2 gate criteria:** All adapters implemented and passing unit tests; integration registry populated.
**Gate status:** PASSED ✅
**Note:** Adapters are fully implemented. Live credentials are a Phase 5 prerequisite, not a Phase 2 blocker.

---

## Phase 3 — COMPLETE: AI Agent Layer

**Objective:** Deploy all seven specialised AI agents capable of receiving ALICE recommendations and executing them through Workflow OS.

### Deliverables

| Agent | File | Capabilities | Status |
|-------|------|-------------|--------|
| Treatment Coordinator Agent | lib/agents/treatment-coordinator-agent.ts | Treatment plan follow-up, acceptance optimisation | ✅ |
| Recall Agent | lib/agents/recall-agent.ts | Overdue patient identification, re-engagement campaign execution | ✅ |
| Review Agent | lib/agents/review-agent.ts | Post-visit review requests, reputation monitoring | ✅ |
| Membership Agent | lib/agents/membership-agent.ts | Membership enrollment campaigns, renewal management | ✅ |
| Referral Agent | lib/agents/referral-agent.ts | Referral ask campaigns, referral attribution | ✅ |
| Growth Agent | lib/agents/growth-agent.ts | Growth score monitoring, dimension-specific campaigns | ✅ |
| Compliance Agent | lib/agents/compliance-agent.ts | HIPAA compliance monitoring, consent verification | ✅ |

**Phase 3 gate criteria:** All 7 agents registered in `agent_registry`, capable of receiving tasks via `agent_tasks`, and executing through Workflow OS.
**Gate status:** PASSED ✅

---

## Phase 4 — IN PROGRESS: Intelligence Deepening

**Objective:** Deepen ALICE's intelligence layer with practice-level memory, cross-patient learning, predictive models, and growth intelligence.

### Deliverables

| Component | Status | Notes |
|-----------|--------|-------|
| Practice Memory Graph™ | ✅ Foundation complete | lib/practice-memory — core memory recording operational |
| Advanced ALICE | ✅ Foundational operational | lib/ai-os, lib/alice — patient decisions live; cross-practice learning pending |
| Treatment Acceptance Prediction | ✅ Operational | Influence score + intent model running |
| Revenue Forecasting | 🟡 PARTIAL | Forecast model in practice_intelligence_snapshots; reconciliation with actuals pending |
| Growth Intelligence | ✅ Operational | lib/practice-intelligence, lib/growth-score — 7-dimension score live |
| Benchmark Intelligence | 🔴 PLANNED | Cross-practice benchmarks require multi-client data |
| ALICE Outcome Reconciliation | 🔴 PENDING | Link alice_patient_decisions → actual revenue outcomes |

**Phase 4 gate criteria:** ALICE outcome reconciliation live, revenue forecast validated against actuals, benchmark module in development.
**Gate status:** IN PROGRESS 🟡

---

## Phase 5 — NEXT: Live Delivery

**Objective:** Take the fully-built platform live with real provider credentials, live patient delivery, and the first pilot client.

### Critical Path

```
1. Configure provider credentials (Twilio, Resend, HeyGen)
      ↓
2. End-to-end journey test (1 patient, welcome_patient journey, verify delivery)
      ↓
3. First pilot client onboarding (≤ 2 clients in supervised pilot)
      ↓
4. Revenue attribution validation (confirm Zenith-influenced revenue records)
      ↓
5. Scale to 5 clients
```

### Phase 5 Prerequisites — Environment Variables Required

| Variable | Purpose | Provider | Criticality |
|----------|---------|---------|------------|
| `SMS_PROVIDER` | Activate SMS delivery | Set to `twilio` | HIGH |
| `TWILIO_AUTH_TOKEN` | Twilio authentication | Twilio | HIGH |
| `TWILIO_PHONE` | Sender phone number | Twilio | HIGH |
| `EMAIL_PROVIDER` | Activate email delivery | Set to `resend` | HIGH |
| `RESEND_API_KEY` | Resend authentication | Resend | HIGH |
| `HEYGEN_API_KEY` | Avatar video rendering | HeyGen | MEDIUM |
| `TAVUS_API_KEY` | Alternative video provider | Tavus | MEDIUM (if HeyGen not used) |
| `ELEVENLABS_API_KEY` | Voice cloning | ElevenLabs | MEDIUM |
| `NEXT_PUBLIC_SUPABASE_URL` | Database connection | Supabase | CRITICAL (already required) |
| `SUPABASE_SERVICE_ROLE_KEY` | Database service access | Supabase | CRITICAL (already required) |
| `N8N_WEBHOOK_BASE_URL` | External webhook triggers (n8n) | n8n | LOW (4/100 dependency) |

### Phase 5 Delivery Checklist

```
Pre-Launch:
  [ ] Twilio credentials configured and verified
  [ ] Resend credentials configured and verified
  [ ] At least one video provider configured (HeyGen or Tavus)
  [ ] OpenDental PMS connection tested with real practice data
  [ ] Supabase RLS policies verified (tenant isolation confirmed)
  [ ] HIPAA BAAs signed with all communication providers

Go-Live:
  [ ] First patient assigned to welcome_patient journey
  [ ] Journey delivery confirmed (SMS + email delivered)
  [ ] ALICE recommendations generated for test patient
  [ ] Revenue attribution record created after test booking
  [ ] Growth Score computed for test practice
  [ ] Command Center panels displaying real data
  [ ] Mission Control showing live workflow executions

Post-Launch (30 days):
  [ ] Journey scheduler wired (delay_days → execution-scheduler.ts)
  [ ] ALICE outcome reconciliation live
  [ ] Revenue attribution validated with real patient data
  [ ] First revenue report generated
  [ ] Platform Certification re-run (target: 90+/100)
```

---

## Execution Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Provider credential delays (Twilio/Resend) | LOW | HIGH | Pre-provision accounts; use sandbox first |
| OpenDental PMS API variability | MEDIUM | HIGH | Test with real practice data in staging environment |
| ALICE fallback rate > 20% on live data | MEDIUM | MEDIUM | Pre-seed practice memory with historical data |
| Journey scheduler timing drift | LOW | MEDIUM | Add monitoring on execution-scheduler.ts |
| HIPAA BAA procurement delays | MEDIUM | HIGH | Begin BAA process in parallel with Phase 5 build |
| First client expectations mismatch | LOW | HIGH | Define pilot success criteria before onboarding |

---

## Architecture Freeze Policy

As of 2026-06-02, the Zenith Patient OS™ architecture is **frozen**. This means:

1. No new DB tables may be created without a formal Architecture Change Request (ACR)
2. No new lib modules may be created without an ACR
3. No existing API contracts may be broken without a versioned migration plan
4. All changes to frozen components require two-reviewer approval
5. The Platform Certification score must be re-run after any ACR is approved and implemented

**Exception process:** Submit an ACR to the Platform Governance Board. ACRs are reviewed weekly.

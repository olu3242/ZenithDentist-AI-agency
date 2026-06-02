# Zenith Patient OS™ — Platform Dependency Map

**Classification:** Canonical Platform Reference
**Status:** FROZEN — reflects architecture as of 2026-06-02
**Owner:** Zenith Platform Governance Board
**Last Updated:** 2026-06-02

---

## Section 1: Component Dependency Graph

The following shows how data and control flow through the platform from external system ingestion to revenue attribution.

```
External PMS (OpenDental)
        │
        ▼
Integration OS ──────────────────────────────────────────────────────┐
  lib/integration-os                                                  │
  lib/adapters/opendental-adapter.ts                                  │
        │                                                             │
        ▼                                                             │
Event Fabric (immutable dual-write)                                   │
  lib/event-fabric                                                    │
  ─────────────────────────────────────────────────────────────────  │
        │                    │                    │                   │
        ▼                    ▼                    ▼                   │
Patient Influence     Practice Memory       Workflow OS               │
Engine™               Graph™                (canonical executor)      │
lib/patient-influence lib/practice-memory   lib/workflow-os           │
lib/treatment-intel   lib/practice-intel          │                   │
lib/channel-optim          │                      ▼                   │
        │                  │              AI Agent OS™               │
        │                  │              lib/agents (7 agents)      │
        ▼                  │                      │                   │
ALICE™  ◄──────────────────┘                      │                   │
lib/alice/patient-decision-engine                 │                   │
lib/ai-os                                         │                   │
        │                                         │                   │
        ▼                                         ▼                   │
Script Intelligence Engine™          Communication Hub                │
lib/script-engine                    lib/communication-hub            │
        │                                         │                   │
        ▼                                         ▼                   │
Digital Dentist Twin™           SMS / Email / Video delivery          │
lib/digital-dentist-twin        (Twilio / Resend / HeyGen)            │
lib/avatar-studio                                 │                   │
lib/voice-studio                                  ▼                   │
        │                                     Patient                 │
        │                                         │                   │
        │                                         ▼                   │
        └────────────────────────────► Revenue Attribution Engine     │
                                        lib/revenue-attribution       │
                                        lib/revenue-engine            │
                                                  │                   │
                                                  ▼                   │
                                        Practice Memory Graph ◄───────┘
                                        (outcome learning)
                                                  │
                                                  ▼
                                        Growth Score Engine
                                        lib/growth-score
                                                  │
                                                  ▼
                                        Command Center™
                                        (Mission Control + 6 panels)
```

### Key Dependency Rules

1. **Integration OS is the only permitted inbound boundary** — No component queries external systems directly.
2. **Workflow OS is the only executor** — No component delivers communications or executes actions outside Workflow OS.
3. **ALICE never executes** — ALICE generates recommendations; agents and Workflow OS execute.
4. **Event Fabric is the audit backbone** — Every significant state change emits an immutable event.
5. **Revenue Attribution is the outcome signal** — Outcomes flow back to Practice Memory so ALICE learns.

---

## Section 2: Data Dependency Table

For each major table: what feeds it and what reads it.

| Table | Fed By | Read By |
|-------|--------|--------|
| `patient_profiles` | Integration OS (PMS sync), patient registration | ALICE, Patient Influence Engine, all engines, Command Center |
| `patient_influence_scores` | Patient Influence Engine (computed) | ALICE, Treatment Coordinator Agent, Channel Optimization, Command Center |
| `alice_patient_decisions` | ALICE (generated) | AI Agent OS, Command Center, Revenue Attribution (outcome matching) |
| `journey_enrollments` | Journey Library, Workflow OS | Workflow OS (step execution), Revenue Attribution |
| `workflow_executions` | Workflow OS (runtime) | Command Center, Revenue Attribution, ALICE (outcome learning) |
| `communication_events` | Communication Hub (delivery) | Command Center, Revenue Attribution, Growth Score |
| `revenue_attribution_records` | Revenue Attribution Engine | Command Center, ALICE, Practice Memory |
| `treatment_plans` | Integration OS (PMS sync) | Treatment Intelligence, ALICE, Revenue Attribution |
| `agent_registry` | Platform setup (static) | AI Agent OS, Command Center |
| `agent_tasks` | ALICE (recommendation → task), agents (self-task) | Agent runner (Workflow OS) |
| `agent_executions` | Agent runner | Command Center, agent_metrics |
| `agent_recommendations` | Agents (post-execution) | ALICE, Command Center |
| `practice_memory_records` | Practice Memory Graph (ALICE writes) | ALICE (reads for context), Practice Intelligence |
| `script_templates` | Script Engine + admin setup | Script Engine (render), Communication Hub |
| `integration_registry` | Platform setup / POST /api/integrations | Integration OS, Command Center |
| `integration_health` | Integration OS (health checks) | Command Center, alert system |
| `avatar_profiles` | Avatar Studio | Digital Dentist Twin, Journey Library |
| `voice_profiles` | Voice Studio | Digital Dentist Twin, Script Engine |
| `membership_plans` | Practice setup | Membership Engine |
| `membership_tracking` | Membership Engine | Revenue Attribution, Growth Score, Command Center |
| `recall_tracking` | Recall Engine | Recall Agent, Revenue Attribution, Growth Score |
| `referral_tracking` | Referral Engine | Referral Agent, Revenue Attribution, Growth Score |
| `reputation_events` | Reputation Engine (review tracking) | Review Agent, Growth Score |
| `growth_scores` | Growth Score Engine (computed daily) | Command Center, ALICE, Practice Intelligence |
| `practice_intelligence_snapshots` | Practice Intelligence Engine (daily) | ALICE, Command Center |
| `new_patient_leads` | Integration OS (lead sources), API | Referral Engine, Growth Score |
| `consent_records` | Patient registration, patient portal | Compliance Agent, HIPAA audit |
| `billing_customers` | Stripe integration | Billing, subscription management |

---

## Section 3: Event Dependency Table

Which events trigger which workflows and agents.

| Event | Triggered By | Triggers Workflow / Agent | Effect |
|-------|-------------|--------------------------|--------|
| `patient.created` | Patient registration, PMS sync | `welcome_patient` journey | New patient onboarding begins |
| `patient.influence.scored` | Daily influence computation | ALICE analysis | ALICE generates recommendations |
| `patient.intent.changed` | Influence Engine (high → low) | Treatment Coordinator Agent | Follow-up sequence initiated |
| `patient.churn.risk.flagged` | ALICE | Recall Agent | Re-engagement campaign triggered |
| `treatment.plan.presented` | PMS sync | `treatment_followup` journey | Acceptance campaign begins |
| `recall.triggered` | Recall Engine (overdue detection) | `recall_campaign` journey | Recall sequence begins |
| `membership.enrolled` | Membership Engine | `membership_enrollment` journey | Welcome sequence begins |
| `referral.trigger` | ALICE recommendation | `referral_campaign` journey | Referral ask sequence begins |
| `appointment.completed` | PMS sync | `review_campaign` journey | Post-visit review request |
| `lead.created` | Lead sources, Integration OS | `new_patient_acquisition` journey | Lead nurture begins |
| `workflow.execution.completed` | Workflow OS | Revenue Attribution Engine | Revenue record potentially created |
| `alice.recommendation.created` | ALICE | Relevant agent (via agent_tasks) | Agent task queued |
| `integration.health.changed` | Integration OS | Alert system | Command Center notified |
| `growth.score.computed` | Growth Score Engine | ALICE analysis | Practice-level recommendations refreshed |
| `avatar.video.rendered` | Avatar Studio | Communication Hub | Video delivered to patient |

---

## Section 4: Critical Path Analysis

Components that MUST be operational before downstream components can function.

### Tier 0 — Platform Foundation (must be first)
```
Supabase (database) → everything depends on this
Event Fabric → all state changes depend on this
Workflow OS → all execution depends on this
```

### Tier 1 — Data Ingestion (must precede intelligence)
```
Integration OS → Patient Influence Engine (needs patient_profiles)
Integration OS → Treatment Intelligence (needs treatment_plans)
Patient Influence Engine → ALICE (needs influence scores to reason)
```

### Tier 2 — Intelligence Layer (must precede agent actions)
```
ALICE → AI Agent OS (agents need ALICE decisions to action)
Script Engine → Communication Hub (messages need scripts)
Journey Library → Workflow OS (workflows need journey definitions)
```

### Tier 3 — Delivery Layer (must precede patient-facing outcomes)
```
Communication Hub → Patient (needs delivery credentials)
Digital Dentist Twin → Video delivery (needs HeyGen/Tavus credentials)
```

### Tier 4 — Attribution (must precede revenue validation)
```
Workflow OS completion events → Revenue Attribution
Revenue Attribution → Practice Memory (outcome learning)
Practice Memory → ALICE improvement (closed learning loop)
```

### Critical Path for First Patient Journey
```
1. Supabase operational (CRITICAL)
2. Patient created via PMS sync or manual entry
3. Patient influence score computed
4. ALICE generates welcome recommendation
5. Journey enrollment created (welcome_patient)
6. Workflow OS picks up journey
7. Script Engine generates personalised messages
8. Communication Hub delivers (SMS + Email)
9. Patient responds / books
10. Revenue Attribution record created
11. Practice Memory updated
12. Growth Score recomputed
```

**Blockers for step 8:** Twilio credentials (SMS), Resend credentials (email)
**Blockers for step 4:** Patient influence score must be computed first

---

## Section 5: External Dependency Inventory

| External System | Used For | Adapter File | Required Env Vars | Criticality | BAA Required |
|----------------|---------|-------------|-----------------|------------|-------------|
| **Supabase** | Database, auth, storage | lib/supabase/ | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | CRITICAL | Yes — pending |
| **Twilio** | SMS delivery | lib/adapters/sms-adapter.ts | `SMS_PROVIDER=twilio`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE` | HIGH | Yes — pending |
| **Resend** | Email delivery | lib/adapters/email-adapter.ts | `EMAIL_PROVIDER=resend`, `RESEND_API_KEY` | HIGH | Yes — pending |
| **HeyGen** | Avatar video rendering (primary) | lib/adapters/heygen-adapter.ts | `HEYGEN_API_KEY` | MEDIUM | Yes — pending |
| **Tavus** | Avatar video rendering (alternative) | lib/adapters/tavus-adapter.ts | `TAVUS_API_KEY` | MEDIUM | Yes — pending |
| **ElevenLabs** | Voice cloning and synthesis | lib/adapters/elevenlabs-adapter.ts | `ELEVENLABS_API_KEY` | MEDIUM | Yes — pending |
| **OpenDental** | PMS patient/appointment data | lib/adapters/opendental-adapter.ts | `OPENDENTAL_API_KEY`, `OPENDENTAL_BASE_URL` | HIGH | Via practice |
| **Stripe** | Membership billing, payments | lib/stripe/ | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | HIGH | No (no PHI) |
| **Google Calendar** | Appointment scheduling | lib/adapters/google-calendar-adapter.ts | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | MEDIUM | No (no PHI) |
| **n8n** | External connectors only | n8n webhook bridge | `N8N_WEBHOOK_BASE_URL` | LOW (4/100) | No |

### Dependency Risk Summary

| Level | Count | Systems |
|-------|-------|--------|
| CRITICAL | 1 | Supabase |
| HIGH | 3 | Twilio, Resend, OpenDental/Stripe |
| MEDIUM | 4 | HeyGen/Tavus, ElevenLabs, Google Calendar |
| LOW | 1 | n8n |

**Single points of failure:**
- Supabase: No fallback. Data layer is entirely on Supabase. Mitigate with Supabase HA + point-in-time recovery.
- Twilio: SMS fallback is email. Configure EMAIL_PROVIDER as secondary channel.
- Communication Hub: If both SMS and email fail, journey steps queue for retry (configurable retry window).

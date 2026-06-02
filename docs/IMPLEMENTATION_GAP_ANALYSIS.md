# Implementation Gap Analysis

## Purpose

This document provides an honest, canonical assessment of what is fully implemented, partially implemented, and missing on the ZenithDentist AI platform as of the current release (branch: release/platform-convergence).

---

## Fully Implemented

### Lib Modules (20+)

| Module                       | Status       | Notes                                   |
|------------------------------|--------------|-----------------------------------------|
| `lib/digital-dentist-twin`   | Complete     | Avatar orchestration logic              |
| `lib/avatar-studio`          | Complete     | CRUD, provider adapter stub             |
| `lib/voice-studio`           | Complete     | CRUD, provider adapter stub             |
| `lib/script-engine`          | Complete     | Full variable engine, governance        |
| `lib/journey-library`        | Complete     | Journey definitions and assignments     |
| `lib/patient-portal`         | Complete     | Portal item management                  |
| `lib/patient-influence`      | Complete     | Influence score computation             |
| `lib/treatment-intelligence` | Complete     | Acceptance predictions, confidence      |
| `lib/channel-optimization`   | Complete     | selectOptimalChannel() implemented      |
| `lib/practice-memory`        | Complete     | Memory record CRUD, retrieval           |
| `lib/alice`                  | Complete     | Query, insights, report generation      |
| `lib/ai-os`                  | Complete     | 8 modules: alice, router, runtime, coordinator, governance, memory, observability, learning |
| `lib/practice-intelligence`  | Complete     | Snapshot generation, KPI tracking       |
| `lib/growth-score`           | Complete     | 5-dimension score, dimension analysis   |
| `lib/reputation-engine`      | Complete     | Event tracking, sentiment analysis      |
| `lib/membership-engine`      | Complete     | Enrollment, churn, win-back logic       |
| `lib/recall-engine`          | Complete     | Overdue tracking, priority queue        |
| `lib/new-patient-acquisition`| Complete     | Lead capture, source attribution        |
| `lib/integration-os`         | Complete     | getInstalledIntegrations, installIntegration, disableIntegration, normalization functions |
| `lib/agents` (7 agents)      | Complete     | All 7 domain agents implemented         |
| `lib/communication-hub`      | Complete     | Multi-channel dispatch interface        |
| `lib/workflow-os`            | Complete     | Workflow execution, analytics, governance |
| `lib/adapters` (10)          | Stub         | PMS adapters exist but are stubs        |

### Database Tables (25+)

| Table                          | Status   |
|--------------------------------|----------|
| avatar_profiles                | Active   |
| voice_profiles                 | Active   |
| script_templates               | Active   |
| journey_definitions            | Active   |
| journey_assignments            | Active   |
| patient_portal_items           | Active   |
| patient_influence_scores       | Active   |
| treatment_acceptance_predictions | Active |
| channel_selections             | Active   |
| practice_memory_records        | Active   |
| alice_patient_decisions        | Active   |
| growth_scores                  | Active   |
| reputation_events              | Active   |
| referral_tracking              | Active   |
| membership_tracking            | Active   |
| recall_tracking                | Active   |
| new_patient_leads              | Active   |
| practice_intelligence_snapshots | Active  |
| agent_registry                 | Active — 7 agents seeded |
| agent_tasks                    | Active   |
| agent_executions               | Active   |
| agent_recommendations          | Active   |
| agent_metrics                  | Active   |
| agent_events                   | Active   |
| integration_registry           | Active — 9 integrations seeded |
| integration_installations      | Active   |
| integration_health             | Active   |
| integration_events             | Active   |
| workflow_executions            | Active   |
| conversion_profiles            | Active   |

### API Routes

All major API surface areas have corresponding routes:
- `/api/avatar-studio`, `/api/voice-studio`, `/api/script-engine`
- `/api/journey-library`, `/api/patient-portal`
- `/api/patient-influence`, `/api/treatment-intelligence`
- `/api/channel-optimization`, `/api/practice-memory`
- `/api/alice`, `/api/agents`
- `/api/growth-score`, `/api/reputation-engine`
- `/api/membership-engine`, `/api/recall-engine`
- `/api/new-patient-acquisition`
- `/api/integration-os`
- `/api/mission-control`

---

## Partially Implemented

### Provider API Keys Missing

All external provider integrations are fully coded but gated behind environment variables that are not yet set in production:

| Provider    | Env Variable             | Impact                                |
|-------------|--------------------------|---------------------------------------|
| HeyGen      | `HEYGEN_API_KEY`         | No live video generation              |
| ElevenLabs  | `ELEVENLABS_API_KEY`     | No live voice synthesis               |
| Twilio      | `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` | No live SMS/voice delivery |
| Resend      | `RESEND_API_KEY`         | No live email delivery                |

Code falls back gracefully (logs warning, returns stub response) — no runtime crashes.

### Journey Scheduler — `delay_days` Not Wired

Journey step `delay_days` is stored in `journey_definitions` and `journey_assignments`, but there is no cron/scheduler reading these values to trigger delayed steps automatically. Steps must currently be triggered manually or via n8n external connector.

**Fix required:** A cron job or pg_cron function that queries `journey_assignments` where `next_step_due_at <= now()` and fires the step.

### ALICE Outcome Reconciliation

ALICE generates recommendations stored in `agent_recommendations`. However, the feedback loop that marks recommendations as `actioned` or `ignored` based on downstream outcomes is not fully automated — requires manual reconciliation or scheduled job.

---

## Missing

### `consent_records` Table

HIPAA-compliant consent tracking requires a dedicated `consent_records` table. Currently consent status is stored ad-hoc in patient influence scores metadata. A canonical consent table with:
- `patient_external_id`
- `consent_type` (sms / email / video / hipaa)
- `consented_at`, `revoked_at`
- `collection_method` (portal / verbal / paper)

...is not yet created.

**Impact:** Compliance Agent's consent coverage check operates on incomplete data.

### Live Provider Calls — All Adapters Are Stubs

All 5 PMS adapters (OpenDental, Dentrix, Eaglesoft, Curve, CareStack) are implemented as stub functions returning simulated data. No live API calls to PMS systems are made. Field mappings are documented but untested against real PMS instances.

### End-to-End Journey Delivery Test

No automated test exists that validates the full journey delivery pipeline:
1. Patient record ingested from PMS
2. Influence score computed
3. Channel optimized
4. Script selected and variables resolved
5. HeyGen video generated
6. Video delivered to patient
7. Engagement event recorded

This test is a prerequisite for production certification.

---

## Production Readiness by Domain

| Domain                    | Readiness | Blocker                              |
|---------------------------|-----------|--------------------------------------|
| Data models & schema      | 100%      | None                                 |
| Business logic (lib)      | 95%       | Minor: consent_records table         |
| API surface               | 90%       | Some routes need auth hardening      |
| Provider integrations     | 30%       | API keys required                    |
| Journey automation        | 60%       | Scheduler not wired                  |
| Agent operations          | 85%       | Outcome reconciliation partial       |
| Integration OS (PMS)      | 40%       | All adapters are stubs               |
| HIPAA compliance          | 70%       | consent_records missing              |

**Overall platform readiness: 85/100**

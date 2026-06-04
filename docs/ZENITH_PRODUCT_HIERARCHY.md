# Zenith Patient OS — Official Product Hierarchy

**Classification:** Canonical Product Authority
**Status:** FROZEN — Architecture locked as of 2026-06-02
**Owner:** Zenith Platform Governance Board

---

## Official Product Tree

```
Zenith Command Center
├── ALICE (Chief Intelligence Officer)
├── Executive Dashboard
├── Patient OS
├── Automation Platform
├── Integration OS
├── AI Agent OS
├── Documentation OS
├── Digital Dentist Twin
├── Patient Influence Engine
├── Practice Memory Graph
├── Revenue Attribution Engine
├── Script Intelligence Engine
├── Video Intelligence Layer
├── Membership Engine
├── Recall Engine
├── Referral Engine
├── Reputation Engine
├── Treatment Acceptance Engine
└── Revenue Recovery System
```

---

## Component Registry

### Zenith Command Center
- **Purpose:** Single-pane-of-glass executive operating layer for practice owners, managers, DSO executives, and Zenith admins.
- **Layer:** Experience
- **Owner:** Practice / Zenith Admin
- **Status:** OPERATIONAL
- **Key Module:** `app/api/mission-control`, `app/(platform)/command-center`

---

### ALICE (Chief Intelligence Officer)
- **Purpose:** Platform-wide AI intelligence layer that observes all signals, predicts patient and practice outcomes, generates ranked recommendations, and continuously learns — but never executes directly.
- **Layer:** Intelligence
- **Owner:** ALICE Intelligence Engine
- **Status:** OPERATIONAL
- **Key Module:** `lib/alice/patient-decision-engine`, `lib/ai-os`

---

### Executive Dashboard
- **Purpose:** Real-time operational dashboard surfacing workflow health, agent activity, growth score, AI Revenue Intelligence recommendations, and communication delivery metrics.
- **Layer:** Experience
- **Owner:** Practice / Zenith Admin
- **Status:** OPERATIONAL
- **Key Module:** `app/api/mission-control`

---

### Patient OS
- **Purpose:** Full patient lifecycle management: intake, influence scoring, journey assignment, treatment follow-up, recall, membership, and portal access.
- **Layer:** Application
- **Owner:** Automation Platform / ALICE
- **Status:** OPERATIONAL
- **Key Module:** `lib/patient-portal`, `lib/patient-influence`

---

### Automation Platform
- **Purpose:** Canonical execution engine for all platform automation. Every action, journey step, agent task, and delivery is executed through Automation Platform.
- **Layer:** Orchestration
- **Owner:** Automation Platform
- **Status:** OPERATIONAL
- **Key Module:** `lib/workflow-os` (10 files including workflow-engine.ts, workflow-registry.ts, execution-scheduler.ts)

---

### Integration OS
- **Purpose:** Normalises and synchronises data between Zenith and external systems (PMS, calendar, payment, communication providers). The only permitted boundary with third-party systems.
- **Layer:** Orchestration
- **Owner:** Integration OS
- **Status:** OPERATIONAL
- **Key Module:** `lib/integration-os`, `lib/adapters` (10 adapters)

---

### AI Agent OS
- **Purpose:** Seven specialised autonomous agents (Treatment Coordinator, Recall, Membership, Review, Referral, Growth, Compliance) that execute AI Revenue Intelligence recommendations through Automation Platform.
- **Layer:** Orchestration
- **Owner:** ALICE / Automation Platform
- **Status:** OPERATIONAL
- **Key Module:** `lib/agents` (7 agent files)

---

### Documentation OS
- **Purpose:** Institutional memory layer ensuring every platform component, workflow, schema, and API is documented, versioned, and governed.
- **Layer:** Application
- **Owner:** Zenith Platform Governance Board
- **Status:** OPERATIONAL
- **Key Module:** `docs/` (170+ files)

---

### Digital Dentist Twin
- **Purpose:** AI-powered digital replica of the treating dentist — avatar, voice, and personalised video — delivered to patients to drive trust, treatment acceptance, and engagement.
- **Layer:** Application
- **Owner:** Practice / ALICE
- **Status:** OPERATIONAL
- **Key Module:** `lib/digital-dentist-twin`, `lib/avatar-studio`, `lib/voice-studio`

---

### Patient Influence Engine
- **Purpose:** Scores every patient 0-100 on predicted treatment acceptance, engagement propensity, churn risk, referral potential, and lifetime value.
- **Layer:** Intelligence
- **Owner:** ALICE
- **Status:** OPERATIONAL
- **Key Module:** `lib/patient-influence`, `lib/treatment-intelligence`, `lib/channel-optimization`

---

### Practice Memory Graph
- **Purpose:** Persistent long-term memory of patient interactions, preferences, outcomes, and relationships — enabling ALICE to learn and personalise at the individual level.
- **Layer:** Data
- **Owner:** ALICE
- **Status:** OPERATIONAL (foundation complete)
- **Key Module:** `lib/practice-memory`

---

### Revenue Attribution Engine
- **Purpose:** Tracks revenue back to the specific Zenith touchpoint (journey step, agent action, ALICE recommendation) that influenced the booking or acceptance decision.
- **Layer:** Intelligence
- **Owner:** ALICE / Practice
- **Status:** OPERATIONAL
- **Key Module:** `lib/revenue-engine` (revenue-attribution-engine.ts)

---

### Script Intelligence Engine
- **Purpose:** Generates, optimises, and personalises communication scripts for every patient interaction channel (SMS, email, video, voice).
- **Layer:** Intelligence
- **Owner:** ALICE
- **Status:** OPERATIONAL
- **Key Module:** `lib/script-engine`

---

### Video Intelligence Layer
- **Purpose:** Produces and manages personalised video content using Digital Dentist Twin avatars, powered by HeyGen or Tavus.
- **Layer:** Application
- **Owner:** Digital Dentist Twin
- **Status:** PARTIAL (avatar creation operational; live video rendering requires provider credentials)
- **Key Module:** `lib/avatar-studio`, `lib/digital-dentist-twin`

---

### Membership Engine
- **Purpose:** Manages in-house dental membership plans — enrollment, billing cycles, benefit tracking, renewals, and revenue reporting.
- **Layer:** Application
- **Owner:** Automation Platform
- **Status:** OPERATIONAL
- **Key Module:** `lib/membership-engine`

---

### Recall Engine
- **Purpose:** Identifies overdue patients and patients approaching recall intervals, then orchestrates personalised multi-channel re-engagement campaigns.
- **Layer:** Application
- **Owner:** Automation Platform / Recall Agent
- **Status:** OPERATIONAL
- **Key Module:** `lib/recall-engine`

---

### Referral Engine
- **Purpose:** Identifies high-propensity referrers, triggers referral ask campaigns, tracks referral attribution, and reports referral revenue.
- **Layer:** Application
- **Owner:** Automation Platform / Referral Agent
- **Status:** OPERATIONAL
- **Key Module:** `lib/new-patient-acquisition` (referral-engine.ts)

---

### Reputation Engine
- **Purpose:** Monitors, manages, and grows the practice's online reputation by orchestrating review requests, responding to feedback, and tracking review velocity.
- **Layer:** Application
- **Owner:** Automation Platform / Review Agent
- **Status:** OPERATIONAL
- **Key Module:** `lib/reputation-engine`

---

### Treatment Acceptance Engine
- **Purpose:** Identifies patients with open treatment plans, scores their acceptance probability, and triggers personalised follow-up sequences to convert treatment plans into booked appointments.
- **Layer:** Application
- **Owner:** Automation Platform / Treatment Coordinator Agent
- **Status:** OPERATIONAL
- **Key Module:** `lib/treatment-intelligence`

---

### Revenue Recovery System
- **Purpose:** Consolidated revenue intelligence layer aggregating production, collections, membership revenue, recall revenue, referral revenue, and revenue forecasting.
- **Layer:** Intelligence
- **Owner:** ALICE / Practice
- **Status:** OPERATIONAL
- **Key Module:** `lib/revenue-engine` (4 engine files)

---

## Dependency Map

| Component | Depends On | Consumed By | Key Event Dependencies |
|-----------|-----------|-------------|----------------------|
| ALICE | patient_influence_scores, practice_memory_records, practice_intelligence_snapshots, agent_recommendations | All Application Layer, Command Center | alice.recommendation.created, alice.decision.updated |
| Executive Dashboard | workflow_executions, growth_scores, alice_patient_decisions, agent_tasks, integration_health | Practice users | — (read-only dashboard) |
| Patient OS | patient_profiles, patient_influence_scores, alice_patient_decisions, journey_enrollments | Command Center, Revenue Attribution | patient.enrolled, patient.journey.step.completed |
| Automation Platform | workflow_definitions, workflow_executions, journey_steps, execution_scheduler | All agents, all journey delivery | workflow.execution.started, workflow.execution.completed |
| Integration OS | integration_registry, integration_health, external PMS/calendar/payment | Event Fabric, Automation Platform | integration.sync.completed, integration.health.changed |
| AI Agent OS | agent_registry, agent_tasks, alice_patient_decisions, workflow_executions | ALICE, Command Center | agent.task.created, agent.recommendation.created |
| Documentation OS | docs/ directory, schema definitions | Governance, deployment gates | — |
| Digital Dentist Twin | avatar_profiles, voice_profiles, script_templates | Journey Library, Video Intelligence | avatar.created, avatar.trained, avatar.video.rendered |
| Patient Influence Engine | patient_profiles, appointment_history, treatment_plans | ALICE, Treatment Acceptance Engine | patient.influence.scored, patient.intent.changed |
| Practice Memory Graph | practice_memory_records, patient interaction events | ALICE (learning layer) | memory.record.created, memory.pattern.detected |
| Revenue Attribution Engine | journey_enrollments, workflow_executions, appointment_bookings, treatment_acceptances | Command Center, ALICE | revenue.attributed, revenue.opportunity.identified |
| Script Intelligence Engine | script_templates, patient_profiles, influence_scores | Communication Hub, Journey Library | script.generated, script.personalised |
| Video Intelligence Layer | avatar_profiles, script_templates, HeyGen/Tavus API | Journey steps, patient communications | video.render.requested, video.render.completed |
| Membership Engine | membership_plans, membership_tracking, Stripe | Revenue Attribution, Command Center | membership.enrolled, membership.renewed, membership.cancelled |
| Recall Engine | recall_tracking, appointment_history, patient_profiles | Recall Agent, Automation Platform | recall.triggered, recall.responded, recall.booked |
| Referral Engine | referral_tracking, patient_profiles, influence_scores | Referral Agent, Revenue Attribution | referral.requested, referral.converted |
| Reputation Engine | reputation_events, patient_profiles, review platform APIs | Review Agent, Growth Score | review.requested, review.received, review.published |
| Treatment Acceptance Engine | treatment_plans, patient_influence_scores, alice_patient_decisions | Treatment Coordinator Agent, Automation Platform | treatment.followup.triggered, treatment.accepted |
| Revenue Recovery System | revenue_attribution_records, membership_tracking, recall_tracking, referral_tracking | Command Center, ALICE, forecasting | revenue.snapshot.created, revenue.forecast.updated |

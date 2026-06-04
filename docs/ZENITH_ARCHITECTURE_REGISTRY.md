# Zenith Patient OS — Architecture Registry

**Classification:** Canonical Platform Registry
**Status:** FROZEN — Architecture locked as of 2026-06-02
**Owner:** Zenith Platform Governance Board
**Last Updated:** 2026-06-02

This is the authoritative registry of every platform component: DB tables, lib modules, API routes, events, and workflows. Any addition requires an Architecture Change Request (ACR).

---

## Section 1: DB Schema Registry

Tables are grouped by migration file. All tables are scoped by `organization_id` (tenant isolation) unless noted. RLS policies enforce row-level security.

### Phase 4 Production Schema (202605210001)

| Table | Purpose | Org Scoped | RLS Policy |
|-------|---------|-----------|-----------|
| patient_profiles | Master patient records | Yes | org_users_read, service_role_all |
| patient_influence_scores | Multi-dimensional influence model (0-100) | Yes | service_role_all |
| alice_patient_decisions | ALICE recommendation log per patient | Yes | service_role_all |
| journey_enrollments | Patient journey assignment and progress | Yes | service_role_all |
| workflow_executions | Audit log of all workflow runs | Yes | service_role_all |
| communication_events | Outbound message delivery log | Yes | service_role_all |
| revenue_attribution_records | Revenue attributed to Zenith touchpoints | Yes | service_role_all |
| treatment_plans | Open and historical treatment plan records | Yes | service_role_all |

### Phase 5 AI Operations (202605210002)

| Table | Purpose | Org Scoped | RLS Policy |
|-------|---------|-----------|-----------|
| agent_registry | Registered AI agents with capabilities | Yes | service_role_all |
| agent_tasks | Task queue for agent execution | Yes | service_role_all |
| agent_executions | Agent execution audit log | Yes | service_role_all |
| agent_recommendations | Agent-generated patient recommendations | Yes | service_role_all |
| practice_memory_records | Long-term memory store for ALICE | Yes | service_role_all |
| script_templates | AI-generated communication scripts | Yes | service_role_all |

### Phase 6 Multi-Tenant SaaS (202605210003)

| Table | Purpose | Org Scoped | RLS Policy |
|-------|---------|-----------|-----------|
| organizations | Tenant organisation registry | No (root) | super_admin_all |
| organization_members | User-to-organisation membership | Yes | org_users_read |
| integration_registry | Registered external integrations | Yes | service_role_all |
| integration_health | Per-integration health status | Yes | service_role_all |
| avatar_profiles | Digital Dentist Twin avatar definitions | Yes | service_role_all |
| voice_profiles | Voice clone profiles | Yes | service_role_all |
| membership_plans | In-house dental membership plan definitions | Yes | service_role_all |
| membership_tracking | Patient membership enrollment records | Yes | service_role_all |

### Phase 7-8 Autonomous OS (202605210004)

| Table | Purpose | Org Scoped | RLS Policy |
|-------|---------|-----------|-----------|
| recall_tracking | Recall campaign patient records | Yes | service_role_all |
| referral_tracking | Referral request and conversion records | Yes | service_role_all |
| reputation_events | Review request and receipt log | Yes | service_role_all |
| growth_scores | Computed Growth Score records (0-100, 7 dimensions) | Yes | service_role_all |
| practice_intelligence_snapshots | ALICE practice-level analysis snapshots | Yes | service_role_all |
| new_patient_leads | New patient acquisition lead records | Yes | service_role_all |
| agent_metrics | Per-agent performance metrics | Yes | service_role_all |
| agent_events | Agent audit and event log | Yes | service_role_all |

### Phase 10-11 Healthcare Cloud (202605210005)

| Table | Purpose | Org Scoped | RLS Policy |
|-------|---------|-----------|-----------|
| consent_records | Patient consent and HIPAA consent records | Yes | service_role_all |
| hipaa_audit_log | PHI access audit trail | Yes | service_role_all |
| compliance_checks | Compliance agent check records | Yes | service_role_all |

### Dental Growth OS (202606030004)

| Table | Purpose | Org Scoped | RLS Policy |
|-------|---------|-----------|-----------|
| patient_journey_steps | Individual journey step execution records | Yes | service_role_all |
| workflow_definitions | Registered workflow templates | Yes | service_role_all |

### Billing & Customers (202606030001)

| Table | Purpose | Org Scoped | RLS Policy |
|-------|---------|-----------|-----------|
| billing_customers | Stripe customer records per organisation | Yes | service_role_all |
| billing_subscriptions | Zenith platform subscription records | Yes | service_role_all |

---

## Section 2: Lib Module Registry

All modules under `lib/`. Key exports listed for primary consumer awareness.

| Module Path | Purpose | Key Exports | Primary Dependencies |
|-------------|---------|-------------|---------------------|
| lib/alice/patient-decision-engine | ALICE patient-level decision generation | `generatePatientDecision`, `getPendingPatientDecisions` | patient_influence_scores, practice_memory_records |
| lib/ai-os | AI orchestration layer, ALICE core | `ALICEEngine`, `generateRecommendations` | lib/alice, lib/ai |
| lib/alice.ts | ALICE entry point + types | `ALICE`, `AliceDecision` | lib/alice/ |
| lib/workflow-os | Canonical execution engine (10 files) | `WorkflowEngine`, `executeWorkflow`, `scheduleStep`, `WorkflowRegistry` | workflow_executions, agent_tasks |
| lib/event-fabric | Immutable dual-write event system | `emitEvent`, `subscribeToEvent`, `EventCatalogue` | All tables (event_log) |
| lib/digital-dentist-twin | Digital dentist avatar orchestration | `createTwin`, `trainTwin`, `getTwinProfile` | avatar_profiles, voice_profiles |
| lib/avatar-studio | Avatar creation and management | `createAvatar`, `renderVideo`, `getAvatarStatus` | avatar_profiles, HeyGen/Tavus API |
| lib/voice-studio | Voice cloning and synthesis | `cloneVoice`, `synthesiseSpeech` | voice_profiles, ElevenLabs API |
| lib/script-engine | AI script generation and personalisation | `generateScript`, `personaliseScript`, `getScriptTemplate` | script_templates, patient_profiles |
| lib/journey-library | Patient journey definitions and assignment | `assignJourney`, `getJourneySteps`, `JourneyRegistry` | journey_enrollments, patient_journey_steps |
| lib/patient-portal | Patient-facing portal functions | `getPatientPortalData`, `updatePatientPreferences` | patient_profiles, communication_events |
| lib/patient-influence | Patient influence scoring engine | `computeInfluenceScore`, `getInfluenceProfile` | patient_influence_scores, patient_profiles |
| lib/treatment-intelligence | Treatment acceptance prediction | `predictAcceptance`, `getTreatmentInsights` | treatment_plans, patient_influence_scores |
| lib/channel-optimization | Optimal channel selection per patient | `getBestChannel`, `optimiseDelivery` | patient_influence_scores, communication_events |
| lib/practice-memory | Long-term practice and patient memory | `recordMemory`, `recallMemory`, `getPatternInsights` | practice_memory_records |
| lib/practice-intelligence | Practice-level analytics and insights | `computePracticeSnapshot`, `getPracticeInsights` | practice_intelligence_snapshots |
| lib/growth-score | Growth Score computation (7 dimensions) | `computeGrowthScore`, `getDimensionScores` | growth_scores, all tracking tables |
| lib/reputation-engine | Review management and reputation tracking | `requestReview`, `trackReview`, `getReputationMetrics` | reputation_events |
| lib/membership-engine | Membership plan management | `enrollMember`, `renewMembership`, `getMembershipMetrics` | membership_plans, membership_tracking |
| lib/recall-engine | Recall campaign management | `triggerRecall`, `trackRecallResponse`, `getRecallMetrics` | recall_tracking |
| lib/new-patient-acquisition | Lead acquisition and referral engine | `trackLead`, `convertReferral`, `getAcquisitionMetrics` | new_patient_leads, referral_tracking |
| lib/integration-os | Integration framework and health management | `registerIntegration`, `syncData`, `getIntegrationHealth` | integration_registry, integration_health |
| lib/communication-hub | Unified outbound communication delivery | `sendMessage`, `getDeliveryStatus` | communication_events, SMS/email adapters |
| lib/agents | 7 AI agent implementations | Per-agent: `executeTask`, `generateRecommendation` | agent_registry, agent_tasks, workflow-os |
| lib/adapters | 10 external system adapters | Per-adapter: `connect`, `sync`, `deliver` | Integration credentials (env vars) |
| lib/stripe | Stripe payment integration | `createCustomer`, `createSubscription`, `processPayment` | billing_customers, billing_subscriptions |
| lib/supabase | Supabase client utilities | `createClient`, `getServerClient`, `getServiceClient` | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY |
| lib/revenue-engine | Revenue intelligence (4 engines) | `attributeRevenue`, `forecastRevenue`, `getRevenueMetrics` | revenue_attribution_records |
| lib/revenue-attribution | Revenue attribution logic | `attributeToJourney`, `attributeToAgent` | revenue_attribution_records, workflow_executions |

---

## Section 3: API Route Registry

All routes under `app/api/`. Authentication via `x-organization-id` header unless noted.

| Route | Methods | Auth Required | Purpose |
|-------|---------|--------------|---------|
| /api/agents | GET, POST | Yes | List agents; trigger agent task |
| /api/agents/recommendations | GET | Yes | ALICE + agent recommendations |
| /api/agents/metrics | GET | Yes | Agent performance metrics |
| /api/alice | POST | Yes | Generate ALICE analysis |
| /api/alice/decisions | GET | Yes | List ALICE patient decisions |
| /api/analytics | GET | Yes | Practice analytics summary |
| /api/automation-health | GET | Yes | Workflow + agent health status |
| /api/avatar-studio | GET, POST | Yes | Avatar management |
| /api/channel-optimization | GET, POST | Yes | Channel recommendation for patient |
| /api/dental | GET, POST | Yes | Dental practice management |
| /api/digital-dentist-twin | GET, POST | Yes | Digital twin management |
| /api/growth-score | GET | Yes | Current Growth Score + dimensions |
| /api/gtm-command-center | GET | Yes | Go-to-market command metrics |
| /api/integrations | GET, POST, PUT | Yes | Integration management |
| /api/internal | GET, POST | Service role | Internal platform operations |
| /api/journeys | GET, POST | Yes | Journey assignment and management |
| /api/membership | GET, POST, PUT | Yes | Membership management |
| /api/mission-control | GET | Yes | Executive Dashboard data |
| /api/opendental | GET, POST | Yes | OpenDental PMS sync |
| /api/patient-influence | GET, POST | Yes | Patient influence scoring |
| /api/patient-portal | GET, PUT | Patient auth | Patient portal data |
| /api/practice-intelligence | GET | Yes | Practice intelligence snapshots |
| /api/recall | GET, POST | Yes | Recall campaign management |
| /api/reports | GET | Yes | Platform reports |
| /api/reputation | GET, POST | Yes | Reputation management |
| /api/roi-assessment | GET | Yes | ROI assessment report |
| /api/scripts | GET, POST | Yes | Script generation |
| /api/treatment-intelligence | GET, POST | Yes | Treatment acceptance intelligence |
| /api/voice-studio | GET, POST | Yes | Voice profile management |

---

## Section 4: Event Catalogue

All Event Fabric events, organised by domain. Events are immutable once written.

### Patient Domain
| Event | Emitter | Consumers |
|-------|---------|----------|
| `patient.created` | Patient registration | ALICE, Journey Library |
| `patient.updated` | Patient profile update | ALICE, Influence Engine |
| `patient.enrolled` | Journey enrollment | Automation Platform, ALICE |
| `patient.influence.scored` | Influence Engine | ALICE, Command Center |
| `patient.intent.changed` | Influence Engine | ALICE, Treatment Coordinator Agent |
| `patient.churn.risk.flagged` | ALICE | Recall Agent, Practice Memory |

### Workflow Domain
| Event | Emitter | Consumers |
|-------|---------|----------|
| `workflow.execution.started` | Automation Platform | Audit log, Command Center |
| `workflow.execution.completed` | Automation Platform | Revenue Attribution, ALICE |
| `workflow.execution.failed` | Automation Platform | Alert system, Command Center |
| `workflow.step.completed` | Automation Platform | Next step scheduler, Event Fabric |

### ALICE Domain
| Event | Emitter | Consumers |
|-------|---------|----------|
| `alice.recommendation.created` | ALICE | Agents, Command Center |
| `alice.decision.updated` | ALICE | Command Center, Practice Memory |
| `alice.briefing.generated` | ALICE | Communication Hub, Command Center |

### Agent Domain
| Event | Emitter | Consumers |
|-------|---------|----------|
| `agent.task.created` | Agent OS | Automation Platform, agent runner |
| `agent.task.completed` | Agent runner | Revenue Attribution, ALICE |
| `agent.recommendation.created` | Agent | ALICE, Command Center |

### Revenue Domain
| Event | Emitter | Consumers |
|-------|---------|----------|
| `revenue.attributed` | Revenue Attribution Engine | Command Center, ALICE |
| `revenue.opportunity.identified` | ALICE | Agents, Command Center |
| `revenue.forecast.updated` | Practice Intelligence | Command Center |

### Growth Domain
| Event | Emitter | Consumers |
|-------|---------|----------|
| `growth.score.computed` | Growth Score Engine | Command Center, ALICE |
| `review.requested` | Reputation Engine | Reputation tracking |
| `review.received` | Reputation Engine | Growth Score, Command Center |
| `recall.triggered` | Recall Engine | Automation Platform, Recall Agent |
| `recall.booked` | Recall Engine | Revenue Attribution, Growth Score |
| `referral.converted` | Referral Engine | Revenue Attribution, Growth Score |
| `membership.enrolled` | Membership Engine | Revenue Attribution, Growth Score |

### Integration Domain
| Event | Emitter | Consumers |
|-------|---------|----------|
| `integration.sync.completed` | Integration OS | Event Fabric, Automation Platform |
| `integration.health.changed` | Integration OS | Command Center, alert system |
| `communication.delivered` | Communication Hub | Event Fabric, attribution |
| `communication.failed` | Communication Hub | Alert system, retry queue |

### Digital Twin Domain
| Event | Emitter | Consumers |
|-------|---------|----------|
| `avatar.created` | Avatar Studio | Digital Dentist Twin |
| `avatar.trained` | Avatar Studio | Journey Library, Video Intelligence |
| `avatar.video.rendered` | Avatar Studio | Communication Hub |

---

## Section 5: Workflow Registry

All Patient OS standard workflows registered in `lib/workflow-os/workflow-registry.ts`.

| Workflow ID | Name | Trigger | Steps | Owner Agent |
|-------------|------|---------|-------|------------|
| `welcome_patient` | New Patient Welcome Journey | patient.created | intro_sms → welcome_email → avatar_video → 7day_followup | Treatment Coordinator |
| `treatment_followup` | Treatment Acceptance Campaign | treatment.plan.presented | same_day_email → 3day_sms → 7day_video → 14day_final | Treatment Coordinator |
| `recall_campaign` | Overdue Patient Re-engagement | recall.triggered | sms_1 → email_1 → 14day_sms_2 → 30day_final | Recall Agent |
| `membership_enrollment` | Membership Onboarding | membership.enrolled | welcome_email → benefits_video → 30day_checkin | Membership Agent |
| `referral_campaign` | Referral Ask Campaign | referral.trigger | referral_ask_sms → email_followup → thank_you | Referral Agent |
| `review_campaign` | Post-Visit Review Request | appointment.completed | 2hr_review_sms → 24hr_email → 7day_final | Review Agent |
| `new_patient_acquisition` | Lead Nurture to Booked Appointment | lead.created | immediate_response → 24hr_followup → 72hr_nurture | Growth Agent |

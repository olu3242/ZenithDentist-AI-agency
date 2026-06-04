# Documentation OS™ — Institutional Memory Layer

**Classification:** Canonical Platform Specification
**Status:** OPERATIONAL
**Owner:** Zenith Platform Governance Board
**Documentation Coverage:** ~92% (170+ files in docs/)
**Last Updated:** 2026-06-02

---

## Purpose

Documentation OS™ is the institutional memory of Zenith Patient OS™. Every component, workflow, schema, API route, agent, and integration is documented, versioned, and governed. No platform component exists without documentation. No production deployment is permitted without documentation coverage passing the governance gate.

**Core principles:**
- Every lib module has a corresponding doc entry in the Architecture Registry
- Every DB table is listed in the Schema Registry
- Every API route is catalogued in the API Registry
- Every workflow definition is registered in the Workflow Registry
- Documentation is a first-class deliverable — not an afterthought

---

## 9 Core Modules

### 1. Documentation Studio™
**Purpose:** Authoring interface for all platform documentation.
**Implementation:** Markdown-based, stored in `docs/` directory at repository root.
**Conventions:**
- All canonical governance docs: `ZENITH_*.md` prefix
- All spec docs: descriptive names, uppercase
- All runbooks: `RUNBOOK_*.md` prefix
- All compliance docs: `COMPLIANCE_*.md` prefix
**Current state:** 170+ documentation files across all categories.
**Ownership:** Each doc has a designated owner recorded in the doc header.

---

### 2. Architecture Registry™
**Purpose:** Canonical record of all platform components, their layers, dependencies, lib module paths, and operational status.
**Location:** `docs/ZENITH_ARCHITECTURE_REGISTRY.md`
**Contains:** DB Schema Registry (35+ tables), Lib Module Registry (28+ modules), API Route Registry (20+ routes), Event Catalogue (30+ events), Workflow Registry.
**Update trigger:** Any new lib module, DB table, API route, or event MUST be registered here before merge to main.

---

### 3. Workflow Registry™
**Purpose:** All Workflow OS workflow definitions documented with steps, triggers, owners, and expected outcomes.
**Primary source:** `lib/workflow-os/workflow-registry.ts`
**Documentation:** Each workflow entry in the code registry has a corresponding documentation section in the Architecture Registry.
**Standard workflows documented:**
- `welcome_patient` — New patient onboarding journey
- `treatment_followup` — Post-consultation treatment acceptance campaign
- `recall_campaign` — Overdue patient re-engagement
- `membership_enrollment` — Membership plan onboarding
- `referral_campaign` — Referral request and tracking
- `review_campaign` — Post-visit review request
- `new_patient_acquisition` — Lead nurture to booked appointment

---

### 4. Agent Registry™
**Purpose:** Documentation of all 7 AI agents — their purpose, trigger conditions, decision logic, escalation paths, and output events.
**Primary source:** `agent_registry` DB table + `lib/agents/` directory
**Agents registered:**
- `treatment_coordinator` — lib/agents/treatment-coordinator-agent.ts
- `recall_coordinator` — lib/agents/recall-agent.ts
- `membership` — lib/agents/membership-agent.ts
- `review` — lib/agents/review-agent.ts
- `referral` — lib/agents/referral-agent.ts
- `growth` — lib/agents/growth-agent.ts
- `compliance` — lib/agents/compliance-agent.ts
**Each agent entry documents:** capabilities, input requirements, output events, confidence thresholds, fallback behaviour, HIPAA considerations.

---

### 5. Integration Registry™
**Purpose:** All external integrations documented — credentials required, health check endpoint, sync frequency, failure handling.
**Primary source:** `integration_registry` DB table + `lib/integration-os/` + `lib/adapters/`
**Integrations registered:**
- OpenDental PMS — `lib/adapters/opendental-adapter.ts`
- Google Calendar — `lib/adapters/google-calendar-adapter.ts`
- Stripe — `lib/stripe/`
- Twilio SMS — `lib/adapters/sms-adapter.ts`
- Resend Email — `lib/adapters/email-adapter.ts`
- HeyGen Video — `lib/adapters/heygen-adapter.ts`
- ElevenLabs Voice — `lib/adapters/elevenlabs-adapter.ts`
- Supabase — `lib/supabase/`
- n8n (external connectors only, dependency score: 4/100)
- Tavus (alternative video provider)

---

### 6. Schema Registry™
**Purpose:** Every DB table documented — purpose, columns, RLS policy, organisation scoping, migration file.
**Location:** `docs/ZENITH_ARCHITECTURE_REGISTRY.md` — Section 1: DB Schema Registry
**Standard entry format:**
```
| table_name | migration_file | purpose | org_scoped (Y/N) | rls_policy |
```
**Requirement:** Every table added in a migration MUST be registered before the migration is merged to main.

---

### 7. API Registry™
**Purpose:** All `app/api/` routes catalogued — methods, authentication requirements, request/response schema, rate limits.
**Location:** `docs/ZENITH_ARCHITECTURE_REGISTRY.md` — Section 3: API Route Registry
**Standard entry format:**
```
| /api/route | GET/POST/PUT/DELETE | auth header | purpose | rate limit |
```
**Requirement:** Every new API route MUST be registered within the same PR that introduces it.

---

### 8. Runbook Registry™
**Purpose:** Operational runbooks for incidents, deployments, rollbacks, and routine maintenance.
**Location:** `docs/RUNBOOK_*.md`
**Required runbooks:**
- `RUNBOOK_INCIDENT_RESPONSE.md` — How to respond to production incidents
- `RUNBOOK_DEPLOYMENT.md` — Deployment procedure and verification steps
- `RUNBOOK_ROLLBACK.md` — How to roll back a failed deployment
- `RUNBOOK_DATABASE_MIGRATION.md` — Safe migration execution procedure
- `RUNBOOK_INTEGRATION_FAILURE.md` — Steps when an external integration fails
- `RUNBOOK_ALICE_FALLBACK.md` — Steps when ALICE fallback rate exceeds threshold

---

### 9. Compliance Registry™
**Purpose:** HIPAA documentation, platform governance records, consent templates, BAA tracking, and audit trail.
**Location:** `docs/COMPLIANCE_*.md`
**Contents:**
- BAA status per vendor (Twilio, Resend, HeyGen/Tavus, ElevenLabs, Supabase)
- PHI handling procedures
- Data retention policies
- Consent record schema documentation
- Audit log policy (Event Fabric immutability guarantee)
- See also: `docs/ZENITH_PLATFORM_GOVERNANCE.md`

---

## Documentation Requirements (16 Required Fields per Component)

Every documented component MUST include the following fields:

| # | Field | Description |
|---|-------|-------------|
| 1 | `component_name` | Official product name with trademark |
| 2 | `classification` | Canonical / Specification / Runbook / Compliance |
| 3 | `status` | OPERATIONAL / PARTIAL / PLANNED |
| 4 | `owner` | Named owner (person or team) |
| 5 | `last_updated` | ISO date of last meaningful update |
| 6 | `purpose` | One-paragraph statement of purpose |
| 7 | `layer` | Experience / Application / Intelligence / Orchestration / Data |
| 8 | `lib_module` | Primary lib module path(s) |
| 9 | `db_tables` | All DB tables owned or primarily written by this component |
| 10 | `api_routes` | All API routes this component exposes |
| 11 | `events_emitted` | Event Fabric events this component emits |
| 12 | `events_consumed` | Event Fabric events this component listens to |
| 13 | `depends_on` | Upstream component dependencies |
| 14 | `consumed_by` | Downstream components that depend on this |
| 15 | `env_vars` | Required environment variables |
| 16 | `hipaa_notes` | PHI handling, consent requirements, audit obligations |

---

## Auto Documentation Engine™ — Trigger Conditions

The following changes MUST trigger documentation updates:

| Trigger | Required Documentation Action |
|---------|------------------------------|
| New DB migration merged | Update Schema Registry, update dependency map |
| New lib module created | Register in Architecture Registry (Lib Module section) |
| New API route added | Register in API Route Registry |
| New event type defined | Register in Event Catalogue |
| New workflow registered | Add to Workflow Registry |
| New agent added | Register in Agent Registry |
| New integration added | Register in Integration Registry |
| Environment variable added | Update Integration Registry + relevant component doc |
| Component status changes | Update Product Hierarchy status field |
| Architecture decision made | Create or update canonical spec doc |

---

## Documentation Governance Gate

**Policy:** No production deployment is permitted if documentation coverage falls below 85%.

### Coverage Calculation
```
coverage = (documented_components / total_components) × 100

Components counted:
  - lib modules (each directory = 1 component)
  - DB tables (each table = 1 component)
  - API routes (each unique path = 1 component)
  - agents (each agent = 1 component)
  - integrations (each adapter = 1 component)
  - workflows (each workflow definition = 1 component)
```

### Gate Thresholds
| Coverage | Decision |
|----------|----------|
| ≥ 90% | APPROVED — green light for deployment |
| 85–89% | CONDITIONAL — deploy with documentation sprint within 7 days |
| 70–84% | BLOCKED — documentation sprint required before deployment |
| < 70% | HARD BLOCK — deployment prevented until resolved |

---

## Documentation Health Metrics

| Metric | Current Value | Target | Owner |
|--------|--------------|--------|-------|
| Total docs in docs/ | 170+ | 200 | Platform Gov Board |
| ZENITH_ canonical docs | 9 (post this sprint) | 12 | Platform Gov Board |
| Estimated coverage % | ~92% | 95% | Platform Gov Board |
| Missing docs (known) | ~8 components | 0 | Platform Gov Board |
| Outdated docs | ~5 (last reviewed > 30 days) | 0 | Component owners |
| Ownership gaps (no named owner) | ~3 docs | 0 | Platform Gov Board |
| Runbooks complete | 2/6 | 6/6 | Engineering Lead |
| Compliance docs complete | 3/6 | 6/6 | Compliance Officer |

---

## Documentation Sprint Policy

- Documentation sprints run with every major feature sprint
- Each sprint closes with a documentation review checkpoint
- Any component with missing documentation is flagged as a P2 backlog item
- Documentation debt is tracked the same as technical debt
- The Documentation OS™ health dashboard is reviewed weekly in platform governance meetings

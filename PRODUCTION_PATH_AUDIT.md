# Production Path Audit

Date: 2026-06-02

Scope: Client Acquisition -> Implementation -> Revenue Reality Audit.

Conclusion: Zenith has enough architecture and operational surfaces. The blocker is not another dashboard or framework. The blocker is live-path certification with real Stripe, Open Dental, communication delivery, evidence population, revenue attribution, and ALICE outcome records.

## Scoring Legend

- Implemented: code/schema/UI exists.
- Integrated: connected to an API, service, database table, or internal operating surface.
- Validated: proven locally or with executable route/build checks.
- Certified: proven with real-world pilot data and persisted evidence.

## Executive Scorecard

| Capability | Impl | Int | Valid | Cert | Current Reality |
| --- | --- | --- | --- | --- | --- |
| Lead Capture / ROI Assessment | PASS | PASS | PASS | WARN | `POST /api/roi-assessment` creates lead/audit/ROI records; needs live funnel run evidence. |
| Proposal & Closing | PASS | WARN | WARN | FAIL | Agency CRM contract/opportunity tables exist; no certified proposal-to-contract-to-Stripe setup fee path. |
| Client Onboarding | PASS | PASS | PASS | WARN | Implementation OS and Client Playbooks exist; needs signed-client pilot run. |
| PMS Integration | PASS | WARN | WARN | FAIL | Open Dental pilot sync exists; no real Open Dental production validation. |
| Communication OS | PASS | WARN | WARN | FAIL | Template render and evidence exist; provider delivery for SMS/email/WhatsApp is not certified. |
| Treatment Acceptance | PASS | WARN | WARN | FAIL | Treatment acceptance creates payment link and evidence; no patient-facing E2E payment proof. |
| Stripe Revenue Flow | PASS | WARN | WARN | FAIL | Payment/invoice tables and link engine exist; link URL is local app URL, not certified Stripe live Checkout/Payment Link. |
| Evidence OS | PASS | PASS | WARN | FAIL | Evidence producers and coverage exist; population automation is not proven across every workflow. |
| Executive Visibility | PASS | PASS | PASS | WARN | Executive/Product/CS/Agency CRM read live tables; many tables may be empty until pilot data lands. |
| ALICE Traceability | PASS | WARN | WARN | FAIL | Trace persistence helper exists; not proven as mandatory write-through from every recommendation path. |

## Path 1 - Lead Capture

Flow: Visitor -> ROI Assessment -> Lead Created -> Agency CRM

Evidence Found:

- `app/api/roi-assessment/route.ts` validates assessment payload and calls `createLeadFunnel`.
- `app/actions.ts` also routes the public assessment form into `createLeadFunnel`.
- Admin/Agency CRM surfaces read lead, ROI, audit, booking, and GTM state.
- Assessment CTA routing has been corrected in previous CTA work.

Status:

- Implemented: PASS
- Integrated: PASS
- Validated: PASS
- Certified: WARN

Gap:

- Needs a real production form submission with persisted `leads`, `roi_calculations`, `audits`, and Agency CRM visibility evidence.

Pilot Test:

1. Submit the public ROI assessment as a real prospect.
2. Verify lead appears in `/admin/leads`, `/admin/roi`, `/gtm-command-center`, and `/internal/agency-crm`.
3. Capture lead ID, audit ID, ROI ID, timestamp, and email delivery result.

## Path 2 - Proposal & Closing

Flow: Lead -> Proposal -> Contract -> Stripe Setup Fee

Evidence Found:

- Agency CRM tables exist in migration governance: `prospects`, `clients`, `contracts`, `opportunities`, `renewals`, `expansions`.
- GTM/commercial modules model proposals, packages, implementation pricing, and closing motions.
- Stripe diagnostics exist through runtime configuration.

Status:

- Implemented: PASS
- Integrated: WARN
- Validated: WARN
- Certified: FAIL

Gap:

- No certified E2E path from won lead to signed contract record to live Stripe setup fee collection.
- No confirmed webhook that turns paid setup fee into client creation and implementation project generation.

Pilot Test:

1. Convert a real lead to proposal.
2. Create contract record.
3. Collect setup fee through live or test Stripe.
4. Verify contract, payment, client, and implementation project records are linked.

## Path 3 - Client Onboarding

Flow: Signed Client -> Implementation OS -> Client Playbooks -> Go Live

Evidence Found:

- `implementation_projects`, `implementation_tasks`, `implementation_checklist_templates`, `client_onboarding_items`, and `go_live_checklists` exist.
- `client_operating_playbook_templates` and `client_operating_playbook_items` exist.
- `/internal/implementations`, `/internal/onboarding`, `/internal/go-live`, and `/internal/client-playbooks` exist.
- `createImplementationProjectFromContract` generates checklist, tasks, playbook items, integration readiness checks, go-live checklist, and success reviews.

Status:

- Implemented: PASS
- Integrated: PASS
- Validated: PASS
- Certified: WARN

Gap:

- Needs a real signed-client event to invoke project generation and complete checklist/evidence rows.

Pilot Test:

1. Create a signed pilot client.
2. Run implementation project generation.
3. Complete onboarding items with owner/due/evidence.
4. Certify go-live only after required gates are complete.

## Path 4 - PMS Integration

Flow: Open Dental -> Patient Sync -> Appointment Sync -> Treatment Sync

Evidence Found:

- `app/api/opendental/sync/route.ts` starts a runtime trace and runs `runOpenDentalPilotSync`.
- `lib/pms.ts` normalizes Open Dental events and other PMS payloads.
- PMS dashboard routes exist.

Status:

- Implemented: PASS
- Integrated: WARN
- Validated: WARN
- Certified: FAIL

Gap:

- Current route is pilot sync, not confirmed real Open Dental credentials, real patient sync, real appointment sync, or real treatment sync.
- No production evidence bundle proving data quality, sync latency, retry behavior, and tenant isolation with a live practice.

Pilot Test:

1. Connect a real or sandbox Open Dental database.
2. Sync patients, appointments, providers, and treatments.
3. Verify normalized events, dashboard counts, runtime traces, incident handling, and evidence records.

## Path 5 - Communication OS

Flow: Template -> SMS -> Email -> WhatsApp

Evidence Found:

- `message_templates` table exists.
- `lib/templates/template-engine.ts` loads templates, renders variables, and produces evidence.
- `lib/templates/channel-router.ts` supports SMS, email, WhatsApp, and video channels.

Status:

- Implemented: PASS
- Integrated: WARN
- Validated: WARN
- Certified: FAIL

Gap:

- Template rendering is not the same as delivery.
- No certified Twilio/Resend/WhatsApp provider delivery receipts, bounce handling, opt-out handling, or delivery evidence.

Pilot Test:

1. Send real SMS, email, and WhatsApp test messages to approved test recipients.
2. Persist delivery status, failure state, and evidence.
3. Verify delivery appears in Mission Control and Evidence OS.

## Path 6 - Treatment Acceptance

Flow: Treatment Plan -> Video -> Acceptance -> Payment

Evidence Found:

- `treatment_plans`, `treatment_estimates`, `treatment_acceptances`, and `treatment_declines` exist.
- `lib/treatment-acceptance.ts` creates treatment acceptance, creates payment link, and produces revenue evidence.
- Video Intelligence schema and portal route exist.

Status:

- Implemented: PASS
- Integrated: WARN
- Validated: WARN
- Certified: FAIL

Gap:

- No certified patient journey proving treatment plan video viewed, acceptance captured, payment completed, and revenue attributed.

Pilot Test:

1. Create treatment plan for a pilot patient.
2. Deliver treatment video.
3. Capture acceptance.
4. Collect payment.
5. Verify evidence, attribution, and Executive Revenue Center update.

## Path 7 - Stripe Revenue Flow

Flow: Invoice -> Payment Link -> Payment -> Revenue Attribution

Evidence Found:

- `payment_links`, `invoices`, `transactions`, `payment_attempts`, and `refunds` exist.
- `lib/payments/payment-link-engine.ts` creates a `payment_links` row and records payment evidence.
- `lib/payments/stripe-gateway.ts` exposes gateway capabilities and configuration status.

Status:

- Implemented: PASS
- Integrated: WARN
- Validated: WARN
- Certified: FAIL

Gap:

- Current payment link engine creates an app URL using `NEXT_PUBLIC_SITE_URL`; it does not prove live Stripe Checkout or Stripe Payment Link creation.
- No webhook-certified payment completion to transaction to revenue attribution path.

Pilot Test:

1. Create Stripe Checkout Session or Stripe Payment Link.
2. Complete test payment.
3. Receive Stripe webhook.
4. Persist transaction.
5. Create revenue attribution and revenue evidence.

## Path 8 - Evidence OS

Flow: Workflow -> Evidence -> Executive Dashboard

Evidence Found:

- Evidence tables exist for automation, workflow, revenue, patient journey, relationship, video, ALICE, LIZ, and compliance.
- `lib/evidence/evidence-engine.ts` calculates coverage and certification gates.
- Producers are referenced from templates, payments, incidents, SLA, recovery, and treatment acceptance modules.

Status:

- Implemented: PASS
- Integrated: PASS
- Validated: WARN
- Certified: FAIL

Gap:

- Evidence population automation is not proven for every workflow and every production event type.
- Coverage scoring checks row counts, but pilot certification needs event-level lineage from trigger to dashboard.

Pilot Test:

1. Run one workflow of each critical type.
2. Verify operational event, evidence event, audit event, and certification result.
3. Confirm Executive Center coverage increases from actual rows.

## Path 9 - Executive Visibility

Verify: Executive Dashboard, Product Owner Dashboard, Customer Success, Agency CRM consume real data.

Evidence Found:

- `/internal/executive`, `/internal/product-owner`, `/internal/customer-success`, and `/internal/agency-crm` exist.
- `lib/enterprise-operations.ts` reads organizations, enterprise evidence, revenue attribution, ALICE, incidents, SLA, customer success, and implementation metrics.
- Empty-state local runtime posture exists when Supabase service persistence is unavailable.

Status:

- Implemented: PASS
- Integrated: PASS
- Validated: PASS
- Certified: WARN

Gap:

- Surfaces compile and read tables, but pilot certification requires non-empty live data and data lineage proof per metric.

Pilot Test:

1. Seed or generate live pilot events.
2. Verify each dashboard metric can be traced to source rows.
3. Document metric lineage for sales proof.

## Path 10 - ALICE

Flow: Recommendation -> Traceability -> Outcome -> Evidence

Evidence Found:

- `alice_decisions`, `alice_recommendations`, `alice_reasoning`, `alice_outcomes`, and `alice_confidence` exist.
- `lib/alice/traceability-engine.ts` persists decisions, reasoning, confidence, optional outcome, and ALICE evidence.
- `/internal/alice-traceability` exists.

Status:

- Implemented: PASS
- Integrated: WARN
- Validated: WARN
- Certified: FAIL

Gap:

- Trace persistence helper exists, but not every ALICE recommendation path is proven to call it.
- Outcome verification against revenue/workflow evidence is not certified.

Pilot Test:

1. Generate ALICE recommendation from real practice data.
2. Persist decision, reasoning, confidence, and recommendation.
3. Execute recommended action.
4. Persist outcome and link it to evidence and revenue attribution.

## Highest-Risk Missing Proof

| Gap | Severity | Why It Matters | Required Proof |
| --- | --- | --- | --- |
| Stripe live billing and webhook completion | Critical | Revenue cannot be certified without payment completion. | Paid setup fee and patient payment with transaction + attribution rows. |
| Real Open Dental validation | Critical | Dental value depends on PMS data quality. | Patient, appointment, provider, treatment sync from real/sandbox Open Dental. |
| WhatsApp/SMS/email delivery receipts | High | Communication OS is not proven until delivery is proven. | Provider receipts, failures, opt-outs, evidence rows. |
| Evidence population automation | Critical | Dashboards and certification need real proof, not empty schema. | Workflow-to-evidence lineage for every critical event type. |
| Revenue attribution population | Critical | Sales proof depends on attributed revenue. | Payment/workflow/treatment attribution records tied to revenue evidence. |
| ALICE trace persistence coverage | High | AI claims require reasoning/outcome traceability. | Mandatory trace writes for recommendation paths and verified outcomes. |

## Recommended Pilot Certification Plan

Phase 1: Live Funnel

- Run a real ROI assessment submission.
- Verify lead, ROI, audit, Agency CRM, and email handoff.

Phase 2: Closed-Won Client

- Create proposal and contract.
- Collect Stripe setup fee.
- Auto-create implementation project.

Phase 3: Practice Data

- Connect Open Dental.
- Sync patients, appointments, providers, and treatments.
- Validate data quality and tenant isolation.

Phase 4: Revenue Workflow

- Send one real communication sequence.
- Run one recall or treatment recovery workflow.
- Capture treatment acceptance and payment.

Phase 5: Proof Layer

- Verify evidence rows, revenue attribution, ALICE trace, Executive Center, Customer Success, Agency CRM, and Mission Control all reflect the same event chain.

## Go / No-Go Recommendation

Recommendation: CONDITIONAL GO for pilot, NO-GO for broad production launch.

Rationale:

- Platform architecture is mature.
- Internal operating surfaces are broad and compile cleanly.
- The remaining blocker is real-world certification data.
- Do not build more framework layers until the pilot proves lead-to-payment-to-evidence-to-executive visibility.

Next milestone: one dental pilot practice with a complete evidence packet showing assessment, signed client, Open Dental sync, communication delivery, treatment/payment flow, revenue attribution, ALICE traceability, and executive visibility.

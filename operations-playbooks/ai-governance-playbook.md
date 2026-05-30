# AI Governance Playbook
## Zenith AI Dental Platform — ALICE Governance Guide v1.0

**Owner:** AI Operations Manager  
**Review Cadence:** Monthly  
**Last Updated:** 2026-05-30

---

## Overview

ALICE (AI Lifecycle Intelligence and Coordination Engine) is the AI layer of Zenith. She monitors all workflow activity, patient data signals, and platform health across tenant accounts, then surfaces recommendations for the operations team and for practice administrators. ALICE does not act unilaterally — her interventions are governed by the `agent-governance.ts` module, which enforces approval requirements, trust score thresholds, and confidence minimums.

This playbook defines how the AI Operations Manager (and authorized operators) govern ALICE: approving interventions, managing trust, handling failures, and determining when model changes are warranted.

---

## ALICE System Architecture

ALICE operates across three layers:

1. **Insight Layer** — `lib/ai-os/alice.ts` — Generates recommendations based on workflow analytics, health scores, and patient data patterns.
2. **Intervention Layer** — `lib/ai-os/agent-governance.ts` — Evaluates whether a recommended intervention is allowed, requires approval, or is blocked.
3. **Coordination Layer** — `lib/ai-os/agent-coordinator.ts` — Orchestrates multi-agent execution when ALICE is running complex recovery plans.

ALICE is observable via:
- `/api/alice/insights` — current recommendations
- `/api/alice/orchestration` — active orchestration plans
- `/api/alice/forecast` — predictive outputs
- Mission Control `aiHealth` panel — aggregate AI health metrics

---

## Intervention Types and Approval Requirements

From `lib/ai-os/agent-governance.ts`, interventions fall into two categories:

### Auto-Approvable (no operator action required)

| Type | Condition for Auto-Approval |
|---|---|
| `recommend` | Confidence ≥ 0.8 AND trust score ≥ 75 |
| `resume` | Confidence ≥ 0.8 AND trust score ≥ 75 |
| `optimize` | Confidence ≥ 0.8 AND trust score ≥ 75 |

These interventions carry low risk. ALICE can execute them autonomously when confidence and trust thresholds are met.

### Always Require Operator Approval

These intervention types are in the `APPROVAL_REQUIRED` set regardless of confidence or trust score:

| Type | Risk Rationale |
|---|---|
| `pause` | Stopping a workflow interrupts patient outreach — must be human decision |
| `replay` | Re-running a workflow could produce duplicate patient contacts |
| `escalate` | Escalating involves human-facing actions and must not be automated |
| `reroute` | Changing the workflow path for a patient case requires human accountability |

**Even at trust score 100 and confidence 1.0, these four types require operator approval.**

---

## Trust Score System

The governance trust score (0–100) represents the current reliability level of ALICE's decision-making. It is computed by `getGovernanceState()` in `lib/runtime/governance.ts`.

### Trust Score Thresholds

| Score Range | Meaning | ALICE Behavior |
|---|---|---|
| 80–100 | High trust | Auto-approvable interventions proceed autonomously |
| 75–79 | Moderate trust | Auto-approvable interventions proceed; operator notified |
| 60–74 | Low trust | All interventions require operator approval |
| < 60 | Critical | All interventions blocked; operator must manually evaluate each case |

### Trust Score Interpretation

The trust score is affected by:
- Proportion of ALICE recommendations accepted vs. rejected by operators
- Rate of governance policy violations
- Outcome accuracy: did accepted recommendations produce the expected results?
- Pending approval queue depth

### Trust Score Management

**If trust score drops below 75:**
1. Review the governance approval queue — are there many rejections? For what reason?
2. Check if a recent model update or data drift event caused degraded recommendation quality.
3. Do not manually override the trust score — resolve the underlying quality issue first.

**If trust score drops below 60:**
1. Escalate to Founder immediately.
2. All ALICE interventions are now blocked — notify the CSM team that AI recommendations require manual override.
3. Activate the AI Failure Incident Response procedure (see below).

---

## Intervention Approval Process

When ALICE proposes an intervention that requires approval, it enters the operator approval queue. The AI Operations Manager is responsible for processing this queue.

### Queue Monitoring

```bash
GET /api/autonomous/approvals
# Returns pending approval requests with: workflowId, interventionType, confidence, reason, proposedAt
```

Also visible in Mission Control: `aiHealth.recoveryPlansAvailable` and `governanceTrustScore`.

### Processing an Approval Request

For each pending intervention:

1. **Read the intervention request.** Note: workflow ID, intervention type, ALICE's stated reason, and confidence score.

2. **Review context.** Pull the relevant workflow's current state and recent execution history. Does ALICE's reasoning align with observable data?

3. **Assess risk.** Apply the operator's judgment:
   - `pause`: Is there a real reason to stop this workflow? Is the practice aware?
   - `replay`: Will re-running this produce duplicate patient contacts? Has the root cause been resolved?
   - `escalate`: Is this the right time and recipient for escalation?
   - `reroute`: Does the proposed alternative path make sense for this patient case?

4. **Approve or Reject.**
   ```bash
   POST /api/autonomous/approvals
   {
     "requestId": "<approval_request_id>",
     "decision": "approve",          // or "reject"
     "operatorId": "<your_user_id>",
     "notes": "Root cause resolved — replay approved."
   }
   ```

5. **Log the decision.** All approval decisions are recorded in `runtime_governance_decisions`. The audit trail is immutable.

**SLA for approval processing:**
- P1 interventions (patient-impacting): < 1 hour
- P2 interventions (operational): < 4 hours
- P3 interventions (optimization): < 24 hours

---

## Feedback Loop Management

ALICE learns from operator feedback. Every approval or rejection is a training signal. Managing this loop is the AI Operations Manager's ongoing responsibility.

### Feedback Quality Principles

- **Approve when ALICE is right.** Do not approve interventions you disagree with just to avoid the queue. False positives degrade the feedback signal.
- **Reject with notes.** When rejecting, always fill in the `notes` field explaining why. Vague rejections pollute the feedback loop.
- **Review acceptance rate weekly.** Pull from `runtime_governance_decisions`:

```sql
SELECT
  COUNT(*) FILTER (WHERE decision = 'approve') AS approved,
  COUNT(*) FILTER (WHERE decision = 'reject') AS rejected,
  COUNT(*) AS total
FROM runtime_governance_decisions
WHERE created_at > NOW() - INTERVAL '7 days';
```

**Target acceptance rate: 70–85%.** Below 70% means ALICE is producing low-quality recommendations. Above 85% may mean operators are rubber-stamping without reviewing.

### Agent Learning System

ALICE's learning pipeline is managed by `lib/ai-os/agent-learning.ts`. Feedback flows:
1. Operator approval/rejection recorded in `runtime_governance_decisions`
2. Agent learning module ingests decisions and adjusts recommendation patterns
3. Trust score recalculated based on outcome accuracy

The AI Operations Manager reviews the agent learning outputs monthly to confirm the feedback loop is improving recommendation quality, not degrading it.

---

## Model Retraining Triggers

Significant changes to ALICE's recommendation model require a formal retraining decision. Triggers:

### Mandatory Retraining Triggers

| Trigger | Threshold | Action |
|---|---|---|
| Sustained low acceptance rate | < 60% for 2 consecutive weeks | Pause auto-interventions; investigate |
| Trust score < 50 for > 48 hours | — | Founder approval required for model changes |
| Post-mortem identifies AI as root cause of P0/P1 | — | Immediate review and retraining |
| Platform schema change affects ALICE data sources | — | Validate grounding surfaces before resuming |
| New workflow domain added | — | ALICE grounding surfaces must be updated |

### Retraining Process

1. **Document the trigger.** Log in the AI Operations Manager's governance record.
2. **Pause approval queue.** Do not process new approvals while investigating the quality issue.
3. **Root cause analysis.** Is the issue data quality, grounding surface staleness, a schema change, or a model drift issue?
4. **Remediation.** Update grounding surfaces in `aliceGroundingSurfaces[]` in affected blueprints, or adjust the learning parameters in `agent-learning.ts`.
5. **Validation.** Run ALICE against a test dataset and compare recommendation quality before and after.
6. **Re-enable approval queue.** Only after validation confirms improvement.
7. **Notify Founder.** All model changes require Founder awareness before production deployment.

---

## Incident Response for AI Failures

### What Qualifies as an AI Failure

- ALICE producing recommendations that conflict with patient safety (e.g., recommending contacting a recently-deceased patient)
- ALICE recommendations causing duplicate patient contacts at scale
- ALICE approval queue growing unprocessed for > 4 hours
- ALICE chat (`/api/alice/chat`) returning incorrect information to a practice admin

### Response Steps

1. **Immediately pause ALICE's auto-approvable interventions.** Set governance trust score enforcement to require manual approval for all types (temporary override — document in governance log).

2. **Assess scope.** How many tenants affected? What types of interventions were impacted? Were any patient-facing actions taken incorrectly?

3. **Patient impact assessment.** If any incorrect patient contacts occurred (e.g., duplicate recall emails, incorrect billing follow-up), notify the affected tenant's CSM within 1 hour. The CSM contacts the practice admin.

4. **Escalate to Founder** if any of the following:
   - Patient safety concern
   - HIPAA-regulated data may have been used incorrectly
   - > 3 tenants affected
   - Root cause is not identified within 2 hours

5. **Rollback mechanism.** If a recent code change to `agent-governance.ts`, `agent-learning.ts`, or `alice.ts` caused the failure, revert the change. Deploy requires Founder approval.

6. **Post-mortem.** Same process as platform incidents — 24-hour draft, reviewed by Founder within 72 hours.

---

## AI Governance Audit Schedule

| Activity | Frequency | Owner |
|---|---|---|
| Review pending approval queue | Daily | AI Operations Manager |
| Review acceptance rate trends | Weekly | AI Operations Manager |
| Review trust score trends | Weekly | AI Operations Manager |
| Agent learning output review | Monthly | AI Operations Manager + Founder |
| Full AI governance audit | Quarterly | AI Operations Manager + Founder |
| Model retraining assessment | Quarterly or on trigger | AI Operations Manager |

All audit findings are documented in the AI Operations Manager's governance log and shared with the Founder at the monthly operations review.

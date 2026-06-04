# Compliance Agent

## Overview

The Compliance Agent is the platform's automated HIPAA and operational compliance monitor. It continuously audits the platform's communication practices, consent coverage, workflow execution health, and audit trail completeness to ensure the practice maintains regulatory compliance and audit readiness.

**Agent Key:** `compliance`

---

## Responsibilities

1. Monitor patient communication consent coverage
2. Audit Automation Platform execution health and failure rates
3. Verify avatar consent for Digital Dentist Twin usage
4. Track opt-out compliance across all communication channels
5. Monitor audit trail completeness
6. Compute audit readiness score
7. Alert ALICE when compliance thresholds are breached

---

## HIPAA Monitoring Scope

### Patient Communication Consent

```
Consent Coverage Check (runs daily):

  1. Count patients receiving SMS with sms_opt_in = false
     → VIOLATION: Communications sent without consent

  2. Count patients receiving email with email_opt_in = false
     → VIOLATION: Communications sent without consent

  3. Count patients with avatar video sent without consent record
     → WARNING: No consent documentation for video likeness usage

  4. Compute coverage_rate = consented_patients / total_contacted_patients
     IF coverage_rate < 0.95: → ALERT
     IF coverage_rate < 0.85: → CRITICAL VIOLATION
```

**Note:** `consent_records` table is not yet created (gap item). Compliance Agent currently reads consent flags from `patient_influence_scores.communication_preferences`. Full HIPAA consent audit requires the dedicated `consent_records` table.

---

## Workflow Audit Health

Monitors `workflow_executions` for compliance-relevant patterns:

```
Workflow Compliance Checks:

  1. Failed execution rate
     IF failures > 5% of executions in 24h window: → ALERT

  2. Dead letter queue depth
     IF dead_letters > 10: → WARNING (unprocessed sensitive events)

  3. Audit trail completeness
     All executions should have: started_at, completed_at, status, output
     Missing fields → INCOMPLETE AUDIT TRAIL alert

  4. Replay governance
     Verify replayed workflows have approval records
     Unauthorized replays → GOVERNANCE VIOLATION
```

---

## Communication Compliance

### Opt-Out Tracking

```
Opt-Out Compliance Rules:
  1. Opt-out requests must be processed within 24 hours
  2. Opted-out patients must receive no further communications
  3. Opt-out records must be preserved (cannot be deleted)

Compliance Agent monitors:
  - New opt-out events in the last 24 hours
  - Patients who opted out but were still contacted after opt-out
  - Opt-out processing latency
```

### Channel-Specific Rules

| Channel     | Consent Required | Opt-Out Processing | Regulation    |
|-------------|------------------|--------------------|---------------|
| SMS         | Yes (explicit)   | Within 24 hours    | TCPA          |
| Email       | Yes (implied OK) | Within 10 days     | CAN-SPAM      |
| Voice       | Yes (for AI)     | Immediate          | TCPA, FTC     |
| WhatsApp    | Yes (explicit)   | Immediate          | Meta ToS      |
| Video       | Yes (HIPAA + consent) | Immediate     | HIPAA         |

---

## Avatar Consent Verification

For Digital Dentist Twin usage:
- Provider must sign a consent agreement for avatar creation
- Patients must consent to receiving AI-generated video communications
- Compliance Agent verifies consent records exist for active avatars
- Flags any avatar with `status = "ready"` but no corresponding consent record

---

## Audit Readiness Scoring

```
audit_readiness_score (0–100) computed from:

  consent_coverage_score    × 0.30  (are patients properly consented?)
  workflow_audit_score      × 0.25  (are workflow executions fully logged?)
  opt_out_compliance_score  × 0.25  (are opt-outs processed correctly?)
  data_access_audit_score   × 0.10  (are data access events logged?)
  retention_policy_score    × 0.10  (are records retained per policy?)

Thresholds:
  90–100: Audit ready — no action required
  75–89:  Minor gaps — remediation recommended
  60–74:  Significant gaps — remediation required before audit
  < 60:   Critical — do not schedule audit, immediate remediation
```

---

## Alert Levels

| Level     | Condition                                 | Action                              |
|-----------|-------------------------------------------|-------------------------------------|
| INFO      | Compliance score 90+, minor notes         | Log only                            |
| WARNING   | Score 75–89 or specific pattern breach    | Executive Dashboard notification        |
| ALERT     | Score 60–74 or active violation           | ALICE escalation + practice manager |
| CRITICAL  | Score < 60 or active HIPAA violation      | Immediate practice owner alert      |

---

## Compliance Recommendations

| Recommendation Type              | Trigger                                     |
|----------------------------------|---------------------------------------------|
| `consent_coverage_gap`           | consent_coverage < 95%                      |
| `opt_out_processing_delay`       | Opt-outs not processed within 24h           |
| `workflow_audit_incomplete`      | Missing execution records                   |
| `avatar_consent_missing`         | Active avatar without consent documentation |
| `dead_letter_accumulation`       | Dead letter queue > 10 items                |
| `audit_readiness_below_threshold`| audit_readiness_score < 75                  |

---

## ALICE Integration

Compliance Agent reports to ALICE:
- Daily audit readiness score
- Active compliance violations (if any)
- Trend: consent coverage over time
- Workflow health from compliance perspective (different from operational health)

ALICE surfaces compliance status in Executive Dashboard with color-coded indicators.

---

## Compliance Dashboard (Executive Dashboard)

Compliance Agent feeds the Compliance panel in Executive Dashboard:
- Audit Readiness Score (gauge)
- Consent Coverage Rate (%)
- Open Violations (count)
- Opt-Out Queue (unprocessed requests)
- Workflow Audit Health (% complete)
- Last Compliance Report (date + score)

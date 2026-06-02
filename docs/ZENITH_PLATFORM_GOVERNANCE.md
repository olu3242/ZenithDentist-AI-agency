# ZenithDentist Platform Governance

**Version:** 1.0  
**Status:** Active  
**Last Updated:** 2026-06-02  

---

## 1. Purpose

This document establishes the governance framework for the ZenithDentist AI platform — defining ownership, decision rights, change management processes, quality gates, and compliance obligations.

---

## 2. Governance Principles

1. **Tenant Isolation First** — No cross-tenant data access under any circumstance.
2. **Immutable Audit Trail** — Every AI decision and platform action is logged and non-repudiable.
3. **PHI Boundary Enforcement** — Patient PHI never enters the platform; only `patient_external_id` is used.
4. **Layered Ownership** — Each platform layer has a designated owner accountable for its correctness.
5. **Canonical Spec Authority** — Architecture documents in `docs/` are the source of truth; implementation must conform.

---

## 3. Organizational Roles

| Role | Responsibility |
|------|---------------|
| Platform Architect | Owns canonical architecture specs, approves structural changes |
| ALICE Product Owner | Owns AI decision logic, model selection, fallback policies |
| Data Governor | Owns schema migrations, RLS policies, PHI boundary |
| Security Officer | Owns auth, RLS audits, HIPAA compliance posture |
| Growth OS Owner | Owns Growth Score model, dimension weights, calibration |
| Operations Lead | Owns SLAs, incident response, on-call rotations |
| Customer Success Lead | Owns pilot onboarding, client certification, success metrics |

---

## 4. Change Management

### 4.1 Change Categories

| Category | Example | Required Approvals |
|----------|---------|-------------------|
| Schema Migration | Add/drop column, new table | Data Governor + Platform Architect |
| AI Model Change | New ALICE model version | ALICE Product Owner + Security Officer |
| RLS Policy Change | New row-level security rule | Data Governor + Security Officer |
| Growth Score Recalibration | Weight adjustment | Growth OS Owner + Platform Architect |
| Portal Access Gate Change | New access condition | Platform Architect + Security Officer |
| Event Schema Change | New field in event payload | Platform Architect |

### 4.2 Change Process

1. **Proposal** — Author creates a documented change proposal referencing the affected canonical spec.
2. **Review** — Required approvers review within 2 business days.
3. **Approval** — All required approvers must approve; any rejection blocks the change.
4. **Implementation** — Change implemented behind a feature flag where possible.
5. **Validation** — Automated tests and manual review confirm correctness.
6. **Documentation Update** — Affected canonical specs updated before merge.
7. **Audit Log** — Change recorded in platform audit trail.

---

## 5. Quality Gates

### 5.1 Pre-Deployment Gates

| Gate | Criteria |
|------|---------|
| Test Coverage | All new logic covered by unit + integration tests |
| RLS Validation | New tables verified to have correct RLS policies |
| Schema Migration | Migration script tested on staging, rollback script provided |
| Event Dual-Write | New events verified to write to both event tables |
| PHI Scan | No PHI present in any new platform tables or logs |
| Canonical Spec | Affected spec docs updated |

### 5.2 Post-Deployment Monitoring

| Metric | Threshold | Action |
|--------|-----------|--------|
| ALICE decision latency | p99 < 2s | Page on-call if exceeded |
| Event processing lag | < 30s | Alert if exceeded |
| Growth Score staleness | < 24h | Alert if exceeded |
| Failed workflow ratio | < 1% | Alert if exceeded |
| Portal access errors | < 0.1% | Immediate investigation |

---

## 6. Data Governance

### 6.1 Tenant Isolation Rules

- Every table MUST have `organization_id UUID NOT NULL`.
- RLS policies MUST enforce `organization_id = auth.jwt()->>'organization_id'`.
- Service-role queries bypass RLS; only used in server-side contexts with explicit justification.
- Cross-tenant queries are prohibited except in anonymized aggregate analytics.

### 6.2 PHI Boundary

The platform operates entirely with `patient_external_id` as the patient reference. The PMS is the sole system of record for PHI. The platform must not:

- Store patient name, DOB, SSN, or contact info
- Log PHI in application logs or event payloads
- Transmit PHI to any third-party service

### 6.3 Retention Policies

| Data Type | Retention |
|-----------|-----------|
| Event Fabric events | 7 years |
| ALICE decision logs | 7 years |
| Audit trail | 7 years |
| Growth scores | 3 years |
| Journey assignments (closed) | 2 years |
| Practice memory records | Indefinite (practice asset) |

---

## 7. AI Governance

### 7.1 ALICE Decision Standards

- Every ALICE decision MUST be written to `alice_patient_decisions` with full rationale.
- Decisions MUST include confidence score and the data inputs used.
- Rule-based fallback MUST be available for every AI-path decision.
- Model changes require ALICE Product Owner approval and a 2-week shadow mode validation.

### 7.2 Model Selection Policy

| Path | Model | Use Case |
|------|-------|---------|
| Primary | claude-haiku-4-5-20251001 | Real-time patient decisions |
| Fallback | Rule-based engine | AI unavailable or low confidence |
| Batch | Scheduled re-scoring | Nightly Growth Score updates |

### 7.3 AI Audit Requirements

- All AI decisions must be explainable to practice staff.
- ALICE must provide a human-readable rationale for every recommendation.
- Practices may request a full audit trail of AI decisions affecting their patients.

---

## 8. Incident Management

### 8.1 Severity Definitions

| Severity | Definition | Response SLA |
|----------|-----------|--------------|
| P0 | Platform down, data integrity risk | 15 minutes |
| P1 | Core feature unavailable, portal inaccessible | 1 hour |
| P2 | Degraded performance, non-critical feature failure | 4 hours |
| P3 | Minor issue, cosmetic defect | Next business day |

### 8.2 Escalation Path

P0/P1 → Operations Lead → Platform Architect → Executive escalation if unresolved in SLA.

---

## 9. Compliance Obligations

| Regulation | Obligation |
|------------|-----------|
| HIPAA | PHI boundary enforcement, audit trail, BAA with service providers |
| SOC 2 | Access controls, audit logging, change management |
| GDPR (if applicable) | Data subject rights, retention limits, cross-border transfer rules |

---

## 10. Governance Review Cadence

| Review | Frequency | Owner |
|--------|-----------|-------|
| Architecture Review | Quarterly | Platform Architect |
| AI Governance Review | Monthly | ALICE Product Owner |
| Security Audit | Semi-annually | Security Officer |
| Data Governance Review | Quarterly | Data Governor |
| Growth Score Calibration | Quarterly | Growth OS Owner |

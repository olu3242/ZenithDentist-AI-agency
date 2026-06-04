# Platform Certification Framework

**Version:** 1.0  
**Status:** Active  
**Last Updated:** 2026-06-02  

---

## 1. Purpose

This document defines the ZenithDentist Platform Certification Framework — the structured process for certifying that the platform, individual components, and client deployments meet the quality, security, and operational standards required for production use.

---

## 2. Certification Types

| Certification Type | Scope | Frequency |
|-------------------|-------|-----------|
| Platform Release Certification | Full platform before major release | Per release |
| Component Certification | Individual module/engine | Per significant change |
| Practice Go-Live Certification | New practice before activation | Per new client |
| Security Certification | Auth, RLS, PHI boundary | Semi-annually |
| AI Governance Certification | ALICE, DDT, scoring models | Quarterly |
| Operational Certification | SLAs, incident response, monitoring | Quarterly |

---

## 3. Platform Release Certification

### 3.1 Required Gates

All gates must pass before a platform release is certified:

| Gate | Criteria | Owner |
|------|---------|-------|
| Schema Migration Verified | All migrations tested on staging, rollback scripts ready | Data Governor |
| RLS Policies Validated | All tables have correct org-isolation policies | Security Officer |
| PHI Scan Clean | No PHI detected in any tables or logs | Security Officer |
| Event Dual-Write Verified | All new events write to both event tables | Platform Architect |
| Workflow OS Coverage | All new workflows have all 8 components implemented | Platform Architect |
| Test Suite Green | All unit + integration tests passing | Engineering |
| Performance Benchmarks | p99 latency within SLA for all critical paths | Engineering |
| Growth Score Validated | Score computation matches spec for test fixtures | Growth OS Owner |
| ALICE Decision Audit | Sample of ALICE decisions reviewed for quality | ALICE Product Owner |
| Canonical Docs Updated | All affected spec docs updated | Platform Architect |

### 3.2 Certification Sign-Off

| Approver | Role | Required For |
|---------|------|-------------|
| Platform Architect | Architecture integrity | All releases |
| Security Officer | Security posture | All releases |
| Data Governor | Schema and data integrity | Schema-touching releases |
| ALICE Product Owner | AI quality | AI-touching releases |
| Operations Lead | Operational readiness | All releases |

---

## 4. Component Certification

### 4.1 Standard Component Checklist

| Item | Description |
|------|-------------|
| Spec Document | Canonical spec exists and is current |
| Data Model | Tables documented with schema and indexes |
| RLS Policies | Row-level security verified for all tables |
| Event Emissions | All events documented and tested |
| Workflow Integration | Workflow OS integration tested (all 8 components) |
| ALICE Integration | Decision consumption tested if applicable |
| Growth Score Integration | Dimension contribution tested if applicable |
| Performance Test | Load test at 10× expected volume |
| Error Handling | All error paths handled and logged |
| Audit Trail | All actions auditable |

### 4.2 Component Certification Status

| Component | Status | Last Certified |
|-----------|--------|---------------|
| Recall Engine | — | — |
| Membership Engine | — | — |
| Referral Engine | — | — |
| Reputation Engine | — | — |
| Treatment Intelligence | — | — |
| New Patient Acquisition | — | — |
| ALICE Decision Engine | — | — |
| Patient Influence Engine | — | — |
| Practice Memory Graph | — | — |
| Digital Dentist Twin | — | — |
| Workflow OS | — | — |
| Event Fabric | — | — |
| Mission Control | — | — |
| Patient Portal | — | — |
| Revenue Attribution | — | — |

---

## 5. Practice Go-Live Certification

### 5.1 Pre-Activation Checklist

Before any new practice goes live, ALL items must be verified:

**Access Gates:**
- [ ] Contract signed
- [ ] Setup fee paid
- [ ] Approved for access by agency admin
- [ ] Subscription active

**Configuration:**
- [ ] Organization record created with correct metadata
- [ ] PMS integration connected and sync verified
- [ ] At least 1 patient record synced successfully
- [ ] Growth Score initial computation complete

**Digital Dentist Twin (if contracted):**
- [ ] Avatar approved by dentist
- [ ] Voice profile created and approved
- [ ] Minimum 3 script templates approved
- [ ] Test video approved
- [ ] Patient consent flow active

**Mission Control:**
- [ ] Practice admin user account created
- [ ] Dashboard access verified
- [ ] Notification preferences configured

**Engines:**
- [ ] Recall Engine configured and first workflow scheduled
- [ ] Membership Engine configured (if contracted)
- [ ] Referral Engine configured (if contracted)

**Security:**
- [ ] RLS policies active for organization
- [ ] Admin user verified with correct role
- [ ] Test: confirm no cross-tenant data visible

**Operational:**
- [ ] Onboarding checklist complete in CRM
- [ ] Customer Success contact assigned
- [ ] First check-in call scheduled (7 days post go-live)

### 5.2 Go-Live Authorization

| Authorizer | Minimum Role |
|-----------|-------------|
| Technical sign-off | Agency Admin or Platform Engineer |
| Business sign-off | Customer Success Lead |

---

## 6. Security Certification

Conducted semi-annually:

| Area | Test |
|------|------|
| Authentication | JWT validation, token expiry, refresh flow |
| RLS Policies | Cross-tenant query attempt (must fail) |
| PHI Boundary | Automated scan of all tables for PHI patterns |
| Service Role Usage | Audit all service_role query points |
| API Authorization | All endpoints require valid JWT |
| Audit Log Integrity | Verify audit log is append-only and tamper-proof |
| DLQ Access | Verify DLQ access restricted to authorized roles |

---

## 7. AI Governance Certification

Conducted quarterly:

| Area | Test |
|------|------|
| ALICE Decision Quality | Sample 100 decisions; review rationale accuracy |
| Confidence Distribution | Verify < 10% decisions below 0.60 confidence |
| Fallback Rate | Verify AI path is primary (fallback < 15%) |
| Decision Latency | p99 < 2 seconds |
| Audit Trail Completeness | 100% of decisions have `input_snapshot` |
| PHI in Decisions | Automated scan of decision payloads for PHI |
| Model Version Current | Confirm production model version is approved version |

---

## 8. Operational Certification

Conducted quarterly:

| Area | Standard |
|------|---------|
| SLA Review | P0 response < 15 min achieved in last quarter |
| Monitoring Coverage | All critical paths have alerts configured |
| DLQ Health | DLQ cleared or classified within 7 days |
| Runbook Currency | All runbooks updated within 6 months |
| Incident Review | All P0/P1 incidents have post-mortems |
| Backup Verification | Backup restoration tested |
| Capacity Planning | 3-month capacity forecast reviewed |

---

## 9. Certification Records

All certification results are stored as immutable records with:
- Certification type and date
- All gate results (pass/fail)
- Approver signatures (user IDs + timestamps)
- Any exceptions granted with justification
- Next certification due date

Certification records are available in Mission Control → Platform Certification Center.

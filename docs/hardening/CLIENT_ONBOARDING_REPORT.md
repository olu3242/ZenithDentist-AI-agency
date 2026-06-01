# Client Onboarding Report

**Sprint:** Batch 4 — Pilot Customer Operations
**Branch:** claude/determined-ramanujan-BsncJ
**Date:** 2026-05-31
**Report Type:** Executive Certification

---

## 1. Executive Summary

The ZenithDentist client onboarding system is built around a structured 9-stage implementation playbook defined in `lib/implementation-os/implementation-playbooks.ts`. Every new dental practice follows a deterministic sequence from contract signing through adoption review, with per-stage checklists, scorecard tracking, and a portfolio-level health view.

**Onboarding Readiness Score: 8.0/10**

---

## 2. Onboarding Engine Architecture

| File | Primary Functions |
|---|---|
| `lib/implementation-os/implementation-playbooks.ts` | `STANDARD_PLAYBOOK`, `getPlaybookForPlan()` |
| `lib/implementation-os/implementation-checklists.ts` | `IMPLEMENTATION_CHECKLIST`, `getChecklistForStage()`, `getRequiredChecklist()` |
| `lib/implementation-os/implementation-tracker.ts` | `getImplementationState()`, `advanceImplementationStage()` |
| `lib/implementation-os/implementation-scorecard.ts` | `computeImplementationScorecard()` |
| `lib/implementation-os/implementation-health.ts` | `getImplementationPortfolio()` |

---

## 3. 9-Stage Implementation Playbook

**Playbook ID:** `standard_dental_onboarding`
**Estimated Duration:** 14 days (Growth plan)

| # | Stage | Title | Owner | Est. Days | Blockers | Success Criteria |
|---|---|---|---|---|---|---|
| 1 | `contract_signed` | Welcome email + credentials delivered | Zenith (auto) | 0 | — | Practice admin logged in |
| 2 | `kickoff_scheduled` | Kickoff call scheduled | Joint | 2 | Calendar access | Kickoff completed, goals documented |
| 3 | `practice_setup` | Organization profile configured | Practice | 1 | — | Profile complete in portal |
| 4 | `integration_setup` | PMS integration connected | Joint | 3 | PMS credentials, IT access | First sync completed, patient records visible |
| 5 | `integration_setup` | Google + Phone connected | Joint | 2 | Google Manager access, phone API | Calendar sync active, call tracking live |
| 6 | `workflow_activation` | Core workflows activated | Zenith | 2 | Integration complete | Recalls, reminders, reviews running |
| 7 | `staff_training` | Staff portal walkthrough | Joint | 2 | Staff availability | All staff can log in and use portal |
| 8 | `roi_baseline` | ROI baseline captured | Zenith | 1 | PMS data flowing | ALICE baseline report generated |
| 9 | `go_live` / `adoption_review` | Full activation + 30-day review | Joint | 1 / Day 30 | Health score ≥ 75 | All workflows running, scorecard reviewed |

---

## 4. Practice Information Collection

### 4.1 Access Requirements

| Access Type | Options | Impact |
|---|---|---|
| PMS System | OpenDental, Dentrix, Eaglesoft, Carestream | Required for patient data sync |
| Google Business Profile | Manager access | Required for review automation |
| Phone Provider | RingCentral, Vonage, Dialpad | Required for missed call recovery |
| Email Provider | Gmail, Outlook, practice email | Required for communication workflows |
| Calendar System | Google Calendar, Outlook | Required for booking workflows |

### 4.2 Access Readiness Score

Access readiness = (granted integrations / 5) × 100

| Score | Readiness |
|---|---|
| 100% | Full deployment possible |
| 80% | Core workflows deploy; some features deferred |
| 60% | Basic deployment only; significant feature gaps |
| < 60% | Kickoff should be delayed |

---

## 5. Plan-Based Go-Live Timelines

| Plan | Seat Limit | Target Go-Live | Deployment Complexity |
|---|---|---|---|
| starter | 3 | 14 days | Low — single location, core workflows only |
| growth | 10 | 21 days | Medium — multi-location, full workflow suite |
| enterprise | 999 | 30 days | High — custom integrations, advanced analytics |

---

## 6. Database Persistence

Onboarding state is tracked via `implementation-tracker.ts` which reads/writes to the `implementation_states` or equivalent table, tracking:
- `currentStage`: active `PlaybookStage` value
- `completedSteps`: array of completed step IDs (e.g., `["s1", "s2", "s3"]`)
- `completionPercent`: 0–100
- `blockers`: active blockers preventing stage advancement

`computeImplementationScorecard()` writes to DB via `implementation-scorecard.ts`, scoring 5 dimensions:
- `practiceSetup` (20%) — `completionPercent ≥ 30%`
- `integrationsConnected` (25%) — active marketplace extensions
- `workflowsActivated` (30%) — workflow states beyond registered
- `staffTrained` (15%) — step `s8` completed
- `dataFlowing` (10%) — active workflow executions

---

## 7. Onboarding Dashboard

`getImplementationPortfolio()` in `lib/implementation-os/implementation-health.ts` provides:
- All active implementations by stage
- Aggregate health metrics across portfolio
- Blocked implementations requiring attention
- Days-in-stage tracking for SLA monitoring

---

## 8. Gaps and Risks

| Gap | Severity | Mitigation |
|---|---|---|
| No automated kickoff email trigger | Medium | Manual CS email until email automation connected |
| No Calendly/scheduling integration | Medium | Use manual calendar link in welcome email |
| No DocuSign/contract management | Medium | External contract management; track separately |
| No automated PMS credential validation | Medium | Manual verification during kickoff call |
| No in-app onboarding wizard | Low | Implementation specialist guides practice manually |
| `averageDaysToGoLive` returns null | Low | Computed from `leads.created_at`; needs go-live date tracking |

---

## 9. Readiness Score

| Dimension | Score |
|---|---|
| Playbook completeness | 9/10 |
| Access collection process | 8/10 |
| Checklist coverage | 9/10 |
| Tracker and state management | 8/10 |
| Scorecard accuracy | 8/10 |
| Portfolio visibility | 7/10 |
| **Overall** | **8.0/10** |

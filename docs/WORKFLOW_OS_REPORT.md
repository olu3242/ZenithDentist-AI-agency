# Automation Platform Report
**ZenithDentist AI — Automation Platform Canonical Automation Brain — Phase 12**
=======
# Workflow OS Report
**ZenithDentist AI — Workflow OS Canonical Automation Brain — Phase 12**
**Date:** 2026-06-03 | **Platform Version:** 12.0.0

---

## 1. Overview

Workflow OS is the **canonical automation brain** of the ZenithDentist AI platform. Every automated patient communication, journey orchestration, trigger evaluation, A/B test, and ROI calculation runs through Workflow OS. No other system implements its own automation engine — all automation capabilities are provided by Workflow OS.

Phase 12 extended Workflow OS with the Workflow Recovery layer (`lib/workflow-recovery/`), which adds self-healing capabilities on top of the existing `health-monitor.ts` and `recovery-engine.ts` modules.

---

## 2. Architecture

```
lib/workflow-os/ (11 files — canonical automation brain)
  ├── index.ts              ← Main entry point, journey orchestration
  ├── journey-engine.ts     ← 7 canonical patient journey implementations
  ├── health-monitor.ts     ← Workflow health scoring
  ├── recovery-engine.ts    ← Base recovery actions
  ├── event-publisher.ts    ← Event Fabric integration
  ├── metrics-collector.ts  ← Performance metrics aggregation
  ├── ab-testing.ts         ← A/B test engine for content optimization
  ├── personalization.ts    ← Patient segment personalization
  ├── analytics.ts          ← Journey analytics + reporting
  ├── automation-triggers.ts← Trigger evaluation + scheduling
  └── roi-calculator.ts     ← ROI calculation per journey type

        ↓ extended by (Phase 12)

lib/workflow-recovery/index.ts
  ← Adds recovery events, actions, metrics tables
  ← Extends health-monitor.ts with stability + reliability scoring
  ← Extends recovery-engine.ts with automated recovery actions
```

---

=======
## 3. lib/workflow-os/ — 11-File Function Inventory

### index.ts
| Function | Purpose |
|---|---|
| initiateJourney | Starts a patient journey of specified type |
| pauseJourney | Pauses an active journey |
| resumeJourney | Resumes a paused journey |
| completeJourney | Marks journey complete, fires completion event |
| getActiveJourneys | Returns all active journeys for a practice |
| getJourneyStatus | Returns current step and status for a journey |

### journey-engine.ts
| Function | Purpose |
|---|---|
| executeAppointmentJourney | Appointment prep + post-visit follow-up |
| executePostVisitJourney | Treatment summary + next steps |
| executeReviewJourney | Personalized review request sequence |
| executeReferralJourney | Referral video + incentive delivery |
| executeRecallJourney | Recall outreach for lapsed patients |
| executeTreatmentJourney | Treatment education video series |
| executeRecoveryJourney | Post-procedure check-in sequence |
| getNextJourneyStep | Determines next step based on patient response |
| evaluateJourneyBranch | A/B test-aware branching logic |

### health-monitor.ts
| Function | Purpose |
|---|---|
| getWorkflowHealth | Returns health score (0–100) for all workflows |
| getJourneyHealthScore | Per-journey-type health score |
| detectUnhealthyWorkflows | Returns list of workflows below health threshold |
| calculateFailureRate | Failure rate over configurable time window |
| getHealthTrend | Health score trend over past N days |

### recovery-engine.ts
| Function | Purpose |
|---|---|
| triggerRecovery | Initiates recovery for a failed workflow |
| executeRecoveryAction | Executes a specific recovery action type |
| validateRecovery | Post-recovery validation check |
| getRecoveryHistory | Returns past recovery events for a workflow |

### event-publisher.ts
| Function | Purpose |
|---|---|
| publishJourneyEvent | Publishes journey step events to Event Fabric |
| publishWorkflowAlert | Publishes health alerts to Event Fabric |
| publishROIEvent | Publishes ROI milestone events |

### metrics-collector.ts
| Function | Purpose |
|---|---|
| collectJourneyMetrics | Aggregates completion rates per journey type |
| collectDeliveryMetrics | SMS/email/video delivery success rates |
| collectEngagementMetrics | Open rates, click rates, response rates |
| getMetricsSummary | Returns dashboard-ready metrics summary |

### ab-testing.ts
| Function | Purpose |
|---|---|
| createABTest | Creates new A/B test for a content variant |
| assignVariant | Assigns patient to A or B variant |
| recordVariantOutcome | Records conversion/outcome for variant |
| selectWinner | Statistically selects winner when significance reached |
| getTestResults | Returns test performance for all active tests |

### personalization.ts
| Function | Purpose |
|---|---|
| getPatientSegment | Returns patient's segment (High/Medium/Low value) |
| personalizeContent | Selects content based on segment + history |
| getPersonalizationRules | Returns active personalization rules |
| updatePersonalizationModel | Updates rules based on engagement data |

### analytics.ts
| Function | Purpose |
|---|---|
| getJourneyAnalytics | Full analytics per journey type |
| getCompletionFunnel | Step-by-step completion funnel |
| getCohortAnalysis | Cohort performance over time |
| exportAnalyticsReport | Generates shareable analytics report |

### automation-triggers.ts
| Function | Purpose |
|---|---|
| evaluateTrigger | Checks if trigger conditions are met |
| scheduleTrigger | Queues trigger for future execution |
| cancelTrigger | Cancels a scheduled trigger |
| getActiveTriggers | Returns all active triggers for a practice |
| processTriggerQueue | Runs due triggers (called by cron) |

### roi-calculator.ts
| Function | Purpose |
|---|---|
| calculateJourneyROI | ROI for a specific journey type |
| calculatePlatformROI | Combined ROI across all journeys |
| attributeRevenue | Creates revenue attribution record |
| getROISummary | Dashboard-ready ROI summary |

---

## 4. 7 Canonical Patient Journeys

| Journey Type | Trigger | Steps | Avg Duration | Key Metric |
|---|---|---|---|---|
| Appointment | Appointment booked | Prep video → reminder → post-visit → follow-up | 7 days | Rebooking rate |
| Post-Visit | Appointment completed | Summary video → treatment follow-up → review request | 14 days | Review submission rate |
| Review | 14 days post-appointment | Review request video → reminder → thank you | 21 days | Review rate |
| Referral | High-influence score patient | Referral invite video → incentive → tracking | 30 days | Referral conversion rate |
| Recall | 6+ months since last visit | Recall video → SMS → call queue → close-lost | 60 days | Rebooking rate |
| Treatment | Open treatment plan | Education video series → follow-up → acceptance nudge | 30 days | Treatment acceptance rate |
| Recovery | Procedure completed | Day 1/3/7/14 check-in videos | 14 days | Response rate |

---

## 5. Canonical Commercial Workflow

Phase 12 added a commercial workflow that maps the full client acquisition lifecycle:

```
Lead → Discovery → Assessment → Proposal → Contract → Subscription → Onboarding → Success Monitoring
```

| Stage | Workflow OS Role | Triggers |
|---|---|---|
| Lead | Log practice as opportunity | Creates lead record in commercial_proposals |
| Discovery | Schedule discovery call | Calendar invite automation |
| Assessment | Run Digital Twin simulation | simulateRevenueTwin() + ROI report generation |
| Proposal | Generate + send proposal | createProposal() + sendProposal() + email via Resend |
| Contract | Contract execution | createContract() + signContract() |
| Subscription | Activate subscription | activateSubscription() + onboarding journey trigger |
| Onboarding | Practice onboarding sequence | 14-day onboarding automation sequence |
| Success Monitoring | Ongoing health monitoring | Weekly health check + ALICE briefing generation |

---

## 6. Workflow Recovery Integration

`lib/workflow-recovery/index.ts` extends Workflow OS:

| Recovery Function | Extends | Purpose |
|---|---|---|
| detectAndRecoverWorkflows | health-monitor.detectUnhealthyWorkflows | Auto-triggers recovery for unhealthy workflows |
| executeRecoveryAction | recovery-engine.executeRecoveryAction | 6 recovery action types (see below) |
| recordRecoveryEvent | NEW | Writes to workflow_recovery_events |
| recordRecoveryAction | NEW | Writes to workflow_recovery_actions |
| updateRecoveryMetrics | NEW | Updates workflow_recovery_metrics |
| calculateStabilityScore | Extends health-monitor | 30-day rolling stability (uptime × reliability) |
| calculateReliabilityScore | Extends metrics-collector | Success rate over last 100 executions |
| calculateMTTR | NEW | Mean Time To Recovery from recovery_events |

### 6 Recovery Action Types

| Action Type | Description | Auto-Trigger |
|---|---|---|
| retry_step | Retries the failed journey step | Yes (immediate) |
| skip_step | Skips non-critical failed step | Yes (after 2 retries) |
| reschedule_delivery | Reschedules failed delivery for +1 hour | Yes (delivery failure) |
| fallback_channel | Switches from video to SMS/email | Yes (HeyGen failure) |
| pause_journey | Pauses journey pending manual review | Yes (3+ consecutive failures) |
| escalate_to_human | Creates support ticket + notifies admin | Yes (critical severity) |

---

## 7. Workflow Health Metrics

| Metric | Formula | Target |
|---|---|---|
| Workflow Health Score | (1 - failure_rate) × 100 | >85 |
| Stability Score | (uptime_pct × reliability_score) / 100 | >90 |
| Reliability Score | successful_executions / total_executions × 100 | >95 |
| MTTR (minutes) | AVG(recovery_completed_at - failure_detected_at) | <15 min |
| Journey Completion Rate | completed_journeys / initiated_journeys × 100 | >70% |
| Delivery Success Rate | delivered_count / attempted_count × 100 | >98% |

---

## 8. API + Mission Control Integration

Workflow OS does not have a standalone API route. Its data surfaces through:

| Integration | Route | Data Exposed |
|---|---|---|
| Mission Control Journey Panel | /api/mission-control?view=journeys | Journey completion rates, active journeys |
| Mission Control Health Panel | /api/mission-control?view=health | Workflow health score, failure rates |
| Workflow Recovery API | /api/workflow-recovery | Recovery events, actions, metrics |
| Digital Twin | /api/digital-twin?view=workflow | Workflow twin snapshot |
| ALICE Executive | /api/alice/executive-briefing | Workflow health in intelligence score |

---

## 9. Workflow OS Governance

1. All automation must use Workflow OS — no ad-hoc automation in feature code
2. All journeys must be one of 7 canonical types — no custom journey types without Workflow OS extension
3. All delivery attempts must be logged via metrics-collector.ts
4. All failures must publish to Event Fabric via event-publisher.ts
5. Recovery must always attempt retry before escalation
6. A/B tests must reach statistical significance before selecting winner (p < 0.05)

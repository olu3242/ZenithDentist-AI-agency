# Mission Control Report
**ZenithDentist AI — Mission Control Executive Command Center — Phase 12**
**Date:** 2026-06-03 | **Platform Version:** 12.0.0

---

## 1. Overview

Mission Control is the **single executive command center** for the ZenithDentist AI platform. All operational data, intelligence outputs, commercial metrics, and system health indicators surface through Mission Control panels. There are no alternative dashboards — every system routes visibility through this layer.

Phase 12 added four new panels: Commercial OS Dashboard, Digital Twin Dashboard, ALICE Executive Briefing, and Workflow Recovery Center.

---

## 2. Design Principles

- **One namespace:** All panels exist under Mission Control — no parallel dashboards
- **Read-only view:** Mission Control displays; it does not execute operations directly
- **Event-driven updates:** All panels refresh from Event Fabric events, not polling
- **Role-based access:** Panel visibility controlled by practice role (admin, doctor, staff, executive)
- **War room mode:** Critical alerts trigger war room protocol visible across all panels

---

## 3. Complete Panel Inventory

### Revenue Panels

| Panel Name | Data Source | API Route | Refresh Cadence | Access Role |
|---|---|---|---|---|
| Revenue Dashboard | revenue_opportunities, revenue_attribution_records | /api/revenue-os?view=dashboard | 5 min | admin, executive |
| Revenue Pipeline | revenue_opportunities by stage | /api/revenue-os?view=pipeline | 5 min | admin, executive |
| Attribution Breakdown | revenue_attribution_records by source | /api/revenue-os?view=attribution | 15 min | admin |
| Recall Health | recall_tracking | /api/revenue-os?view=recall | 15 min | admin, staff |
| Treatment Acceptance | treatment_acceptance_predictions | /api/revenue-os?view=treatments | 15 min | admin, doctor |
| Revenue Forecasts | revenue_forecasts | /api/revenue-os?view=forecasts | Daily | admin, executive |

### Commercial Panels (New — Phase 12)

| Panel Name | Data Source | API Route | Refresh Cadence | Access Role |
|---|---|---|---|---|
| Commercial OS Dashboard | commercial_subscriptions, commercial_proposals | /api/commercial-os?view=dashboard | 5 min | executive, admin |
| Package Catalog | commercial_packages | /api/commercial-os?view=packages | On update | executive |
| Active Subscriptions | commercial_subscriptions | /api/commercial-os?view=subscriptions | 5 min | executive |
| Proposal Pipeline | commercial_proposals by stage | /api/commercial-os?view=proposals | 5 min | executive |

### Digital Twin Panels (New — Phase 12)

| Panel Name | Data Source | API Route | Refresh Cadence | Access Role |
|---|---|---|---|---|
| Practice Twin Dashboard | digital_twin_snapshots | /api/digital-twin?view=dashboard | 5 min | admin, executive |
| Revenue Simulation | digital_twin_simulations | /api/digital-twin?view=revenue | On demand | admin, executive |
| Forecast Accuracy | digital_twin_forecast_accuracy | /api/digital-twin?view=forecast | Daily | admin |
| Patient Twin Scores | patient_influence_scores | /api/digital-twin?view=patients | 15 min | admin, doctor |

### ALICE Intelligence Panels (New — Phase 12)

| Panel Name | Data Source | API Route | Refresh Cadence | Access Role |
|---|---|---|---|---|
| Executive Briefing | alice_executive_briefings | /api/alice/executive-briefing?view=latest | 15 min | executive, admin |
| Intelligence Score | alice_executive_briefings (score) | /api/alice/executive-briefing?view=latest | 15 min | executive |
| Recommendation Feed | alice_recommendation_feedback | /api/alice/executive-briefing?view=feedback | Daily | admin |
| Knowledge Health | alice_knowledge_versions | /api/alice/executive-briefing?view=knowledge | Daily | admin |

### Workflow Panels

| Panel Name | Data Source | API Route | Refresh Cadence | Access Role |
|---|---|---|---|---|
| Journey Performance | mission_control_events | /api/mission-control?view=journeys | 5 min | admin, staff |
| Workflow Health | workflow_os tables | /api/mission-control?view=health | 5 min | admin |
| Active Journeys | runtime_event_fabric_events | /api/mission-control?view=active | Real-time | admin, staff |
| Automation Triggers | automation event log | /api/mission-control?view=triggers | 5 min | admin |

### Recovery Center Panels (New — Phase 12)

| Panel Name | Data Source | API Route | Refresh Cadence | Access Role |
|---|---|---|---|---|
| Recovery Center | workflow_recovery_events | /api/workflow-recovery?view=dashboard | 2 min | admin |
| Recovery Actions | workflow_recovery_actions | /api/workflow-recovery?view=actions | 2 min | admin |
| Stability Metrics | workflow_recovery_metrics | /api/workflow-recovery?view=metrics | 5 min | admin, executive |
| MTTR Tracker | workflow_recovery_metrics | /api/workflow-recovery?view=mttr | Daily | admin |

### Video Performance Panels

| Panel Name | Data Source | API Route | Refresh Cadence | Access Role |
|---|---|---|---|---|
| Video Performance | video_engagement_os tables | /api/mission-control?view=video | 15 min | admin |
| Video ROI | revenue_attribution_records (source=video) | /api/mission-control?view=video-roi | Daily | admin, executive |
| Journey Video Metrics | Per-journey video stats | /api/mission-control?view=journey-video | 15 min | admin |

### Patient Intelligence Panels

| Panel Name | Data Source | API Route | Refresh Cadence | Access Role |
|---|---|---|---|---|
| Patient Influence Scores | patient_influence_scores | /api/mission-control?view=patients | 15 min | admin, doctor |
| Journey Completions | patient journey events | /api/mission-control?view=completions | 5 min | admin, staff |
| High-Value Patient List | patient + revenue data | /api/mission-control?view=high-value | Daily | admin, doctor |

### Pilot Milestone Panels

| Panel Name | Data Source | API Route | Refresh Cadence | Access Role |
|---|---|---|---|---|
| Pilot Milestone Tracker | pilot_milestones | /api/mission-control?view=pilot | Real-time | executive, admin |
| War Room | All systems alert aggregator | /api/mission-control?view=war-room | Real-time | executive, admin |
| System Health Summary | All system health endpoints | /api/mission-control?view=system | 1 min | admin |

---

## 4. Panel Count Summary

| Category | Panel Count |
|---|---|
| Revenue Panels | 6 |
| Commercial Panels (new) | 4 |
| Digital Twin Panels (new) | 4 |
| ALICE Intelligence Panels (new) | 4 |
| Workflow Panels | 4 |
| Recovery Center Panels (new) | 4 |
| Video Performance Panels | 3 |
| Patient Intelligence Panels | 3 |
| Pilot / War Room Panels | 3 |
| **Total** | **35** |

---

## 5. Refresh Cadence Summary

| Cadence | Panels | Use Case |
|---|---|---|
| Real-time (event-driven) | Active Journeys, Pilot Milestones, War Room | Critical monitoring |
| 1 minute | System Health Summary | Operational awareness |
| 2 minutes | Recovery Center, Recovery Actions | Self-healing monitoring |
| 5 minutes | Revenue, Commercial, Workflow, Practice Twin | Business metrics |
| 15 minutes | ALICE Executive Briefing, Video, Patients | Intelligence outputs |
| Daily | Forecast Accuracy, Knowledge Health, Video ROI | Strategic metrics |
| On demand | Revenue Simulation | Interactive analysis |
| On update | Package Catalog | Configuration views |

---

## 6. Event Fabric → Mission Control Routing

All Event Fabric events dual-write to `mission_control_events`:

```
publishRuntimeFabricEvent(event)
  → writes to runtime_event_fabric_events
  → writes to mission_control_events (dual-write)
  → triggers relevant panel refresh via server-sent events
```

Critical events (risk detected, workflow failure, recovery triggered) additionally:
- Set `war_room_alert = true` in `mission_control_events`
- Trigger war room panel notification
- Generate ALICE executive briefing if score drops below 60

---

## 7. No Duplicate Dashboards Policy

| System | Enforcement |
|---|---|
| Commercial OS | No standalone Commercial dashboard; all data via Mission Control Commercial panels |
| Digital Twin OS | No standalone Twin dashboard; all data via Mission Control Digital Twin panels |
| ALICE Executive | No standalone ALICE dashboard; briefings visible in Mission Control ALICE panels |
| Workflow Recovery | No standalone Recovery dashboard; all data via Mission Control Recovery panels |
| Revenue OS | No standalone Revenue dashboard outside Mission Control |

Any future system added to the platform must route its executive visibility through Mission Control panels. Standalone dashboards are prohibited.

---

## 8. Access Control Matrix

| Role | Revenue | Commercial | Digital Twin | ALICE | Workflow | Recovery | Video | Patients | Pilot |
|---|---|---|---|---|---|---|---|---|---|
| executive | Read | Read | Read | Read | - | Read (metrics) | - | - | Read |
| admin | Read | Read | Read | Read | Read | Read | Read | Read | Read |
| doctor | - | - | - | - | - | - | - | Read | - |
| staff | - | - | - | - | Read (journeys) | - | - | Read (completions) | - |

---

## 9. War Room Protocol

Triggered when any of these conditions are met:
- Intelligence score < 40 (Critical)
- Workflow failure rate > 25%
- MRR drop > 20% month-over-month
- 3+ simultaneous recovery events

War room activates:
1. War Room panel surfaces to top of Mission Control
2. ALICE generates emergency executive briefing
3. All critical alerts consolidated in single view
4. CTO notification via configured webhook

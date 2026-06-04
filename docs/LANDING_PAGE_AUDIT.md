# Landing Page Audit — Zenith AI Automation Agency

## CURRENT STATE SUMMARY

The homepage (`app/page.tsx` → `components/public/pros-landing.tsx`) is a 843-line engineering showcase. It exposes internal architecture, backend telemetry, and developer tools to the public. The primary conversion asset (the assessment) is buried below six sections of technical content.

---

## SECTION-BY-SECTION AUDIT

### Navigation (`navItems` array, site-header.tsx)
| Item | Decision | Reason |
|------|----------|--------|
| Platform | REWRITE | Rename to "Solutions" — outcome-focused |
| Screens | REMOVE | Engineering term; exposes UI architecture |
| Leaks | REWRITE | Rename to "Revenue Leaks" — keep concept, improve label |
| Playbooks | REWRITE | Rename to "Results" — outcome language |
| Intelligence | MOVE TO INTERNAL | Exposes AI architecture name |
| Mission Control | MOVE TO INTERNAL | Internal operational term |
| PMS Ops | MOVE TO INTERNAL | Developer/operator term |
| Assessment | KEEP | Primary conversion item |
| Route Probe button | REMOVE | Developer tool, never for public |
| Login/Signup/Dashboard (site-header) | MOVE TO INTERNAL | Wrong audience |

**New nav:** Assessment · Solutions · Results · About · Case Studies · Contact + CTA: Start Free Assessment

---

### Hero Section (`#platform`)
| Element | Decision | Reason |
|---------|----------|--------|
| Zenith logo | KEEP | Brand identity |
| Background dental image | KEEP | Clinical credibility |
| "Patient Revenue Operating System™" badge | REWRITE | Outcome language: remove trademark badge, keep concept |
| H1: "Recover lost revenue. Reduce no-shows. Fill chairs. Grow production." | REWRITE | Simplify to 3-line emotional hook |
| P: "Zenith PROS turns patient operations into a measurable revenue system: Revenue Playbooks, Practice Intelligence, Mission Control, Workflow OS, and PMS operations..." | REMOVE | Lists internal system names |
| CTAs: Get My Free Assessment + Watch Demo | KEEP | Good conversion anchors |
| Mission Control Preview card (right col) | REMOVE | Shows "0 assessments", "0 revenue", runtime traces — destroys trust |
| Runtime stats, error counts, "Backend summary snapshot" label | REMOVE | Internal telemetry on public page |

---

### PMS Ecosystem Bar
| Element | Decision | Reason |
|---------|----------|--------|
| "Dental revenue operations ecosystem" label | REWRITE | Too technical; rename "Works With Your Practice Software" |
| PMS names (Open Dental, Dentrix, etc.) | KEEP | Buyer validation |
| Developer language | REMOVE | — |

---

### Gallery Section (`#gallery`, `galleryModes`)
| Element | Decision | Reason |
|---------|----------|--------|
| Gallery mode switcher (Demo/Sandbox/Live) | REMOVE | Internal deployment concept |
| Mission Control Command card | REMOVE | Shows dispatch logs, internal status labels |
| "Active Dispatch Log" | REMOVE | Internal architecture |
| PMS Integration Translator card | REMOVE | Shows schema mapping, adapter fields, writeback logs |
| "Schema compiler" badge | REMOVE | Developer language |
| txt_pat_id ===== patient_id mapping | REMOVE | Trade secret / IP exposure |
| "Thread safety parameter locks" | REMOVE | Developer language |
| Operatory Room 4 hotspot | REWRITE | Keep dental imagery, remove hotspot telemetry UI |
| "Hotspot telemetry diagnostics" | REMOVE | Internal tooling |
| "Workspace diagnostics pool: connected" | REMOVE | Internal status |
| Intelligence action cards (43 overdue recalls, etc.) | REWRITE | Keep as LIZ insight cards — remove "Queue action" button, remove internal labels |
| "Simulate Dispatch" button | REMOVE | Internal concept |
| Section heading mentioning "PMS mapping, operatory hotspot scanning" | REWRITE | Outcome language |

**Replace with:** Visual story gallery — 5 slides, outcome narrative, no architecture.

---

### Revenue Leaks Section (`#leaks`)
| Element | Decision | Reason |
|---------|----------|--------|
| Seven leak cards with stats | KEEP | High-conversion content |
| Section body: "Each leak maps to a measurable workflow, attribution path..." | REWRITE | Remove technical attribution language |
| Icons | KEEP | Visual clarity |
| Stats (18-25%, $42K, etc.) | KEEP | Credibility |

---

### Playbooks Section (`#playbooks`)
| Element | Decision | Reason |
|---------|----------|--------|
| Section heading: "Install playbooks that create workflows, triggers, attribution, and monitoring" | REWRITE | Too technical |
| Playbook cards (No Show Prevention, Recall Recovery, etc.) | REWRITE | Keep titles, rewrite trigger/output language for buyers |
| "trigger" field labels | REWRITE | Rename to "When" |
| "output" field labels | REWRITE | Rename to "Result" |

---

### Intelligence/ALICE Section (`#alice`)
| Element | Decision | Reason |
|---------|----------|--------|
| "Practice Intelligence" eyebrow | KEEP | Appropriate |
| "A dental revenue advisor that speaks in actions, not dashboards" | KEEP | Strong positioning line |
| Body referencing "backend runtime and analytics modules" | REWRITE | Internal language |
| Bot icon labeled "Daily Performance Summary" | REWRITE | Rename card to "Revenue Recovery Advisor" |
| "Mission Control should watch integration writeback latency before go-live" | REMOVE | Exposes internal architecture + "go-live" is agent language |
| "sandbox copy is labeled where live data is unavailable" | REMOVE | Exposes internal state |
| LIZ name | KEEP | Rename ALICE references to LIZ for public page |

---

### Mission Control Section (`#mission-control`)
| Element | Decision | Reason |
|---------|----------|--------|
| Entire section | MOVE TO INTERNAL | Mission Control is an authenticated experience only |
| Tabbed preview (revenue/runtime/operations/alice/executive) | MOVE TO INTERNAL | Exposes runtime scores, error counts, dispatch state |

---

### PMS Ops Section (`#pms-ops`)
| Element | Decision | Reason |
|---------|----------|--------|
| Entire section | MOVE TO INTERNAL | Schema mapping, writeback, connector profiles are internal |
| PMS selector + terminal log | MOVE TO INTERNAL | Developer tooling |
| "WRN production PMS claims require live credential validation" | REMOVE | Destroys trust |
| "INF sync health check queued" | REMOVE | Internal state |

---

### Role Workspaces Section (`#role-workspaces`)
| Element | Decision | Reason |
|---------|----------|--------|
| Entire section | REMOVE | "Sandbox Preview" labels + internal queue language; confuses buyers |
| "Front Desk Operations Center Sandbox Preview" | REMOVE | Internal prototype label |
| "100% sync integrity check" | REMOVE | Internal metric |
| "Validate PMS writeback exceptions" | REMOVE | Internal operation |
| Role concepts (owner, manager, etc.) | MERGE INTO Implementation Timeline | Keep role differentiation without internal labels |

---

### ROI Engine Section (`#roi-engine`) — separate sliders
| Element | Decision | Reason |
|---------|----------|--------|
| Sliders section above RoiFunnelForm | REMOVE | Duplicate of the full assessment below — redundant |
| RoiFunnelForm | KEEP | Primary conversion asset — keep intact |

---

### RoiFunnelForm (assessment engine)
| Element | Decision | Reason |
|---------|----------|--------|
| Entire form | KEEP | Core conversion asset |
| Sliders + live calculation | KEEP | Strong interactive hook |
| Lead gate | KEEP | Proper progressive disclosure |
| "Mission Control lead" language in gate banner | REWRITE | Replace with outcome language |
| "the platform has enough signal" | REWRITE | Replace with "Your practice profile is ready" |
| LiveChart label "Mission Control Results" | REWRITE | Rename "Revenue Breakdown" |
| AuditPreview | KEEP | Conversion element |
| MobileResultsPanel | KEEP | Mobile conversion |

---

### Deployment/Installation Section (`#deployment`)
| Element | Decision | Reason |
|---------|----------|--------|
| 9-step list | KEEP | Buyer education |
| Step detail panel | REWRITE | "tenant safety", "rollback path known", "evidence captured" → plain language |
| "Owner assigned", "Evidence captured", "Rollback path known" | REWRITE | Internal governance language |
| Section body mentioning "PMS handshake", "intelligence activation", "Mission Control" | REWRITE | Plain outcome language |

---

### FAQ Section
| Element | Decision | Reason |
|---------|----------|--------|
| FAQ 1 (PMS replacement) | KEEP | Common buyer objection |
| FAQ 2 (pilot) | REWRITE | References "route access", "tenant controls" — internal language |
| FAQ 3 (ROI attribution) | REWRITE | "trigger, workflow, execution, runtime trace, attribution record" — all internal |
| Final CTA block | KEEP | Good conversion close |

---

### Footer
| Element | Decision | Reason |
|---------|----------|--------|
| Legal entity name | KEEP | Required |
| Copyright | KEEP | Required |
| Navigation structure | REWRITE | 4-column outcome-focused footer |
| "A product and service of" | KEEP | Attribution |
| Platform architecture references | REMOVE | None currently in footer |

---

### Route Probe Panel (aside)
| Element | Decision | Reason |
|---------|----------|--------|
| Entire panel | REMOVE | Developer tool: probes `/api/alice/recommendations`, `/api/enterprise/integrations`, etc. on public page |

---

### server data passed to page (app/page.tsx)
| Element | Decision | Reason |
|---------|----------|--------|
| `getRuntimeHealthState()` call | REMOVE | Runtime health is not a public metric |
| `runtimeOperationalScore`, `activeAutomations`, `runtimeErrorCount` | REMOVE | Internal telemetry |
| `revenueRecovered`, `assessments`, `practiceHealthScore` | KEEP (conditionally) | Only use if non-zero; guard with null-check |
| JSON-LD `SoftwareApplication` type | REWRITE | Change to `LocalBusiness` or `MedicalBusiness` |

---

## SUMMARY TABLE

| Category | Count |
|----------|-------|
| KEEP | 18 elements |
| REMOVE | 34 elements |
| REWRITE | 22 elements |
| MERGE | 3 elements |
| MOVE TO INTERNAL | 5 sections |

## ESTIMATED CONTENT REDUCTION

- Current sections: 12
- New sections: 9
- Technical language instances removed: ~40
- Components deleted: Route Probe Panel, Mission Control Preview (hero), Gallery mode switcher, PMS Ops section, Role Workspaces section, separate ROI sliders section
- Estimated content reduction: **68%**

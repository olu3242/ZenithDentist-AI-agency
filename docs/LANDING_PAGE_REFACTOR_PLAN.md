# Landing Page Refactor Plan

## Architecture

### New Page Structure
```
app/page.tsx (server component — simplified data fetch)
components/public/
  site-header.tsx        ← full rewrite
  pros-landing.tsx       ← full rewrite (main file)
  roi-funnel-form.tsx    ← keep, minor copy fixes
  liz-chat-widget.tsx    ← keep as-is
  audit-preview.tsx      ← keep as-is
  booking-flow.tsx       ← keep as-is
  faq.tsx                ← keep as-is
  site-footer.tsx        ← new file
```

### Section Order (new)
1. HEADER (sticky, premium nav)
2. HERO (outcome headline, no backend metrics card)
3. TRUST BAR (PMS names + assessment stats)
4. ASSESSMENT (RoiFunnelForm — primary conversion)
5. REVENUE LEAKS (7 leak cards, clean copy)
6. LIZ SECTION (Revenue Recovery Advisor)
7. STORY GALLERY (5-slide horizontal scroll, outcomes only)
8. IMPLEMENTATION TIMELINE (9-step, desktop horizontal / mobile vertical)
9. OUTCOMES GRID (8 outcome cards)
10. SAMPLE REPORT (executive dashboard preview)
11. SOCIAL PROOF (placeholder structure, ready for real data)
12. FINAL CTA (dark, large typography)
13. FOOTER (4-column)

---

## Data Layer Changes (app/page.tsx)

**Remove:**
- `getRuntimeHealthState()` — runtime data never shown publicly
- `runtimeOperationalScore`, `activeAutomations`, `runtimeErrorCount` props

**Keep:**
- `getAdminDashboardData()` — for `assessmentCount` and `practiceHealthScore`
- Pass only: `{ assessmentCount, revenueRecovery }` — both zero-guarded

**Simplify `landingStats` shape:**
```typescript
type LandingStats = {
  assessmentCount: number;
  revenueRecovery: number;
}
```

---

## Props Changes (ProsLanding)

**Remove from props:**
- `runtimeOperationalScore`
- `activeAutomations`
- `runtimeErrorCount`

**Keep:**
- `calendlyUrl: string`
- `landingStats: { assessmentCount: number; revenueRecovery: number }`

---

## State Changes

**Remove from component state:**
- `apiOpen` / `apiResponses` — Route Probe removed
- `missionTab` — Executive Dashboard section removed
- `role` — Role Workspaces section removed
- `pms` — PMS Ops section removed
- `galleryMode` — gallery mode switcher removed
- `hotspotOpen` — hotspot telemetry removed
- `monthlyAppointments`, `visitValue`, `noShowRate` — duplicate ROI sliders removed

**Keep:**
- `installStep` — for implementation timeline
- `openFaq` — for FAQ accordion (or move to separate component)

---

## Navigation Rewrite

Old nav: Platform · Screens · Leaks · Playbooks · Intelligence · Executive Dashboard · PMS Ops · Assessment  
New nav: Assessment · Solutions · Results · About · Case Studies · Contact

Old CTA: "Get My Free Assessment"  
New CTA: "Start Free Assessment"

---

## Removed Sections (complete deletion)

1. **Route Probe Panel** (`<aside>` with API probing)
2. **Executive Dashboard Preview card** (right column of hero)
3. **Gallery mode switcher** (Demo/Sandbox/Live)
4. **PMS Integration Translator gallery card** (schema mapping)
5. **Executive Dashboard Command gallery card** (dispatch logs)
6. **Operatory hotspot telemetry** (hotspot click interaction)
7. **Executive Dashboard section** (`#mission-control`) — move to authenticated
8. **PMS Ops section** (`#pms-ops`) — move to internal
9. **Role Workspaces section** (`#role-workspaces`) — remove entirely
10. **Duplicate ROI sliders** (the standalone `#roi-engine` section above RoiFunnelForm)

---

## Rewrites Required

| Location | Old | New |
|----------|-----|-----|
| Hero H1 | "Recover lost revenue. Reduce no-shows. Fill chairs. Grow production." | "Recover Lost Revenue. Fill More Chairs. Grow Predictably." |
| Hero body | Lists internal systems | Outcome description only |
| Alice card | "backend runtime and analytics modules" | Remove; show LIZ as "Revenue Recovery Advisor" |
| LiveChart title | "Executive Dashboard Results" | "Revenue Breakdown" |
| Lead gate banner | "platform has enough signal to generate Executive Dashboard lead" | "Your practice profile is complete" |
| FAQ 2 | References tenant controls | Plain: what is needed to start |
| FAQ 3 | "runtime trace, attribution record" | Plain ROI explanation |
| Install step panel | "tenant safety", "rollback path" | "readiness checkpoint", "transition plan confirmed" |
| JSON-LD type | SoftwareApplication | MedicalBusiness |

---

## IP Protection Checklist

The following must NOT appear on any public page:

- [ ] Automation Platform — ✓ removed
- [ ] Event Fabric — ✓ removed
- [ ] Recovery Orchestrator — ✓ removed
- [ ] Automation Registry — ✓ removed
- [ ] Schema Mapping — ✓ removed (PMS Ops section deleted)
- [ ] PMS Translation Layer — ✓ removed
- [ ] ALICE (internal name) — ✓ replaced with LIZ
- [ ] Route Probe — ✓ removed
- [ ] Dispatch Log — ✓ removed
- [ ] Runtime Health scores — ✓ removed
- [ ] txt_pat_id field mapping — ✓ removed
- [ ] "Sandbox" / "Live Bus" labels — ✓ removed
- [ ] "tenant", "writeback", "adapter" — ✓ removed
- [ ] "Simulate Dispatch" — ✓ removed
- [ ] Dead letters / retry queue — ✓ removed

---

## Files to Create

1. `docs/LANDING_PAGE_AUDIT.md` ✓
2. `docs/LANDING_PAGE_REFACTOR_PLAN.md` ✓ (this file)
3. `docs/NEW_NAVIGATION.md`
4. `docs/NEW_FOOTER.md`
5. `docs/NEW_HOMEPAGE_COPY.md`
6. `docs/NEW_GALLERY_ARCHITECTURE.md`
7. `docs/NEW_MOBILE_WIREFRAME.md`
8. `docs/NEW_DESKTOP_WIREFRAME.md`
9. `docs/LANDING_PAGE_CONVERSION_REPORT.md` (post-execution)

---

## Build Validation

After refactor:
```
npm run lint
npx tsc --noEmit --skipLibCheck
npm run build
```

# Mock Data Audit

## Status: CLEAN ✅ — No mock data in conversion path

---

## Audit Scope

Searched: `lib/`, `app/`, `components/` for patterns:
- `Math.random()`, `mock`, `demo`, `placeholder`, `hardcoded`, `fake`, `dummy`, `TODO`

---

## Findings

### Public Conversion Path — CLEAN

| File | Pattern Found | Classification | Action |
|------|--------------|----------------|--------|
| components/public/liz-chat-widget.tsx | `Math.random()` | Session ID generation | ✅ Acceptable — generates unique session token, not fake data |
| components/public/roi-funnel-form.tsx | "Sample data shown" | Explicit label | ✅ Acceptable — clearly labeled sample report section |
| components/public/pros-landing.tsx | "Sample practice data for illustration" | Explicit label | ✅ Acceptable — LIZ insight cards labeled as samples |

### Internal/Admin Path — Acceptable Patterns

| File | Pattern | Classification |
|------|---------|----------------|
| lib/security.ts | `placeholder` in comments | Internal only, not user-facing |
| lib/env.ts | `placeholder` in validation | Schema validation, not output |
| lib/tenant.ts | `placeholder` | Internal tenant scaffolding |
| lib/runtime/observability.ts | `mock` in type names | Internal observability types |

---

## ROI Calculator — No Hardcoded Values

Confirmed in `lib/roi.ts`:
- ✅ No `Math.random()` calls
- ✅ No hardcoded dollar amounts
- ✅ Default slider values are industry averages (not fake outputs)
- ✅ All calculations formula-driven from user inputs

---

## Assessment Engine Output — Confirmed Dynamic

Every number shown to the user in:
- AssessmentPreview (live during form fill)
- AuditPreview (post-submit unlock)
- LIZ report JSON

...is derived from `calculateRevenueProjection()` using the user's actual slider inputs.

---

## Sample/Illustration Content (Intentional)

These are explicitly labeled and acceptable:

1. **LIZ insight cards** on landing page — labeled "Sample practice data for illustration"
2. **Sample report section** — labeled "Sample data shown — your report uses real practice numbers"
3. **Default slider values** — industry averages used as starting point for UX, not outputs

---

## Verdict

No mock data in the conversion path. All user-facing numbers are real calculations from real inputs. Sample content is clearly labeled.

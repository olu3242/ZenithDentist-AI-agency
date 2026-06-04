# E2E Readiness Report

## Status: CODE READY — Environment Gated

**Date:** 2026-06-03

---

## E2E Test Readiness Matrix

| Test Scenario | Code Ready | DB Schema Ready | Live Test Ready |
|--------------|------------|-----------------|-----------------|
| CTA click → cta_events insert | ✅ | ✅ | ⚠️ needs service key |
| Assessment submit → lead + ROI + audit | ✅ | ✅ | ⚠️ needs service key |
| assessment_started event published | ✅ (FIXED) | ✅ | ⚠️ needs service key |
| Audit download HTML | ✅ | ✅ | ⚠️ needs service key |
| Calendly webhook → booking + opportunity | ✅ | ✅ | ⚠️ needs service key |
| opportunities.stage = booking_created | ✅ | ✅ | ⚠️ needs service key |
| Admin dashboard 9 metrics | ✅ | ✅ | ⚠️ needs service key |
| LIZ action API token protection | ✅ | ✅ | ⚠️ needs token config |
| Workflow recovery DLQ | ✅ | ✅ | ⚠️ needs service key |
| Mission Control panels | ✅ | ✅ | ⚠️ needs service key |

---

## What Works Right Now (Without Service Key)

The smoke test (9/9 passing) runs against the application layer without a live Supabase connection. The following was verified:

```
✓ Homepage renders (200)
✓ POST /api/analytics/cta — accepts CTA event (graceful no-op without DB)
✓ POST /api/analytics/cta — handles empty body gracefully (400)
✓ POST /api/analytics/faq — accepts event
✓ POST /api/roi-assessment — validates payload (400 for invalid)
✓ POST /api/calendly/events — rejects empty payload (400)
✓ POST /api/calendly/events — accepts valid Calendly payload (200, graceful)
✓ GET /api/audit/[id]/download — returns 404 for unknown id
✓ GET /admin — redirects or renders (not 500)
```

All API routes degrade gracefully when Supabase is unavailable — they return `ok: false` rather than 500. This is correct behavior.

---

## E2E Prerequisites

### Step 1: Environment Setup (~10 min)
```bash
# Get from app.supabase.com/project/yjbxhlfiwqhhuvgpcrey/settings/api
echo "NEXT_PUBLIC_SUPABASE_URL=https://yjbxhlfiwqhhuvgpcrey.supabase.co" >> .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>" >> .env.local
echo "SUPABASE_SERVICE_ROLE_KEY=<service_role_key>" >> .env.local
echo "ZENITH_INTERNAL_TOKEN=<internal_token>" >> .env.local
echo "CALENDLY_URL=<calendly_url>" >> .env.local
echo "RESEND_API_KEY=<resend_key>" >> .env.local
```

### Step 2: Push Migrations (~10 min)
```bash
export SUPABASE_ACCESS_TOKEN=<personal_access_token>
npx supabase db push --project-ref yjbxhlfiwqhhuvgpcrey
```

### Step 3: Run E2E Test (~10 min)
```bash
npm run dev &
sleep 5
npm run smoke
# Expected: all checks pass with real DB inserts
```

### Step 4: Verify in Admin
- Visit `/admin` → confirm 9 metric cards load with real data
- Submit assessment form → confirm lead appears in CRM table
- Check Mission Control → confirm events visible

---

## E2E Test Scenarios (Post-Setup)

### Scenario 1: Full Revenue Funnel
1. `POST /api/analytics/cta` with sessionId + UTM → verify `cta_events` row
2. Submit assessment form → verify `leads`, `roi_calculations`, `audits`, `opportunities` created
3. Check `outreach_events` → verify `assessment_started` + `assessment_completed` + `audit_generated` + `opportunity_created`
4. `GET /api/audit/[auditId]/download` → verify HTML returned
5. Simulate Calendly webhook → verify `bookings` row with `assessment_id`, `leads.status = "booked"`, `opportunities.stage = "booking_created"`
6. Check admin → verify all 9 metrics show real data

### Scenario 2: Error Handling
1. Submit invalid assessment → verify `ok: false, fieldErrors`
2. Send Calendly webhook with missing UTM → verify graceful booking creation without lead link
3. Download non-existent audit → verify 404

### Scenario 3: Security
1. `POST /api/liz/action` without token → verify 401
2. `GET /admin` without auth cookie → verify redirect to login
3. `GET /internal` without auth cookie → verify redirect

---

## Estimated Time to E2E Ready

| Task | Time |
|------|------|
| Service key rotation | 5 min |
| Migration push | 10 min |
| Smoke test verification | 5 min |
| E2E manual testing | 20 min |
| **Total** | **~40 min** |

## Result: READY TO TEST — blocked only by environment credentials

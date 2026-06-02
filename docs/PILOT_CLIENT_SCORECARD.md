# Pilot Client Scorecard
**Sprint:** release/platform-convergence  
**Date:** 2026-06-02  
**Purpose:** Simulate end-to-end pilot client journey and score each step

---

## End-to-End Journey Simulation

### Step 1: Lead Submits ROI Form on Landing Page
- **What happens:** Prospect submits ROI calculator on landing page; form data captured
- **Implementation:** Landing page and ROI form implemented; `lib/commercial-operations.ts` handles lead capture
- **Gap:** No automated CRM record creation; leads require manual follow-up
- **Score: PARTIAL** — form exists, no automated lead-to-CRM pipeline

---

### Step 2: Admin Creates `client_accounts` Record
- **What happens:** Admin manually creates a `client_accounts` row in Supabase with client details
- **Implementation:** `client_accounts` table exists; internal admin UI accessible at `/internal/client-approvals`
- **Gap:** No self-serve onboarding form that auto-creates the record; fully manual
- **Score: MANUAL** — admin creates record directly

---

### Step 3: Payment Link Sent → Payment Processed → Stripe Webhook → Auto-Activation
- **What happens:** Admin sends Stripe payment link; client pays; `checkout.session.completed` fires; `activateClientFromPayment()` sets `subscription_active = true` and `approved_for_access = true`
- **Implementation:** `app/api/webhooks/stripe/route.ts` handles activation; `lib/stripe/operations.ts` performs DB update
- **Gap:** Cannot be E2E tested without live Stripe credentials; webhook endpoint must be registered in Stripe dashboard
- **Score: PASS** — code complete; requires live credential configuration

---

### Step 4: Email Added to `authorized_domains`
- **What happens:** Client's email domain is inserted into `authorized_domains` table to permit Google OAuth login
- **Implementation:** Table exists; admin inserts row via Supabase dashboard or admin UI
- **Gap:** Not automated within `activateClientFromPayment()`; requires manual admin step
- **Score: MANUAL** — must be done by admin after activation

---

### Step 5: Client Receives Google OAuth Invitation
- **What happens:** Admin sends Google Workspace invitation to client's email; client accepts
- **Implementation:** Google OAuth configured; `middleware.ts` checks `authorized_domains` on login attempt
- **Gap:** No automated email invitation workflow; invitation sent manually
- **Score: MANUAL** — Google invitation is manual

---

### Step 6: Portal Login → Onboarding Flow
- **What happens:** Client authenticates via Google OAuth; middleware validates domain; bootstrap onboarding flow starts
- **Implementation:** `middleware.ts` access control implemented; onboarding bootstrap flow implemented; `client_accounts` approval gates enforced
- **Score: PASS** — login and onboarding flow functional

---

### Step 7: Workflow Launch (Recall Recovery, No-Show Prevention)
- **What happens:** Admin or client triggers recall recovery and no-show prevention workflows from portal
- **Implementation:** n8n webhook at `app/api/webhooks/n8n/route.ts` processes workflow triggers; `workflow_executions` records created
- **Gap:** n8n workflow configurations must be manually imported and configured in n8n instance
- **Score: PARTIAL** — platform side complete; n8n instance setup is manual

---

### Step 8: Patient Engagement Tracked
- **What happens:** Video delivered; patient watches; behavioral signals and engagement data written to DB
- **Implementation:** `video_deliveries` table captures delivery and watch events; `behavioral_signals` and `patient_engagements` tables record engagement; `lib/video-engagement-os.ts` orchestrates
- **Score: PASS** — tracking schema and logic complete

---

### Step 9: Revenue Attribution Recorded
- **What happens:** Workflow completion triggers `revenue_attribution_records` insert; video conversion triggers `video_attribution_records` insert
- **Implementation:** Fixed this sprint — all four revenue engines now write attribution records
- **Score: PASS** — attribution chain complete

---

### Step 10: Executive Report Generated
- **What happens:** Client views portal dashboard; `getPortalData()` and `calculatePracticeHealth()` serve real metrics; revenue attribution totals displayed
- **Implementation:** `app/portal/page.tsx` with real data functions; no mocks
- **Score: PASS** — real-data reporting confirmed

---

## Step Scores Summary

| Step | Score |
|---|---|
| 1. Lead ROI form submission | PARTIAL |
| 2. Admin creates client_accounts record | MANUAL |
| 3. Stripe payment → auto-activation | PASS |
| 4. authorized_domains entry | MANUAL |
| 5. Google OAuth invitation | MANUAL |
| 6. Portal login → onboarding | PASS |
| 7. Workflow launch | PARTIAL |
| 8. Patient engagement tracked | PASS |
| 9. Revenue attribution recorded | PASS |
| 10. Executive report generated | PASS |

---

## Readiness Scores

| Dimension | Score | Notes |
|---|---|---|
| **Commercial Readiness** | 7/10 | Stripe automation complete; manual gates remain for domain/invitation |
| **Technical Readiness** | 8/10 | Core platform functional; E2E test blocked on live credentials |
| **Operational Readiness** | 6/10 | 3 of 10 steps are manual; acceptable for pilot with 1-2 clients |
| **Patient OS Readiness** | 7/10 | Schema complete; Open Dental ingestion live; no unified intelligence layer |
| **Revenue Attribution Readiness** | 8/10 | All engines writing attribution; reconciliation not automated |

**Overall Pilot Readiness: 7.2/10 — READY FOR PILOT (supervised)**

Manual steps 2, 4, and 5 are acceptable for a 1-2 client pilot where the Zenith team directly manages onboarding. Automation of these steps is the primary post-pilot engineering priority.

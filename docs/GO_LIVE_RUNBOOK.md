# Zenith Patient OS™ — Go-Live Runbook

> Operational runbook for launching a pilot practice. Follow each step in sequence. Do not skip verification checks.

---

## Pre-Launch Checklist

Before executing any Day 0 steps, confirm all 8 items are cleared.

| # | Item | Verified By | Notes |
|---|------|-------------|-------|
| 1 | Practice owner contract signed | CSM | client_accounts.contract_signed = true |
| 2 | Setup fee collected | Finance | client_accounts.setup_fee_paid = true |
| 3 | PMS access credentials received | CSM | OpenDental username + password or API key |
| 4 | Provider video assets collected | CSM | 2+ minutes of footage per provider |
| 5 | Provider audio samples collected | CSM | 60+ seconds per provider |
| 6 | Communication phone number provisioned | Engineering | Twilio number reserved |
| 7 | Practice email domain verified | Engineering | Resend domain DNS records confirmed |
| 8 | Staging environment validated | Engineering | All APIs responding, no migration errors |

---

## Day 0: Environment Setup

### 1. Set Required Environment Variables

```bash
# Core infrastructure
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Communication providers
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE=+15551234567

EMAIL_PROVIDER=resend
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=hello@practice.com

# AI provider keys (optional — pilots proceed without these)
HEYGEN_API_KEY=...
ELEVENLABS_API_KEY=...

# Application
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://app.zenithdentist.ai
```

### 2. Deploy to Production

```bash
git push origin release/platform-convergence
```

CI/CD pipeline runs:
1. Type checks + linting
2. Database migration dry-run
3. Production deployment

**Verify deployment**:
```bash
curl -s https://app.zenithdentist.ai/api/health | jq .
# Expected: { "status": "ok", "db": "connected" }
```

---

## Day 1: Client Activation

### Step 1: Create Organization

```
POST /api/internal/organizations
{
  "name": "Smile Dental Group",
  "slug": "smile-dental",
  "plan": "growth",
  "metadata": {
    "practiceType": "general_dentistry",
    "providerCount": 2,
    "locationCount": 1
  }
}
```

Save the returned `organizationId` — you will use it in every subsequent call.

### Step 2: Activate Client Account

```
POST /api/internal/activate-client
{
  "organizationId": "org_uuid",
  "contractSigned": true,
  "setupFeePaid": true,
  "packageType": "growth",
  "monthlyFee": 997
}
```

**Verify**:
```sql
SELECT status, package_type FROM client_accounts WHERE organization_id = 'org_uuid';
-- Expected: status='active'
```

### Step 3: Install OpenDental Integration

```
POST /api/integrations
{
  "organizationId": "org_uuid",
  "integrationKey": "opendental",
  "credentials": {
    "apiUrl": "http://practice-server:27352",
    "username": "admin",
    "password": "..."
  }
}
```

**Verify**:
```
GET /api/integrations?organizationId=org_uuid
-- Check: integrationKey='opendental', status='active'
```

### Step 4: Install Twilio Integration

```
POST /api/integrations
{
  "organizationId": "org_uuid",
  "integrationKey": "twilio",
  "credentials": {
    "accountSid": "AC...",
    "authToken": "...",
    "phoneNumber": "+15551234567"
  }
}
```

### Step 5: Install Resend Integration

```
POST /api/integrations
{
  "organizationId": "org_uuid",
  "integrationKey": "resend",
  "credentials": {
    "apiKey": "re_...",
    "fromEmail": "hello@practice.com",
    "fromName": "Smile Dental Group"
  }
}
```

### Step 6: Create Implementation Project

```
POST /api/pilot
{
  "action": "create_project",
  "organizationId": "org_uuid",
  "projectName": "Smile Dental — Pilot Launch",
  "targetGoLiveDate": "2026-01-15"
}
```

Save the returned `projectId`.

**Rollback (Day 1)**: If activation fails, set `client_accounts.status = 'suspended'`. No patient data has been imported yet — rollback is safe.

---

## Day 2: Provider Setup

### Step 1: Create Provider Profile

```
POST /api/digital-dentist-twin
{
  "organizationId": "org_uuid",
  "providerName": "Dr. Sarah Chen",
  "providerExternalId": "dr_chen_opendental_id",
  "specialty": "general_dentistry"
}
```

Save `twinId`, `avatarProfileId`, `voiceProfileId`.

### Step 2: Dispatch Avatar Training (if API key available)

```
POST /api/avatar-studio
{
  "action": "dispatch_training",
  "avatarProfileId": "avatar_uuid",
  "provider": "heygen",
  "trainingAssets": [
    { "type": "video", "url": "https://...", "durationSeconds": 130 }
  ]
}
```

### Step 3: Dispatch Voice Training (if API key available)

```
POST /api/voice-studio
{
  "action": "dispatch_training",
  "voiceProfileId": "voice_uuid",
  "provider": "elevenlabs",
  "trainingSamples": [
    { "url": "https://...", "durationSeconds": 65 }
  ]
}
```

### Step 4: Verify Journey Library

```
GET /api/journeys?organizationId=org_uuid&view=templates
```

Confirm global templates exist for: `new_patient`, `recall`, `no_show_recovery`, `review_request`.

If templates are missing, seed them:
```
POST /api/journeys
{ "action": "seed_global_templates", "organizationId": "org_uuid" }
```

**Rollback (Day 2)**: Delete provider profile. No communications have been sent.

---

## Day 3: Journey Activation

### Step 1: Import Test Patient from PMS

```
POST /api/integrations/sync
{
  "organizationId": "org_uuid",
  "integrationKey": "opendental",
  "syncType": "patients",
  "limit": 5
}
```

**Verify**:
```
GET /api/patients?organizationId=org_uuid&limit=5
-- Confirm: 5 patients imported with phone/email populated
```

### Step 2: Assign Test Patient to Welcome Journey

```
POST /api/journeys
{
  "action": "assign",
  "organizationId": "org_uuid",
  "journeyType": "new_patient",
  "patientId": "patient_uuid"
}
```

Save `assignmentId`.

### Step 3: Schedule Journey Steps

```
POST /api/pilot
{
  "action": "schedule_journey_steps",
  "organizationId": "org_uuid",
  "assignmentId": "assignment_uuid"
}
```

### Step 4: Verify Scheduled Steps

```
GET /api/pilot?organizationId=org_uuid
```

Check `journey_health.active_assignments >= 1` and `journey_health.scheduled_steps_due = 0` (steps should be future-dated).

**Rollback (Day 3)**: Delete journey assignment. Scheduled steps are not yet due — no communications sent.

---

## Day 7: First Delivery Verification

### Step 1: Check for Due Steps

```
GET /api/pilot?organizationId=org_uuid
```

If `journey_health.scheduled_steps_due > 0`: execute them.

### Step 2: Execute Due Steps

```
POST /api/pilot
{
  "action": "execute_due_steps",
  "organizationId": "org_uuid"
}
```

### Step 3: Verify Delivery

```
GET /api/pilot?organizationId=org_uuid
```

Confirm:
- `journey_health.steps_delivered_mtd >= 1`
- `journey_health.steps_failed = 0`

### Step 4: Check ALICE Recommendations

```
GET /api/agents/recommendations?organizationId=org_uuid&status=pending
```

Confirm ALICE has generated at least 1 recommendation for the imported patients.

### Step 5: Record Pilot Health Event (if patient engaged)

```
POST /api/pilot
{
  "action": "record_event",
  "organizationId": "org_uuid",
  "eventType": "patient_engaged",
  "metadata": { "patientId": "patient_uuid", "channel": "sms" }
}
```

---

## Day 14: Revenue Check

### Step 1: Check Attribution Score

```
GET /api/pilot?organizationId=org_uuid
```

Review `revenue_attribution_score`. If score = 0, proceed to Step 2.

### Step 2: Run ALICE Reconciliation

```
POST /api/pilot
{
  "action": "reconcile_alice",
  "organizationId": "org_uuid"
}
```

### Step 3: Review Client Health Score

```
GET /api/pilot/health?organizationId=org_uuid
```

Target: `overall_score >= 60` (yellow or better).

If score < 60, review the lowest-scoring dimension and address it.

**Rollback (Day 14)**: No destructive rollback needed. If revenue attribution is absent, the system continues operating — attribution will be recorded as engagements convert.

---

## Common Issues and Fixes

| Issue | Likely Cause | Fix |
|-------|-------------|-----|
| Steps not delivering | Twilio/Resend not configured | Verify integration credentials, check API keys |
| PMS sync returning 0 patients | Incorrect OpenDental API URL | Test connection: `GET /api/integrations/test?orgId=...` |
| ALICE generating 0 recommendations | Patient influence scores not calculated | `POST /api/agents/run { action: "recalculate_scores" }` |
| Avatar training stuck at 'queued' | HEYGEN_API_KEY not set | Add key to environment, re-dispatch training |
| Health score not updating | calculateClientHealthScore not triggered | `POST /api/pilot/health { action: "recalculate" }` |

---

## Rollback Procedures (Summary)

| Phase | Rollback Action | Data Impact |
|-------|----------------|------------|
| Day 0 | Remove env vars, revert deployment | None |
| Day 1 | Set client_accounts.status = 'suspended' | No patient data yet |
| Day 2 | Delete provider profile | No communications yet |
| Day 3 | Delete journey assignments | No comms sent yet |
| Day 7+ | Pause journey executions | Patients may have been contacted |

---

## Escalation Contacts

| Tier | Contact | When to Escalate |
|------|---------|-----------------|
| CSM | Account CSM | Health score yellow 48h+ |
| Engineering | #zenith-ops Slack | Integration failures, API errors |
| Zenith Admin | admin@zenithdentist.ai | Data integrity issues, security concerns |

---

## Related Documents

- `docs/PILOT_OPERATIONS_OS.md` — Mission Control overview
- `docs/DIGITAL_DENTIST_TWIN_PROVISIONING.md` — Detailed twin setup
- `docs/30_DAY_ACTIVATION_PLAN.md` — Complete day-by-day timeline
- `docs/PILOT_REVENUE_VALIDATION.md` — Revenue validation queries

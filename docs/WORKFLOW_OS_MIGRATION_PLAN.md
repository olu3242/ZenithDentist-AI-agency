# Automation Platform Migration Plan — From n8n to Internal Execution

## Migration Status: COMPLETE for All Internal Workflows

All internal business logic, patient journey sequences, and communication delivery workflows have been successfully migrated from n8n to Automation Platform and the Communication Hub adapter layer. External connector workflows (Google review sync, third-party webhooks) are intentionally retained in n8n.

---

## Workflow Inventory

| Workflow | Type | Old Owner | New Owner | Status |
|----------|------|-----------|-----------|--------|
| `welcome_patient` | Patient OS | n8n | Automation Platform | MIGRATED |
| `appointment_prep` | Patient OS | n8n | Automation Platform | MIGRATED |
| `treatment_education` | Patient OS | n8n | Automation Platform | MIGRATED |
| `treatment_acceptance` | Patient OS | n8n | Automation Platform | MIGRATED |
| `post_treatment` | Patient OS | n8n | Automation Platform | MIGRATED |
| `review_request` | Patient OS | n8n | Automation Platform | MIGRATED |
| `recall_30day` | Patient OS | n8n | Automation Platform | MIGRATED |
| `recall_90day` | Patient OS | n8n | Automation Platform | MIGRATED |
| `referral_ask` | Patient OS | n8n | Automation Platform | MIGRATED |
| `membership_offer` | Patient OS | n8n | Automation Platform | MIGRATED |
| `video_delivery` | Video | n8n | Video Adapter | MIGRATED |
| `sms_delivery` | Comms | n8n | SMS Adapter | MIGRATED |
| `email_delivery` | Comms | n8n | Email Adapter | MIGRATED |
| `whatsapp_delivery` | Comms | n8n | WhatsApp Adapter | MIGRATED |
| `google_review_sync` | External | n8n | n8n (retained) | EXTERNAL — keep |
| `third_party_webhooks` | External | n8n | n8n (retained) | EXTERNAL — keep |

**Total workflows migrated: 14 of 14 internal workflows**
**External workflows retained in n8n: 2 (intentional)**

---

## Journey Library — 7 Patient OS Journeys

All 7 canonical Patient OS journeys are now managed by the Journey Library + Automation Platform:

| Journey Key | Description | Workflows Included |
|-------------|-------------|-------------------|
| `new_patient` | New patient welcome and onboarding | welcome_patient, appointment_prep |
| `appointment_prep` | Pre-appointment preparation sequence | appointment_prep, video_delivery |
| `treatment_education` | Education content for proposed treatment | treatment_education, video_delivery |
| `treatment_acceptance` | Acceptance follow-up and decision support | treatment_acceptance |
| `post_treatment` | Post-procedure care and review request | post_treatment, review_request |
| `recall` | 30-day and 90-day recall sequences | recall_30day, recall_90day |
| `referral` | Referral ask after positive experience | referral_ask |
| `membership` | Membership offer and enrollment | membership_offer |

---

## Communication Hub Adapter Mapping

| Channel | Adapter File | Provider Options |
|---------|-------------|-----------------|
| SMS | `lib/adapters/sms-adapter.ts` | `twilio`, `aws_sns`, `custom` |
| Email | `lib/adapters/email-adapter.ts` | `resend`, `sendgrid`, `aws_ses`, `smtp` |
| WhatsApp | `lib/adapters/whatsapp-adapter.ts` | `twilio_whatsapp`, `360dialog`, `custom` |
| Video | `lib/adapters/video-adapter.ts` | `video_intelligence` (internal) |
| Voice | `lib/adapters/voice-adapter.ts` | `elevenlabs`, `azure`, `google`, `twilio_voice` |
| Portal | `lib/adapters/portal-adapter.ts` | `internal` (patient_portal_items) |
| PMS | `lib/adapters/pms-adapter.ts` | `opendental`, `dentrix`, `eaglesoft`, `custom` |

---

## Environment Variables Required per Provider

### SMS (Twilio)
```
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
```

### SMS (AWS SNS)
```
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
```

### Email (Resend)
```
RESEND_API_KEY=
EMAIL_FROM_ADDRESS=
```

### Email (SendGrid)
```
SENDGRID_API_KEY=
EMAIL_FROM_ADDRESS=
```

### Email (AWS SES)
```
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
EMAIL_FROM_ADDRESS=
```

### WhatsApp (Twilio WhatsApp)
```
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=
```

### WhatsApp (360dialog)
```
WHATSAPP_360DIALOG_API_KEY=
WHATSAPP_FROM_NUMBER=
```

### Voice (ElevenLabs)
```
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
```

### Voice (Azure)
```
AZURE_SPEECH_KEY=
AZURE_SPEECH_REGION=
```

### Voice (Google)
```
GOOGLE_APPLICATION_CREDENTIALS=
```

### Voice (Twilio Voice)
```
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_VOICE_FROM=
```

---

## Rollback Plan

The `n8nAdapter` is retained in `lib/adapters/n8n-adapter.ts`. In the event of a critical adapter failure, any communication channel can be re-routed through n8n by:

1. Updating the `deliveryOwner` field in `lib/templates/channel-router.ts` back to `"n8n"` for the affected channel
2. Ensuring n8n webhook endpoints are configured and receiving
3. Confirming n8n delivery acknowledgement writes back to the evidence table

This rollback is reversible within minutes and does not require a full deployment. The n8n adapter is intentionally preserved for this purpose.

---

*Report generated: 2026-06-02 | Branch: release/platform-convergence*
